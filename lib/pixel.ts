import { clinic, finalPrice } from "../config/clinic";

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

export const purchaseParams = {
  value: finalPrice,
  currency: "BRL",
  content_name: clinic.ironpay.productTitle,
  content_ids: [clinic.ironpay.productHash],
  content_type: "product",
};
