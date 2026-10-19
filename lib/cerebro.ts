import { clinic } from "../config/clinic";
import { gravarAjuste, lerAjuste } from "./db";

// O "cérebro" da doutora: chave da API, modelo e tudo o que molda as
// respostas. Fica no banco para ser editado pelo painel, sem novo deploy.

export type Exemplo = { cliente: string; doutora: string };

export type Cerebro = {
  apiKey: string;
  modelo: string;
  instrucoes: string;
  conhecimento: string;
  exemplos: Exemplo[];
};

export const MODELOS = [
  { id: "claude-sonnet-5", nome: "Claude Sonnet 5 (o que já estava em uso)" },
  { id: "claude-sonnet-5-5", nome: "Claude Sonnet 5.5 (mais novo, mesmo preço)" },
  { id: "claude-opus-5-5", nome: "Claude Opus 5.5 (mais inteligente, mais caro)" },
  { id: "claude-haiku-5-5", nome: "Claude Haiku 5.5 (mais rápido e barato)" },
];

const MODELO_PADRAO = MODELOS[0].id;

// O mesmo texto que vivia fixo na rota do chat: quem nunca abriu o
// painel continua com a doutora respondendo exatamente como antes.
export const INSTRUCOES_PADRAO = `Você é ${clinic.doctor.name}, ${clinic.doctor.title.toLowerCase()} da ${clinic.name}, conversando por chat com uma mulher interessada em tratar estrias, celulite ou flacidez.

SOBRE O MÉTODO ${clinic.name.toUpperCase()}:
É um método para ela fazer em casa — uma rotina passo a passo com orientações dermatológicas de cuidado com a pele. Não é procedimento de consultório, não é sessão em clínica. Ela recebe o passo a passo e aplica sozinha na rotina dela.

Não existe formulário nem questionário: tudo o que você souber dela veio da própria conversa. Nunca finja saber a queixa dela, há quanto tempo ou o que já tentou — pergunte.

O QUE DESCOBRIR, UMA COISA POR VEZ:
1. Qual é a queixa (estrias, celulite, flacidez, ou mais de uma)
2. Há quanto tempo ela convive com isso
3. O que ela já tentou e não funcionou

COMO RESPONDER:
- No máximo 2 frases curtas. Seja direta.
- Responda ao que ela ACABOU de dizer. Se ela fez uma pergunta, responda a pergunta.
- Não repita o que ela disse de volta ("entendo sua frustração", "sei como incomoda") — vá direto ao conteúdo.
- Não repita o que você já falou antes na conversa.
- Termine com uma pergunta curta só quando fizer sentido.
- Sem emoji.
- Não prometa prazo para as estrias sumirem nem garanta resultado. Fale do que o método faz, não de milagre.`;

const CHAVE = "cerebro";
const LIMITE_TEXTO = 20_000;
const LIMITE_EXEMPLOS = 30;

// Cada função serverless guarda o cérebro por pouco tempo: evita uma ida
// ao banco por mensagem e, ainda assim, um ajuste salvo vale em segundos.
const VALIDADE_MS = 30_000;
let cache: { valor: Cerebro; ate: number } | null = null;

type Salvo = Partial<Cerebro>;

function completar(salvo: Salvo | null): Cerebro {
  return {
    // A chave do painel vence; a do ambiente segue valendo enquanto
    // ninguém cadastrar outra.
    apiKey: salvo?.apiKey || process.env.ANTHROPIC_API_KEY || "",
    modelo: salvo?.modelo || MODELO_PADRAO,
    instrucoes: salvo?.instrucoes?.trim() ? salvo.instrucoes : INSTRUCOES_PADRAO,
    conhecimento: salvo?.conhecimento ?? "",
    exemplos: salvo?.exemplos ?? [],
  };
}

export async function lerCerebro(): Promise<Cerebro> {
  if (cache && cache.ate > Date.now()) return cache.valor;
  const valor = completar(await lerAjuste<Salvo>(CHAVE));
  cache = { valor, ate: Date.now() + VALIDADE_MS };
  return valor;
}

// Só o que o painel pode ver: a chave nunca volta inteira para o navegador.
export async function cerebroParaPainel() {
  const salvo = await lerAjuste<Salvo>(CHAVE);
  const atual = completar(salvo);
  const origem = salvo?.apiKey
    ? "painel"
    : process.env.ANTHROPIC_API_KEY
    ? "ambiente"
    : null;
  return {
    chave: atual.apiKey ? mascarar(atual.apiKey) : null,
    origemChave: origem,
    modelo: atual.modelo,
    instrucoes: atual.instrucoes,
    conhecimento: atual.conhecimento,
    exemplos: atual.exemplos,
    instrucoesPadrao: INSTRUCOES_PADRAO,
    modelos: MODELOS,
  };
}

const mascarar = (k: string) =>
  k.length > 12 ? `${k.slice(0, 7)}…${k.slice(-4)}` : "••••";

