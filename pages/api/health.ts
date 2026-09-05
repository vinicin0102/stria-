import type { NextApiRequest, NextApiResponse } from "next";
import { clinic } from "../../config/clinic";

// Só booleanos: diz o que está configurado, nunca o valor. Serve para
// conferir um deploy sem precisar abrir o painel da Vercel.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    chat: Boolean(process.env.ANTHROPIC_API_KEY),
    pagamento: Boolean(process.env.IRONPAY_API_TOKEN),
    metaCapi: Boolean(process.env.FB_CAPI_TOKEN),
    pixel: Boolean(clinic.facebookPixelId),
  });
}
