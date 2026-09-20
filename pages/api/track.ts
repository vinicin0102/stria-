import type { NextApiRequest, NextApiResponse } from "next";
import { idValido, registrarEtapa, registrarMensagem } from "../../lib/db";

const MAX_MENSAGENS = 6;
const MAX_TAMANHO = 4000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { conversaId, mensagens, etapa } = req.body ?? {};
  if (!idValido(conversaId)) {
    return res.status(400).json({ error: "Identificador inválido" });
  }

  // Endpoint público que escreve no banco: limite o que ele aceita, senão
  // vira porta para encher a tabela com lixo.
  if (Array.isArray(mensagens)) {
    for (const m of mensagens.slice(0, MAX_MENSAGENS)) {
      const papel = m?.papel === "cliente" ? "cliente" : "doutora";
      const conteudo = String(m?.conteudo ?? "").slice(0, MAX_TAMANHO);
      if (conteudo.trim()) await registrarMensagem(conversaId, papel, conteudo);
    }
  }

  if (typeof etapa === "number" && etapa >= 0 && etapa <= 4) {
    await registrarEtapa(conversaId, etapa);
  }

  // Sempre 200: gravação é secundária e nunca pode virar erro na tela
  // de quem está comprando.
  res.status(200).json({ ok: true });
}