// O corpo vem do navegador: aceite só o formato esperado e corte o tamanho.
export function limparRascunho(bruto: any): Omit<Cerebro, "apiKey"> {
  const texto = (v: unknown) =>
    typeof v === "string" ? v.slice(0, LIMITE_TEXTO) : "";
  const exemplos = Array.isArray(bruto?.exemplos) ? bruto.exemplos : [];
  return {
    modelo: MODELOS.some((m) => m.id === bruto?.modelo)
      ? bruto.modelo
      : MODELO_PADRAO,
    instrucoes: texto(bruto?.instrucoes),
    conhecimento: texto(bruto?.conhecimento),
    exemplos: exemplos
      .map((e: any) => ({
        cliente: texto(e?.cliente).slice(0, 2000),
        doutora: texto(e?.doutora).slice(0, 2000),
      }))
      .filter((e: Exemplo) => e.cliente.trim() && e.doutora.trim())
      .slice(0, LIMITE_EXEMPLOS),
  };
}

// apiKey: string nova substitui; vazia mantém a atual; null apaga.
export async function salvarCerebro(
  rascunho: Omit<Cerebro, "apiKey">,
  apiKey: string | null | undefined
) {
  const anterior = (await lerAjuste<Salvo>(CHAVE)) ?? {};
  const chave =
    apiKey === null ? "" : apiKey?.trim() ? apiKey.trim() : anterior.apiKey ?? "";
  await gravarAjuste(CHAVE, { ...rascunho, apiKey: chave });
  cache = null;
}

// Junta as partes editáveis com o que só a conversa sabe (o nome dela e
// se esta é a última fala antes da oferta).
export function montarSistema(
  c: Pick<Cerebro, "instrucoes" | "conhecimento" | "exemplos">,
  contexto: { nome?: string; ultimaFala?: boolean }
) {
  const partes = [c.instrucoes.trim() || INSTRUCOES_PADRAO];

  if (c.conhecimento.trim()) {
    partes.push(
      `INFORMAÇÕES QUE VOCÊ DEVE SABER (use quando forem úteis, sem despejar tudo de uma vez):\n${c.conhecimento.trim()}`
    );
  }

  if (c.exemplos.length) {
    const lista = c.exemplos
      .map((e) => `Cliente: ${e.cliente.trim()}\nVocê: ${e.doutora.trim()}`)
      .join("\n\n");
    partes.push(
      `EXEMPLOS DE COMO RESPONDER (siga o tom, o tamanho e o jeito; não copie palavra por palavra):\n${lista}`
    );
  }

  partes.push(
    `O QUE VOCÊ SABE DELA:\n${
      contexto.nome ? `Ela se chama ${contexto.nome}.` : "Nada ainda."
    }`
  );

  if (contexto.ultimaFala) {
    partes.push(`ATENÇÃO — ESTA É SUA ÚLTIMA MENSAGEM:
Logo depois dela você vai explicar o método e apresentar uma condição especial, e a cliente não terá como responder.
Então NÃO termine com pergunta e NÃO peça nenhuma informação. Feche o raciocínio numa frase que puxe naturalmente para a explicação do método.`);
  }

  return partes.join("\n\n");
}

export type Turno = { role: "user" | "assistant"; content: string };

const MAX_HISTORY = 12;

// O histórico vem do navegador: aceite só o formato esperado e limite o
// tamanho, em vez de repassar o que chegou para a API.
export function sanitizeHistory(raw: unknown): Turno[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is Turno =>
        !!t &&
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }));
}

export class FalhaIA extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function perguntarDoutora(
  c: Pick<Cerebro, "apiKey" | "modelo">,
  sistema: string,
  mensagens: Turno[]
) {
  if (!c.apiKey) throw new FalhaIA("Nenhuma chave de API cadastrada", 500);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": c.apiKey,
    "anthropic-version": "2023-06-01",
  };

  // Só necessário para chaves de organização não vinculadas a uma workspace.
  if (process.env.ANTHROPIC_WORKSPACE_ID) {
    headers["anthropic-workspace-id"] = process.env.ANTHROPIC_WORKSPACE_ID;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: c.modelo,
      // Os modelos novos pensam antes de responder e esse pensamento
      // consome o limite; com pouca folga a resposta sairia cortada.
      // O tamanho da fala quem segura são as instruções.
      max_tokens: 1500,
      // Conversa de chat: pensar pouco deixa a resposta rápida.
      output_config: { effort: "low" },
      system: sistema,
      messages: mensagens,
    }),
  });

  if (!response.ok) {
    const corpo = await response.text();
    console.error(`Anthropic API error (${response.status}):`, corpo);
    let detalhe = "";
    try {
      detalhe = JSON.parse(corpo)?.error?.message ?? "";
    } catch {}
    const motivo =
      response.status === 401
        ? "Chave de API inválida"
        : response.status === 404
        ? "Modelo não disponível para esta chave"
        : response.status === 429
        ? "Limite de uso da API atingido"
        : "Falha ao contatar o serviço de IA";
    // 502: a falha é da API externa, não desta rota.
    throw new FalhaIA(detalhe ? `${motivo}: ${detalhe}` : motivo, 502);
  }

  const data = await response.json();
  const text = data.content?.find((b: any) => b.type === "text")?.text;

  if (!text) {
    console.error(
      `Empty Anthropic response (stop_reason: ${data.stop_reason}):`,
      JSON.stringify(data).slice(0, 500)
    );
    throw new FalhaIA("O serviço de IA não retornou uma resposta", 502);
  }

  return text.trim() as string;
}
