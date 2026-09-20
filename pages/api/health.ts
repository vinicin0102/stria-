import type { NextApiRequest, NextApiResponse } from "next";
import { clinic } from "../../config/clinic";
import { checarBanco } from "../../lib/db";

// Só booleanos e um diagnóstico de conexão: diz o que está configurado e
// se o banco responde, nunca valores nem dados de ninguém. Serve para
// conferir um deploy sem abrir o painel da Vercel.
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const banco = await checarBanco();

  res.status(200).json({
    chat: Boolean(process.env.ANTHROPIC_API_KEY),
    pagamento: Boolean(process.env.IRONPAY_API_TOKEN),
    metaCapi: Boolean(process.env.FB_CAPI_TOKEN),
    pixel: Boolean(clinic.facebookPixelId),
    painel: Boolean(process.env.ADMIN_PASSWORD),
    banco,
  });
}
