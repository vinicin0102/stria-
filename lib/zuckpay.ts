import crypto from "crypto";

// A base precisa do "www": sem ele o CDN responde 301, e um redirecionamento
// transforma o POST em GET — a cobrança simplesmente não é criada.
const BASE = process.env.ZUCKPAY_BASE_URL || "https://www.zuckpay.com.br/conta";

const clientId = process.env.ZUCKPAY_CLIENT_ID || "";
const clientSecret = process.env.ZUCKPAY_CLIENT_SECRET || "";

export const zuckpayConfigurado = Boolean(clientId && clientSecret);

// Credencial só no header, nunca no corpo nem na query: query entra em log
// de servidor e de CDN.
const autorizacao = () =>
  "Basic " + Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");

export class ZuckPayError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

const TIMEOUT_MS = 30_000;

async function chamar(
  metodo: "GET" | "POST",
  caminho: string,
  opcoes: { query?: Record<string, string>; body?: Record<string, unknown> } = {}
) {
  const url = new URL(BASE + caminho);
  for (const [k, v] of Object.entries(opcoes.query ?? {})) {
    url.searchParams.set(k, v);
  }

  const controlador = new AbortController();
  const relogio = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(url.toString(), {
      method: metodo,
      headers: {
        Authorization: autorizacao(),
        Accept: "application/json",
        ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
      signal: controlador.signal,
      // Um 301 silencioso viraria GET e a cobrança sumiria sem erro.
      redirect: "error",
    });

    const texto = await resposta.text();
    let dados: any = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      /* resposta fora do JSON: o status abaixo já conta a história */
    }

    if (!resposta.ok) {
      const motivo = dados?.message || dados?.error || texto.slice(0, 200);
      throw new ZuckPayError(motivo || "Falha na ZuckPay", resposta.status);
    }
    return dados;
  } catch (erro: any) {
    if (erro instanceof ZuckPayError) throw erro;
    if (erro?.name === "AbortError") {
      throw new ZuckPayError("A ZuckPay não respondeu em 30 segundos");
    }
    throw new ZuckPayError(String(erro?.message ?? erro));
  } finally {
    clearTimeout(relogio);
  }
}

const somenteDigitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export interface CobrancaPix {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  // Em reais, com até duas casas: 36.8, não 3680.
  valor: number;
  descricao?: string;
  urlnoty?: string;
  // Chave de idempotência: repetir a chamada com o mesmo valor reaproveita
  // a cobrança pendente em vez de criar uma segunda para a mesma pessoa.
  externalIdClient?: string;
  productId?: string;
}

export async function criarCobrancaPix(dados: CobrancaPix) {
  const corpo: Record<string, unknown> = {
    nome: dados.nome,
    cpf: somenteDigitos(dados.cpf),
    email: dados.email,
    telefone: somenteDigitos(dados.telefone),
    valor: dados.valor,
  };
  if (dados.descricao) corpo.descricao = dados.descricao.slice(0, 255);
  if (dados.urlnoty) corpo.urlnoty = dados.urlnoty;
  if (dados.externalIdClient) corpo.external_id_client = dados.externalIdClient;
  if (dados.productId) corpo.product_id = dados.productId;

  const r = await chamar("POST", "/v3/pix/qrcode", { body: corpo });

  // O id vem como transactionId ou id, string ou número, conforme o caso.
  const id = r?.transactionId ?? r?.id;
  return {
    transactionId: id === undefined || id === null ? "" : String(id),
    qrcode: typeof r?.qrcode === "string" ? r.qrcode : "",
    qrcodeImage: typeof r?.qrcode_image === "string" ? r.qrcode_image : "",
    checkoutUrl: typeof r?.checkout_url === "string" ? r.checkout_url : "",
    reaproveitada: r?.idempotency === true,
    bruto: r,
  };
}

// PENDING, PAID, FAILED, EXPIRADO. A consulta força sincronização com a
// adquirente quando está pendente, então serve como confirmação real.
export const PAGO = "PAID";

export async function consultarStatus(
  chave: { transactionId: string } | { externalIdClient: string }
) {
  const query =
    "transactionId" in chave
      ? { transactionId: chave.transactionId }
      : { external_id_client: chave.externalIdClient };

  const r = await chamar("GET", "/v3/pix/status", { query });

  const status = String(r?.status ?? "").toUpperCase();
  return {
    status,
    pago: status === PAGO,
    valor: Number(r?.amount ?? r?.valor ?? 0),
    email: typeof r?.email === "string" ? r.email : undefined,
    telefone: typeof r?.telefone === "string" ? r.telefone : undefined,
    bruto: r,
  };
}

// Assinatura do postback: v1 = HMAC-SHA256("<timestamp>.<corpo cru>", segredo).
// Tem que ser o corpo CRU — reserializar o JSON muda bytes (espaços, ordem,
// acentos escapados) e a assinatura nunca mais bate.
const JANELA_SEGUNDOS = 5 * 60;

export function assinaturaValida(
  corpoCru: string,
  cabecalhoAssinatura: unknown,
  agoraSegundos = Math.floor(Date.now() / 1000)
): boolean {
  const segredo = process.env.ZUCKPAY_WEBHOOK_SECRET || "";
  if (!segredo || typeof cabecalhoAssinatura !== "string") return false;

  // Formato "t=<unix>,v1=<hex>".
  const partes = Object.fromEntries(
    cabecalhoAssinatura
      .split(",")
      .map((p) => p.trim().split("="))
      .filter((p) => p.length === 2)
  );
  const t = partes.t;
  const v1 = partes.v1;
  if (!t || !v1) return false;

  // Sem a janela, uma requisição capturada uma vez vale para sempre.
  const idade = Math.abs(agoraSegundos - Number(t));
  if (!Number.isFinite(idade) || idade > JANELA_SEGUNDOS) return false;

  const esperado = crypto
    .createHmac("sha256", segredo)
    .update(`${t}.${corpoCru}`, "utf8")
    .digest("hex");

  const a = Buffer.from(esperado, "utf8");
  const b = Buffer.from(v1.toLowerCase(), "utf8");
  // Comparação de tempo constante: o "===" vaza o tamanho do prefixo certo.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
