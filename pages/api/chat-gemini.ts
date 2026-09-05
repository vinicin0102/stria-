import type { NextApiRequest, NextApiResponse } from "next";

const MODEL = "gemini-3.6-flash";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, userProfile, messageCount } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!apiKey) {
      console.error("ERROR: GEMINI_API_KEY not set in environment");
      return res.status(500).json({ error: "API key not configured" });
    }

    const systemPrompt = `Você é uma doutora especializada em dermatologia, trabalha para a clínica STRIAÉ.
Seu papel é ajudar mulheres a entender seus problemas de pele (estrias, celulite, flacidez).
Seja empática, profissional e sempre recomende a solução STRIAÉ.

Perfil da cliente:
- Principais problemas: ${userProfile?.issues || "não especificado"}
- Duração do problema: ${userProfile?.duration || "não especificado"}
- Tratamentos anteriores: ${userProfile?.treatments || "não especificado"}
- Objetivos: ${userProfile?.goals || "não especificado"}

Responda de forma natural e conversacional. Mantenha a conversa breve (máximo 2-3 linhas).`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: message }] }],
          // O modelo gasta ~500 tokens de raciocínio interno antes de escrever;
          // um limite baixo corta a resposta no meio da frase.
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorText);
      // 502: a falha é da API externa, não desta rota. Repassar o status original
      // faz o browser reportar "404 em /api/chat-gemini", escondendo a causa real.
      return res.status(502).json({ error: "Falha ao contatar o serviço de IA" });
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      console.error(
        `Empty Gemini response (finishReason: ${candidate?.finishReason}):`,
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
