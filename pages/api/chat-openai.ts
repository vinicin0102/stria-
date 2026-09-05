import type { NextApiRequest, NextApiResponse } from "next";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, userProfile, messageCount } = req.body;

    if (!message || !OPENAI_API_KEY) {
      return res.status(400).json({ error: "Missing required fields" });
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return res.status(response.status).json({ error: "Failed to get response from API" });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    res.status(200).json({
      message: assistantMessage,
      messageCount: messageCount + 1,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
