import type { NextApiRequest, NextApiResponse } from "next";
import { clinic } from "../../config/clinic";

const MODEL = "claude-sonnet-5";
const MAX_HISTORY = 12;

const CLINIC = {
  name: clinic.name,
  doctorName: clinic.doctor.name,
  doctorTitle: clinic.doctor.title.toLowerCase(),
};

type Turn = { role: "user" | "assistant"; content: string };

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
    const { message, userProfile, messageCount, history } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!apiKey) {
      console.error("ERROR: ANTHROPIC_API_KEY not set in environment");
      return res.status(500).json({ error: "API key not configured" });
    }

    const systemPrompt = `Você é ${CLINIC.doctorName}, ${CLINIC.doctorTitle} da ${CLINIC.name}, conversando por chat com uma mulher interessada em tratar estrias, celulite ou flacidez.

SOBRE O MÉTODO ${CLINIC.name.toUpperCase()}:
É um método para ela fazer em casa — uma rotina passo a passo com orientações dermatológicas de cuidado com a pele. Não é procedimento de consultório, não é sessão em clínica. Ela recebe o passo a passo e aplica sozinha na rotina dela.

PERFIL DELA:
- Queixa principal: ${userProfile?.issues || "não informado"}
- Convive há: ${userProfile?.duration || "não informado"}
- Já tentou: ${userProfile?.treatments || "não informado"}
- Objetivo: ${userProfile?.goals || "não informado"}

COMO RESPONDER:
- No máximo 2 frases curtas. Seja direta.
- Responda ao que ela ACABOU de dizer. Se ela fez uma pergunta, responda a pergunta.
- Não repita o que ela disse de volta ("entendo sua frustração", "sei como incomoda") — vá direto ao conteúdo.
- Não repita o que você já falou antes na conversa.
- Termine com uma pergunta curta só quando fizer sentido.
- Sem emoji.
- Não prometa prazo para as estrias sumirem nem garanta resultado. Fale do que o método faz, não de milagre.`;

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

    res.status(200).json({
      message: text.trim(),
      messageCount: (messageCount || 0) + 1,
    });
  } catch (error: any) {
    console.error("Chat API error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
