import type { NextApiRequest, NextApiResponse } from "next";
import { consultarStatus, zuckpayConfigurado } from "../../lib/zuckpay";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!zuckpayConfigurado) {
    return res.status(500).json({ error: "Pagamento não configurado" });
  }

  const hash = String(req.query.hash ?? "");
  // Mesmo conjunto que a ZuckPay aceita como transactionId.
  if (!/^[A-Za-z0-9._:-]{1,100}$/.test(hash)) {
    return res.status(400).json({ error: "Identificador inválido" });
  }

  try {
    const { status, pago } = await consultarStatus({ transactionId: hash });
    res.status(200).json({ status, paid: pago });
  } catch (error: any) {
    console.error("Payment status error:", error.message);
    res.status(502).json({ error: "Não foi possível consultar" });
  }
}
