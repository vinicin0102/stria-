// Dados reais do negócio. Campos vazios simplesmente não aparecem no site,
// então nada falso é exibido enquanto você não preencher.

export const clinic = {
  name: "STRIAÉ",
  tagline: "Dermatologia estética avançada",

  doctor: {
    name: "Dra. Sarah",
    title: "Dermatologista",
    // Coloque a foto em public/ e aponte aqui (ex.: "/doutora.jpg").
    // Vazio = monograma com as iniciais, sem requisição quebrada.
    photo: "",
    // Ex.: "CRM-SP 123456". Vazio = o selo de registro não é exibido.
    crm: "",
  },

  // Só números, com DDI. Ex.: "5511999999999". Vazio = botão oculto.
  whatsapp: "",

  price: {
    original: 1200,
    discountPercent: 40,
  },

  guaranteeDays: 7,

  // Depoimentos reais de clientes. Vazio = a seção não aparece.
  // Ex.: { name: "Juliana M.", text: "...", result: "3 meses de tratamento" }
  testimonials: [] as { name: string; text: string; result: string }[],
};

export const finalPrice = Math.round(
  clinic.price.original * (1 - clinic.price.discountPercent / 100)
);

export const savings = clinic.price.original - finalPrice;

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
