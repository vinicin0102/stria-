import type { NextApiRequest, NextApiResponse } from "next";

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: {
              text: systemPrompt,
            },
          },
          contents: {
            parts: {
              text: message,
            },
          },
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (${response.status}):`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Invalid response format:", data);
      return res.status(500).json({ error: "Invalid response from Gemini API" });
    }

    const assistantMessage = data.candidates[0].content.parts[0].text;

    res.status(200).json({
      message: assistantMessage,
      messageCount: (messageCount || 0) + 1,
    });
  } catch (error: any) {
    console.error("Chat API error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
