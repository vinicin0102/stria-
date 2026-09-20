import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

const SENHA = process.env.ADMIN_PASSWORD || "";
export const senhaConfigurada = Boolean(SENHA);

const COOKIE = "striae_admin";
const VALIDADE_H = 12;

// A própria senha assina o cookie: trocá-la derruba as sessões abertas,
// que é o comportamento desejado se ela vazar.
const assinar = (valor: string) =>
  crypto.createHmac("sha256", SENHA).update(valor).digest("hex");

// Comparação em tempo constante: `===` vaza, pelo tempo de resposta,
// quantos caracteres do início bateram.
function igual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function senhaCorreta(tentativa: unknown) {
  if (!senhaConfigurada || typeof tentativa !== "string") return false;
  return igual(tentativa, SENHA);
}

export function darCookie(res: NextApiResponse) {
  const expira = Date.now() + VALIDADE_H * 3600_000;
  const token = `${expira}.${assinar(String(expira))}`;
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${
      VALIDADE_H * 3600
    }${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );
}

export function limparCookie(res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  );
}

export function autenticado(req: NextApiRequest) {
  if (!senhaConfigurada) return false;

  const bruto = req.cookies?.[COOKIE];
  if (!bruto) return false;

  const [expira, assinatura] = bruto.split(".");
  if (!expira || !assinatura) return false;
  if (Number(expira) < Date.now()) return false;

  return igual(assinatura, assinar(expira));
}

// Portão único das rotas do painel: sem senha configurada ninguém entra,
// nem por engano em um deploy recém-criado.
export function exigirLogin(req: NextApiRequest, res: NextApiResponse) {
  if (!senhaConfigurada) {
    res.status(503).json({ error: "Painel sem senha configurada" });
    return false;
  }
  if (!autenticado(req)) {
    res.status(401).json({ error: "Não autorizado" });
    return false;
  }
  return true;
}
