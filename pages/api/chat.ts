import type { NextApiRequest, NextApiResponse } from "next";
import { idValido, registrarDados, registrarMensagem } from "../../lib/db";
import {
  FalhaIA,
  lerCerebro,
  montarSistema,
  perguntarDoutora,
  sanitizeHistory,
} from "../../lib/cerebro";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, userProfile, messageCount, history, isFinalTurn, conversaId } =
      req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Chave, modelo e instruções vêm do cérebro editado no painel.
    const cerebro = await lerCerebro();

    if (!cerebro.apiKey) {
      console.error("ERROR: nenhuma chave da Anthropic no painel nem no ambiente");
      return res.status(500).json({ error: "API key not configured" });
    }

    const resposta = await perguntarDoutora(
      cerebro,
      montarSistema(cerebro, {
        nome: userProfile?.name,
        ultimaFala: Boolean(isFinalTurn),
      }),
      // Sem o histórico a doutora responde cada mensagem no vácuo e
      // ignora o que a cliente acabou de contar.
      [...sanitizeHistory(history), { role: "user", content: message }]
    );

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
    // O motivo detalhado fica no log e no teste do painel; quem está do
    // outro lado do chat é cliente, não precisa ler "chave inválida".
    if (error instanceof FalhaIA) {
      return res.status(error.status).json({ error: "Falha ao contatar o serviço de IA" });
    }
    console.error("Chat API error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
