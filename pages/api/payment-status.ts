import type { NextApiRequest, NextApiResponse } from "next";

const API = "https://api.ironpayapp.com.br/api/public/v1";

// A IronPay não usa um rótulo único para "pago"; aceita-se o conjunto.
const PAID = ["paid", "approved", "completed"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.IRONPAY_API_TOKEN;
  if (!token) return res.status(500).json({ error: "Pagamento não configurado" });

  const hash = String(req.query.hash ?? "");
  if (!/^[a-z0-9]{6,40}$/i.test(hash)) {
    return res.status(400).json({ error: "Identificador inválido" });
  }

  try {
    const response = await fetch(
      `${API}/transactions/${hash}?api_token=${token}`,
      { headers: { Accept: "application/json" } }
    );
    const data = await response.json();

    if (!response.ok) {
      console.error(`IronPay status error (${response.status})`);
      return res.status(502).json({ error: "Não foi possível consultar" });
    }

    const status = String(data?.payment_status ?? "");
    res.status(200).json({ status, paid: PAID.includes(status) });
  } catch (error: any) {
    console.error("Payment status error:", error.message);
    res.status(500).json({ error: "Erro ao consultar o pagamento" });
  }
}
