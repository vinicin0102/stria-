import type { NextApiRequest, NextApiResponse } from "next";
import { sendCapiEvent } from "../../lib/capi";
import { marcarPagoPorHash } from "../../lib/db";
import {
  assinaturaValida,
  consultarStatus,
  zuckpayConfigurado,
} from "../../lib/zuckpay";

// A assinatura é calculada sobre os bytes que chegaram. Deixar o Next
// desserializar e reserializar muda espaços, ordem e acentos escapados, e
// a conferência passaria a falhar sempre.
export const config = { api: { bodyParser: false } };

const LIMITE_BYTES = 64 * 1024;

function lerCorpoCru(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let total = 0;
    const partes: Buffer[] = [];
    req.on("data", (pedaco: Buffer) => {
      total += pedaco.length;
      if (total > LIMITE_BYTES) {
        reject(new Error("Corpo grande demais"));
        req.destroy();
        return;
      }
      partes.push(pedaco);
    });
    req.on("end", () => resolve(Buffer.concat(partes).toString("utf8")));
    req.on("error", reject);
  });
}

const primeiroTexto = (...valores: unknown[]) => {
  for (const v of valores) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!zuckpayConfigurado) {
    return res.status(500).json({ error: "Não configurado" });
  }

  let corpoCru: string;
  try {
    corpoCru = await lerCorpoCru(req);
  } catch {
    return res.status(400).json({ error: "Corpo inválido" });
  }

  // Só recusa quando há segredo configurado e a assinatura não bate. Sem
  // segredo, a confirmação depende inteiramente da consulta abaixo — que
  // é o que realmente decide, com ou sem assinatura.
  if (process.env.ZUCKPAY_WEBHOOK_SECRET) {
    const cabecalho = req.headers["x-zuckpay-signature"];
    if (!assinaturaValida(corpoCru, cabecalho)) {
      console.error("Webhook ZuckPay: assinatura inválida ou expirada");
      return res.status(401).json({ error: "Assinatura inválida" });
    }
  }

  let corpo: any = {};
  try {
    corpo = corpoCru ? JSON.parse(corpoCru) : {};
  } catch {
    return res.status(400).json({ error: "JSON inválido" });
  }

  const dados = corpo?.data ?? corpo;
  const transactionId = primeiroTexto(
    dados?.transactionId,
    dados?.transaction_id,
    dados?.id
  );
  const externalIdClient = primeiroTexto(
    dados?.external_id_client,
    dados?.externalIdClient
  );

  if (!transactionId && !externalIdClient) {
    return res.status(400).json({ error: "Identificador ausente" });
  }

  try {
    // Nada do corpo é levado em conta para decidir se foi pago: só o que a
    // própria ZuckPay confirma na consulta. Assim um postback forjado não
    // infla conversão nem libera acesso.
    const tx = await consultarStatus(
      transactionId ? { transactionId } : { externalIdClient }
    );

    if (!tx.pago) {
      return res.status(200).json({ ignored: "not_paid", status: tx.status });
    }

    const id = transactionId || primeiroTexto(tx.bruto?.transactionId, tx.bruto?.id);

    // O webhook chega mesmo se ela fechar a aba, então é a fonte mais
    // confiável para o painel saber quem realmente pagou.
    if (id) await marcarPagoPorHash(id);

    await sendCapiEvent({
      eventName: "Purchase",
      // Mesmo id do evento do navegador, para o Meta contar uma vez só.
      eventId: `purchase_${id}`,
      email: tx.email,
      phone: tx.telefone,
      value: tx.valor,
    });

    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Webhook ZuckPay:", error.message);
    // 202: a ZuckPay repete o aviso, e um 500 aqui faria parecer erro
    // permanente. O pagamento ainda é confirmado pela consulta do navegador.
    res.status(202).json({ retry: true });
  }
}
