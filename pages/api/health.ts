import type { NextApiRequest, NextApiResponse } from "next";
import { clinic } from "../../config/clinic";
import { checarBanco } from "../../lib/db";
import { zuckpayConfigurado } from "../../lib/zuckpay";

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
    pagamento: zuckpayConfigurado,
    // Assinatura do postback: sem ela o aviso de pagamento ainda funciona,
    // porque a confirmação vem da consulta, mas fica sem autenticação.
    webhookAssinado: Boolean(process.env.ZUCKPAY_WEBHOOK_SECRET),
    metaCapi: Boolean(process.env.FB_CAPI_TOKEN),
    pixel: Boolean(clinic.facebookPixelId),
    painel: Boolean(process.env.ADMIN_PASSWORD),
    banco,
  });
}
