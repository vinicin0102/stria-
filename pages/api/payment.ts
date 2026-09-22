import type { NextApiRequest, NextApiResponse } from "next";
import QRCode from "qrcode";
import { clinic, PlanId } from "../../config/clinic";
import { sendCapiEvent } from "../../lib/capi";
import { idValido, registrarDados, registrarPix } from "../../lib/db";
import { criarCobrancaPix, zuckpayConfigurado } from "../../lib/zuckpay";

// Sem o aviso de saída, nada na interface libera o plano de resgate.
// Continuar aceitando o nome vindo do navegador deixaria qualquer um
// pedir o preço menor pelo DevTools e pagar R$ 19,90 no lugar de R$ 36,80.
const resolvePlan = (_raw: unknown): PlanId => "padrao";

const onlyDigits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

// A ZuckPay precisa de uma URL pública para o aviso de pagamento, e ela
// muda entre preview e produção — daí ler do próprio pedido.
const siteUrl = (req: NextApiRequest) => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  return `${proto}://${req.headers.host}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!zuckpayConfigurado) {
    console.error("ERROR: ZUCKPAY_CLIENT_ID/ZUCKPAY_CLIENT_SECRET not set");
    return res.status(500).json({ error: "Pagamento não configurado" });
  }

  try {
    const { userProfile, plan: rawPlan, conversaId } = req.body ?? {};
    const planId = resolvePlan(rawPlan);
    const chosen = clinic.plans[planId];
    const name = String(userProfile?.name ?? "").trim();
    const email = String(userProfile?.email ?? "").trim();
    const phone = onlyDigits(userProfile?.phone);
    const document = onlyDigits(userProfile?.document);

    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios" });
    }
    if (phone.length < 10 || document.length !== 11) {
      return res.status(400).json({ error: "Telefone ou CPF inválido" });
    }

    // O id da conversa é a chave de idempotência: se ela recarregar ou a
    // rede falhar no meio, a ZuckPay devolve a mesma cobrança pendente em
    // vez de criar uma segunda em nome da mesma pessoa. Também é o que
    // liga a transação à conversa no painel.
    const externalIdClient = idValido(conversaId) ? String(conversaId) : undefined;

    const cobranca = await criarCobrancaPix({
      nome: name,
      cpf: document,
      email,
      telefone: phone,
      // Em reais: a ZuckPay não usa centavos.
      valor: chosen.price,
      descricao: chosen.productTitle,
      externalIdClient,
      productId: chosen.zuckProductId || undefined,
      // É esse aviso que garante o Purchase no Meta mesmo se a cliente
      // fechar a página antes de o pagamento cair.
      urlnoty: `${siteUrl(req)}/api/zuckpay-webhook`,
    });

    if (!cobranca.qrcode) {
      console.error(
        "ZuckPay returned no pix code:",
        JSON.stringify(cobranca.bruto).slice(0, 500)
      );
      return res.status(502).json({ error: "O provedor não devolveu o código PIX" });
    }

    // A imagem é gerada aqui a partir do BR Code — é ele que o app do
    // banco lê, e assim o QR não depende de uma imagem hospedada fora.
    const qrImage = await QRCode.toDataURL(cobranca.qrcode, {
      margin: 1,
      width: 320,
      color: { dark: "#2B2422", light: "#FFFFFF" },
    });

    if (idValido(conversaId)) {
      await registrarDados(conversaId, {
        nome: name,
        email,
        telefone: phone,
        documento: document,
      });
      await registrarPix(conversaId, cobranca.transactionId, chosen.price);
    }

    // Aguardado de propósito: em função serverless o processo pode ser
    // encerrado assim que a resposta sai, e o evento se perderia.
    await sendCapiEvent({
      eventName: "AddPaymentInfo",
      eventId: `addpayment_${cobranca.transactionId}`,
      email,
      phone,
      value: chosen.price,
      sourceUrl: siteUrl(req),
      planId,
    });

    res.status(200).json({
      pix: {
        code: cobranca.qrcode,
        qrImage,
        hash: cobranca.transactionId,
        amount: chosen.price,
      },
    });
  } catch (error: any) {
    console.error("Payment error:", error.message);
    res.status(502).json({ error: "Não foi possível gerar o PIX" });
  }
}
