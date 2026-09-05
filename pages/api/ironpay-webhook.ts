import type { NextApiRequest, NextApiResponse } from "next";
import { sendCapiEvent } from "../../lib/capi";

const API = "https://api.ironpayapp.com.br/api/public/v1";
const PAID = ["paid", "approved", "completed"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.IRONPAY_API_TOKEN;
  if (!token) return res.status(500).json({ error: "Não configurado" });

  const body = req.body ?? {};
  const hash = String(body.hash ?? body.transaction_hash ?? body.data?.hash ?? "");

  if (!/^[a-z0-9]{6,40}$/i.test(hash)) {
    return res.status(400).json({ error: "Identificador ausente" });
  }

  try {
    // O corpo do webhook é público e não assinado: qualquer um poderia
    // postar aqui e inflar conversões. Só o que a própria IronPay confirma
    // na consulta é levado em conta.
    const check = await fetch(`${API}/transactions/${hash}?api_token=${token}`, {
      headers: { Accept: "application/json" },
    });

    if (!check.ok) {
      console.error(`Webhook: transação ${hash} não confirmada (${check.status})`);
      return res.status(202).json({ ignored: true });
    }

    const tx = await check.json();
    if (!PAID.includes(String(tx?.payment_status))) {
      return res.status(200).json({ ignored: "not_paid" });
    }

    await sendCapiEvent({
      eventName: "Purchase",
      // Mesmo id do evento do navegador, para o Meta contar uma vez só.
      eventId: `purchase_${hash}`,
      email: tx?.customer?.email,
      phone: tx?.customer?.phone_number,
      value: (tx?.amount ?? 0) / 100,
    });

    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    res.status(500).json({ error: "Erro ao processar" });
  }
}
