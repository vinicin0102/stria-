import type { NextApiRequest, NextApiResponse } from "next";
import QRCode from "qrcode";
import { clinic, PlanId } from "../../config/clinic";
import { sendCapiEvent } from "../../lib/capi";

const API = "https://api.ironpayapp.com.br/api/public/v1";

// Sem o aviso de saída, nada na interface libera o plano de resgate.
// Continuar aceitando o nome vindo do navegador deixaria qualquer um
// pedir o preço menor pelo DevTools e pagar R$ 19,90 no lugar de R$ 36,80.
const resolvePlan = (_raw: unknown): PlanId => "padrao";

const onlyDigits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

// A IronPay precisa de uma URL pública para o aviso de pagamento, e ela
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

  const token = process.env.IRONPAY_API_TOKEN;
  if (!token) {
    console.error("ERROR: IRONPAY_API_TOKEN not set in environment");
    return res.status(500).json({ error: "Pagamento não configurado" });
  }

  try {
    const { userProfile, plan: rawPlan } = req.body ?? {};
    const planId = resolvePlan(rawPlan);
    const chosen = clinic.plans[planId];
    const amountCents = Math.round(chosen.price * 100);
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

    const response = await fetch(`${API}/transactions?api_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        amount: amountCents,
        offer_hash: chosen.offerHash,
        payment_method: "pix",
        customer: { name, email, phone_number: phone, document },
        cart: [
          {
            // Cada oferta pertence a um produto: misturar os dois hashes
            // faz a IronPay recusar a transação.
            product_hash: chosen.productHash,
            title: chosen.productTitle,
            cover: null,
            price: amountCents,
            quantity: 1,
            operation_type: 1,
            tangible: false,
          },
        ],
        expire_in_days: 1,
        transaction_origin: "api",
        // A IronPay avisa aqui quando o pagamento cai, e é esse aviso que
        // garante o Purchase no Meta mesmo se a cliente fechar a página.
        postback_url: `${siteUrl(req)}/api/ironpay-webhook`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`IronPay error (${response.status}):`, JSON.stringify(data));
      return res.status(502).json({ error: "Não foi possível gerar o PIX" });
    }

    const pixCode = data?.pix?.pix_qr_code;
    if (!pixCode) {
      console.error("IronPay returned no pix code:", JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: "O provedor não devolveu o código PIX" });
    }

    // A API devolve qr_code_base64 nulo, então a imagem é gerada aqui a
    // partir do BR Code — é ele que o app do banco lê.
    const qrImage = await QRCode.toDataURL(pixCode, {
      margin: 1,
      width: 320,
      color: { dark: "#2B2422", light: "#FFFFFF" },
    });

    // Aguardado de propósito: em função serverless o processo pode ser
    // encerrado assim que a resposta sai, e o evento se perderia.
    await sendCapiEvent({
      eventName: "AddPaymentInfo",
      eventId: `addpayment_${data.hash}`,
      email,
      phone,
      value: amountCents / 100,
      sourceUrl: siteUrl(req),
      planId,
    });

    res.status(200).json({
      pix: {
        code: pixCode,
        qrImage,
        hash: data.hash,
        amount: (data.amount ?? amountCents) / 100,
      },
    });
  } catch (error: any) {
    console.error("Payment error:", error.message);
    res.status(500).json({ error: "Erro ao gerar o pagamento" });
  }
}
