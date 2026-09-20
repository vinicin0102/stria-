import type { NextApiRequest, NextApiResponse } from "next";
import { exigirLogin } from "../../../lib/admin-auth";
import { contarFunil, dbConfigurado, listarConversas } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!exigirLogin(req, res)) return;

  if (!dbConfigurado) {
    return res.status(503).json({ error: "Banco não configurado" });
  }

  try {
    const [conversas, contagem] = await Promise.all([
      listarConversas(),
      contarFunil(),
    ]);
    res.status(200).json({ conversas, contagem });
  } catch (erro: any) {
    // Falha de consulta vira erro visível: tela vazia seria lida como
    // "nenhuma venda", que é a conclusão errada mais cara possível.
    console.error("Painel, listagem:", erro.message);
    res.status(502).json({ error: "Não consegui consultar o banco" });
  }
}
