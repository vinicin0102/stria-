import type { NextApiRequest, NextApiResponse } from "next";
import { exigirLogin } from "../../../lib/admin-auth";
import { comBanco, dbConfigurado, idValido } from "../../../lib/db";

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

  const dados = await comBanco(async (q) => {
    const [conversa] = await q`
      select id, criada_em, atualizada_em, nome, email, telefone,
             documento, etapa, pix_hash, valor
        from conversas where id = ${id as string}
    `;
    if (!conversa) return { conversa: null, mensagens: [] };

    const mensagens = await q`
      select papel, conteudo, criada_em
        from mensagens where conversa_id = ${id as string}
       order by id asc
    `;

    return { conversa, mensagens };
  });

  if (!dados) {
    return res.status(502).json({ error: "Não consegui consultar o banco" });
  }
  if (!dados.conversa) {
    return res.status(404).json({ error: "Conversa não encontrada" });
  }

  res.status(200).json(dados);
}
