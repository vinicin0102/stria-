import type { NextApiRequest, NextApiResponse } from "next";
import { exigirLogin } from "../../../lib/admin-auth";
import {
  FalhaIA,
  lerCerebro,
  limparRascunho,
  montarSistema,
  perguntarDoutora,
  sanitizeHistory,
} from "../../../lib/cerebro";

// Conversa de teste com o que está na tela, salvo ou não: dá para ajustar
// e experimentar antes de valer para as clientes. Nada vai para o banco.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!exigirLogin(req, res)) return;

  const mensagem = String(req.body?.mensagem ?? "").slice(0, 2000);
  if (!mensagem.trim()) {
    return res.status(400).json({ error: "Escreva uma mensagem" });
  }

  try {
    const rascunho = limparRascunho(req.body?.rascunho);
    const chaveDigitada = String(req.body?.rascunho?.apiKey ?? "").trim();
    const apiKey = chaveDigitada || (await lerCerebro()).apiKey;

    const resposta = await perguntarDoutora(
      { apiKey, modelo: rascunho.modelo },
      montarSistema(rascunho, { nome: req.body?.nome || undefined }),
      [...sanitizeHistory(req.body?.historico), { role: "user", content: mensagem }]
    );
    res.status(200).json({ resposta });
  } catch (erro: any) {
    const status = erro instanceof FalhaIA ? erro.status : 500;
    res.status(status).json({ error: erro.message || "Falha no teste" });
  }
}
