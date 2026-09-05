# 🤖 Usando OpenAI no Lugar de Claude

Como a API Claude não está funcionando, vamos usar **OpenAI (GPT)** temporariamente!

## 📝 Passo 1: Pegar API Key do OpenAI

1. Vá para: https://platform.openai.com
2. Faça login ou crie conta
3. Vá em **"API Keys"**
4. Clique em **"Create new secret key"**
5. Copie a chave (começa com `sk-proj-`)

## ✏️ Passo 2: Adicionar no .env.local

Abra `.env.local` e adicione:

```
OPENAI_API_KEY=sk-proj-sua-chave-aqui
```

Substitua `sua-chave-aqui` pela chave que você copiou!

## 🔄 Passo 3: Atualizar o Código

Abra `components/ChatWindow.tsx` e mude:

```typescript
// De:
const response = await axios.post("/api/chat", {

// Para:
const response = await axios.post("/api/chat-openai", {
```

## 🚀 Passo 4: Reiniciar e Testar

1. Pare o servidor (CTRL + C)
2. Rode: `npm run dev`
3. Abra http://localhost:3000
4. Teste o chat!

---

## ✅ Funcionando?

Se o chat responder com sucesso, você vê uma mensagem natural da Dra. Sarah!

## 💰 Custos OpenAI

- GPT-3.5: ~$0.50 por 1 milhão de tokens
- Muito barato para testes
- Crie um limite mensal se quiser: https://platform.openai.com/account/billing/limits

---

## 🔙 Quando Claude Funcionar

Depois que sua conta Claude estiver configurada:

1. Volte para usar `/api/chat` em vez de `/api/chat-openai`
2. Remova a chave OpenAI
3. Pronto!

---

**Tá esperando o quê? Bora testar! 🚀**
