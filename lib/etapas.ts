// Separado de lib/db para o painel poder importar os rótulos sem
// arrastar o driver do Postgres para o navegador.

// Etapa é número, não texto: o avanço vira um greatest() no banco e um
// evento atrasado nunca rebaixa quem já pagou.
export const ETAPAS = [
  "Conversando",
  "Viu a oferta",
  "Preencheu os dados",
  "PIX gerado",
  "Pagou",
] as const;

export const ETAPA = {
  conversando: 0,
  viuOferta: 1,
  preencheuDados: 2,
  pixGerado: 3,
  pagou: 4,
} as const;
