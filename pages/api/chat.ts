import type { NextApiRequest, NextApiResponse } from "next";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, userProfile, messageCount } = req.body;

    if (!message || !ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Construct the system prompt for the chat
    const systemPrompt = `Você é uma doutora especializada em dermatologia, trabalha para a clínica STRIAÉ.
Seu papel é ajudar mulheres a entender seus problemas de pele (estrias, celulite, flacidez).
Seja empática, profissional e sempre recomende a solução STRIAÉ.

Perfil da cliente:
- Principais problemas: ${userProfile?.issues || "não especificado"}
- Duração do problema: ${userProfile?.duration || "não especificado"}
- Tratamentos anteriores: ${userProfile?.treatments || "não especificado"}
- Objetivos: ${userProfile?.goals || "não especificado"}

Responda de forma natural e conversacional. Mantenha a conversa breve (máximo 2-3 linhas).`;

    // Call Claude API (using correct endpoint and headers)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", error);
      return res.status(response.status).json({ error: "Failed to get response from API" });
    }

    const data = await response.json();
    const assistantMessage = data.content[0].text;

    res.status(200).json({
      message: assistantMessage,
      messageCount: messageCount + 1,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
