import type { NextApiRequest, NextApiResponse } from "next";
import { exigirLogin } from "../../../lib/admin-auth";
import { buscarConversa, dbConfigurado, idValido } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!exigirLogin(req, res)) return;

  if (!dbConfigurado) {
    return res.status(503).json({ error: "Banco não configurado" });
  }

  const id = req.query.id;
  if (!idValido(id)) {
    return res.status(400).json({ error: "Identificador inválido" });
  }

  try {
    const dados = await buscarConversa(id as string);
    if (!dados.conversa) {
      return res.status(404).json({ error: "Conversa não encontrada" });
    }
    res.status(200).json(dados);
  } catch (erro: any) {
    console.error("Painel, conversa:", erro.message);
    res.status(502).json({ error: "Não consegui consultar o banco" });
  }
}
