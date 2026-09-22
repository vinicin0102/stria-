import type { NextApiRequest, NextApiResponse } from "next";
import { clinic } from "../../config/clinic";
import { idValido, registrarDados, registrarMensagem } from "../../lib/db";

const MODEL = "claude-sonnet-5";
const MAX_HISTORY = 12;

const CLINIC = {
  name: clinic.name,
  doctorName: clinic.doctor.name,
  doctorTitle: clinic.doctor.title.toLowerCase(),
};

type Turn = { role: "user" | "assistant"; content: string };

// Traduz as respostas do quiz em frases para o prompt. Só entram as que
// ela realmente marcou: inventar contexto faz a doutora afirmar coisas
// que a cliente nunca disse, e ela percebe na hora.
function resumoDoQuiz(p: any): string {
  if (!p) return "";
  const linhas = [
    p.queixa && `Queixa principal: ${p.queixa}.`,
    p.frequencia && `Frequência: ${p.frequencia}.`,
    p.gatilho && `Padrão de piora: ${p.gatilho}.`,
    p.tentativas && `Já tentou: ${p.tentativas}.`,
    p.impacto && `Impacto no dia a dia: ${p.impacto}.`,
  ].filter(Boolean);
  return linhas.join("\n");
}

// O histórico vem do navegador: aceite só o formato esperado e limite o
// tamanho, em vez de repassar o que chegou para a API.
function sanitizeHistory(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is Turn =>
        !!t &&
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, userProfile, messageCount, history, isFinalTurn, conversaId } =
      req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!apiKey) {
      console.error("ERROR: ANTHROPIC_API_KEY not set in environment");
      return res.status(500).json({ error: "API key not configured" });
    }

    const perfil = resumoDoQuiz(userProfile);

    const systemPrompt = `Você é ${CLINIC.doctorName}, ${CLINIC.doctorTitle}, conversando por chat com uma mulher incomodada com odor íntimo, corrimento ou coceira.

SOBRE O ${CLINIC.name.toUpperCase()}:
É um guia para ela seguir em casa — rotina diária de cuidado íntimo, o que evitar (duchas, sabonete errado, roupa que abafa, excesso de açúcar) e como acompanhar o próprio ciclo. Não é consulta, não é exame, não é remédio. Ela recebe o passo a passo e aplica na rotina dela, com o seu acompanhamento.

O QUE VOCÊ SABE DELA:
${userProfile?.name ? `Ela se chama ${userProfile.name}.` : ""}
${perfil || "Nada além do nome. Pergunte antes de afirmar qualquer coisa."}
Isso veio de um questionário curto que ela respondeu agora. Qualquer outra coisa você só sabe se ela contar — nunca finja saber.

LIMITES CLÍNICOS, INEGOCIÁVEIS:
- Você NÃO dá diagnóstico. Candidíase, vaginose e infecções sexualmente transmissíveis dão sintomas parecidos e são coisas diferentes. Nunca diga "você está com candidíase" ou equivalente. Fale em "o que você descreve é compatível com..." ou "pelo que você conta, o caminho é...".
- Você NÃO indica, receita nem sugere medicamento, pomada, antibiótico ou antifúngico, nem os de farmácia.
- Se ela relatar dor pélvica, febre, sangramento fora da menstruação, ferida ou bolha, cheiro que surgiu de repente e muito forte, gravidez, ou sintoma que não melhora, diga com clareza que esse caso precisa de consulta presencial e exame. Isso vale mais que a venda.
- Não prometa cura, não garanta resultado e não dê prazo.

O QUE APROFUNDAR NA CONVERSA, UMA COISA POR VEZ:
1. Há quanto tempo isso acontece
2. Se já procurou ajuda e o que aconteceu depois
3. O que mais pesa para ela hoje nisso

COMO RESPONDER:
- No máximo 2 frases curtas. Seja direta.
- Responda ao que ela ACABOU de dizer. Se ela fez uma pergunta, responda a pergunta.
- Acolha sem discursar: nada de "entendo sua frustração" ou "sei como incomoda". Vá ao conteúdo.
- Assunto delicado: trate com naturalidade, sem eufemismo e sem julgamento. Ela não fez nada de errado, e isso é comum.
- Não repita o que você já falou antes na conversa.
- Termine com uma pergunta curta só quando fizer sentido.
- Sem emoji.${
      isFinalTurn
        ? `

ATENÇÃO — ESTA É SUA ÚLTIMA MENSAGEM:
Logo depois dela você vai explicar o guia e apresentar uma condição especial, e a cliente não terá como responder.
Então NÃO termine com pergunta e NÃO peça nenhuma informação. Feche o raciocínio numa frase que puxe naturalmente para a explicação do guia.`
        : ""
    }`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
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
        model: MODEL,
        max_tokens: 300,
        system: systemPrompt,
        // Sem o histórico a doutora responde cada mensagem no vácuo e
        // ignora o que a cliente acabou de contar.
        messages: [
          ...sanitizeHistory(history),
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error (${response.status}):`, errorText);
      // 502: a falha é da API externa, não desta rota. Repassar o status original
      // faz o browser reportar "404 em /api/chat", escondendo a causa real.
      return res.status(502).json({ error: "Falha ao contatar o serviço de IA" });
    }

    const data = await response.json();
    const text = data.content?.find((b: any) => b.type === "text")?.text;

    if (!text) {
      console.error(
        `Empty Anthropic response (stop_reason: ${data.stop_reason}):`,
        JSON.stringify(data).slice(0, 500)
      );
      return res.status(502).json({ error: "O serviço de IA não retornou uma resposta" });
    }

    const resposta = text.trim();

    // Gravado aqui, e não no navegador, porque é o único ponto que vê as
    // duas falas com certeza de que a resposta chegou.
    if (idValido(conversaId)) {
      if (userProfile?.name) {
        await registrarDados(conversaId, { nome: userProfile.name });
      }
      await registrarMensagem(conversaId, "cliente", message);
      await registrarMensagem(conversaId, "doutora", resposta);
    }

    res.status(200).json({
      message: resposta,
      messageCount: (messageCount || 0) + 1,
    });
  } catch (error: any) {
    console.error("Chat API error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
