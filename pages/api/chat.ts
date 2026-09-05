import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, userProfile, messageCount } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!apiKey) {
      console.error("ERROR: ANTHROPIC_API_KEY not set in environment");
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

    const headers: any = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };

    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    if (workspaceId) {
      headers["anthropic-workspace-id"] = workspaceId;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
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
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error("Invalid response format:", data);
      return res.status(500).json({ error: "Invalid response from API" });
    }

    res.status(200).json({
      message: data.content[0].text,
      messageCount: (messageCount || 0) + 1,
    });
  } catch (error: any) {
    console.error("Chat API error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
