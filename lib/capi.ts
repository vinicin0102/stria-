import crypto from "crypto";
import { clinic, PlanId } from "../config/clinic";

const GRAPH = "https://graph.facebook.com/v21.0";

// O Meta exige os dados pessoais em SHA-256, minúsculos e sem espaços.
const hash = (value: string) =>
  crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

const digits = (value: string) => value.replace(/\D/g, "");

interface CapiEvent {
  eventName: string;
  // Mesmo id usado no navegador: é ele que impede o evento de contar duas
  // vezes quando chega pelos dois caminhos.
  eventId: string;
  email?: string;
  phone?: string;
  value?: number;
  sourceUrl?: string;
  planId?: PlanId;
}

export async function sendCapiEvent(evt: CapiEvent): Promise<boolean> {
  const token = process.env.FB_CAPI_TOKEN;
  const pixel = clinic.facebookPixelId;
  if (!token || !pixel) return false;

  const produto = clinic.plans[evt.planId ?? "padrao"];
  const userData: Record<string, string[]> = {};
  if (evt.email) userData.em = [hash(evt.email)];
  // Telefone precisa do DDI para casar com a base do Meta.
  if (evt.phone) {
    const d = digits(evt.phone);
    userData.ph = [hash(d.startsWith("55") ? d : `55${d}`)];
  }

  const payload = {
    data: [
      {
        event_name: evt.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: evt.eventId,
        action_source: "website",
        ...(evt.sourceUrl ? { event_source_url: evt.sourceUrl } : {}),
        user_data: userData,
        custom_data: {
          currency: "BRL",
          ...(evt.value != null ? { value: evt.value } : {}),
          content_name: produto.productTitle,
          content_ids: [produto.productHash],
          content_type: "product",
        },
      },
    ],
  };

  try {
    const res = await fetch(`${GRAPH}/${pixel}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();

    if (!res.ok) {
      console.error(`CAPI ${evt.eventName} failed:`, JSON.stringify(body).slice(0, 400));
      return false;
    }
    console.log(`CAPI ${evt.eventName} ok:`, JSON.stringify(body));
    return true;
  } catch (error: any) {
    console.error(`CAPI ${evt.eventName} error:`, error.message);
    return false;
  }
}
