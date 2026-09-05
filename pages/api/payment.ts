import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userProfile, amount } = req.body;

    if (!userProfile || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // This is a placeholder for PIX payment integration
    // You can replace with your actual payment provider (Mercado Pago, etc.)
    const pixData = {
      status: "pending",
      pixKey: generatePixKey(),
      amount: amount,
      customerEmail: userProfile.email,
      customerName: userProfile.name,
      expiresIn: 3600, // 1 hour
      reference: `STRIA-${Date.now()}`,
    };

    // In production, you would:
    // 1. Call your payment provider API (Mercado Pago, etc.)
    // 2. Generate actual PIX QR code
    // 3. Store transaction in database
    // 4. Send email confirmation

    res.status(200).json({
      success: true,
      pix: pixData,
      message: "PIX gerado com sucesso! Escaneie o QR code para pagar.",
    });
  } catch (error) {
    console.error("Payment API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

function generatePixKey(): string {
  return `PIX-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
}
