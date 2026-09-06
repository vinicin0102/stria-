import { clinic, PlanId } from "../config/clinic";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export const pixelId = clinic.facebookPixelId;

// Eventos padrão do Meta entram por "track"; os nossos, por "trackCustom".
// Mandar um evento inventado como padrão faz o Meta descartar em silêncio.
const PADRAO = new Set([
  "PageView",
  "ViewContent",
  "Lead",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
]);

export function track(
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
) {
  if (typeof window === "undefined" || !window.fbq) return;
  const verbo = PADRAO.has(event) ? "track" : "trackCustom";
  window.fbq(verbo, event, params ?? {}, options);
}

// O valor precisa acompanhar o plano: reportar R$ 27 numa venda de
// R$ 19,90 estraga o ROAS que o Meta usa para otimizar a campanha.
export const purchaseParams = (planId: PlanId = "padrao") => {
  const p = clinic.plans[planId];
  return {
    value: p.price,
    currency: "BRL",
    content_name: p.productTitle,
    content_ids: [p.productHash],
    content_type: "product",
  };
};
