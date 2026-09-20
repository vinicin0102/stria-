import type { NextApiRequest, NextApiResponse } from "next";
import { exigirLogin } from "../../../lib/admin-auth";
import { comBanco, dbConfigurado, ETAPA } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!exigirLogin(req, res)) return;

  if (!dbConfigurado) {
    return res.status(503).json({ error: "Banco não configurado" });
  }

  const dados = await comBanco(async (q) => {
    const conversas = await q`
      select c.id, c.criada_em, c.atualizada_em, c.nome, c.email,
             c.telefone, c.etapa, c.valor,
             count(m.id)::int as total_mensagens,
             (select conteudo from mensagens
               where conversa_id = c.id and papel = 'cliente'
               order by id desc limit 1) as ultima_da_cliente
        from conversas c
        left join mensagens m on m.conversa_id = c.id
       group by c.id
       order by c.atualizada_em desc
       limit 200
    `;

    const [contagem] = await q`
      select
        count(*)::int as total,
        count(*) filter (where etapa >= ${ETAPA.viuOferta})::int as viram_oferta,
        count(*) filter (where etapa >= ${ETAPA.preencheuDados})::int as deram_dados,
        count(*) filter (where etapa >= ${ETAPA.pixGerado})::int as geraram_pix,
        count(*) filter (where etapa >= ${ETAPA.pagou})::int as pagaram,
        coalesce(sum(valor) filter (where etapa >= ${ETAPA.pagou}), 0) as faturado
      from conversas
    `;

    return { conversas, contagem };
  });

  if (!dados) {
    return res.status(502).json({ error: "Não consegui consultar o banco" });
  }

  res.status(200).json(dados);
}
