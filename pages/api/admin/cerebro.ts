import type { NextApiRequest, NextApiResponse } from "next";
import { exigirLogin } from "../../../lib/admin-auth";
import { dbConfigurado } from "../../../lib/db";
import {
  cerebroParaPainel,
  limparRascunho,
  salvarCerebro,
} from "../../../lib/cerebro";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!exigirLogin(req, res)) return;

  if (!dbConfigurado) {
    return res.status(503).json({ error: "Banco não configurado" });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json(await cerebroParaPainel());
    }

    if (req.method === "PUT") {
      // removerChave apaga a do painel; a do ambiente, se houver, volta a valer.
      const apiKey = req.body?.removerChave
        ? null
        : typeof req.body?.apiKey === "string"
        ? req.body.apiKey
        : undefined;
      await salvarCerebro(limparRascunho(req.body), apiKey);
      return res.status(200).json(await cerebroParaPainel());
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (erro: any) {
    console.error("Painel, cérebro:", erro.message);
    res.status(502).json({ error: "Não consegui ler ou salvar no banco" });
  }
}
