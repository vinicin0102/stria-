import type { NextApiRequest, NextApiResponse } from "next";
import {
  senhaCorreta,
  senhaConfigurada,
  darCookie,
  limparCookie,
  autenticado,
} from "../../../lib/admin-auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    limparCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    return res
      .status(200)
      .json({ configurado: senhaConfigurada, logado: autenticado(req) });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!senhaConfigurada) {
    return res.status(503).json({ error: "Defina ADMIN_PASSWORD no ambiente" });
  }

  if (!senhaCorreta(req.body?.senha)) {
    return res.status(401).json({ error: "Senha incorreta" });
  }

  darCookie(res);
  res.status(200).json({ ok: true });
}
