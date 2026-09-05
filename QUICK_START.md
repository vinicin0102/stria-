# 🚀 QUICK START - STRIAÉ Funnel

## Windows - Forma Mais Fácil

### Opção 1: Double-click no arquivo
1. Abra o File Explorer
2. Navegue até a pasta do projeto
3. Procure por `start.bat`
4. **Double-click** nele
5. Espere o terminal abrir
6. Abra http://localhost:3000 no navegador

### Opção 2: PowerShell
```powershell
cd "C:\Users\Latitude 3420\AppData\Roaming\Claude\scratch-workspaces\d71a2a82-676a-4985-b37e-d887b758ed99\b9809e20-492f-4125-9eae-206dbda7b2eb\scratch-2026-09-05-436507\stria-app"
npm run dev
```

### Opção 3: Terminal (Qualquer lugar)
```bash
# Você precisa estar na pasta do projeto
cd stria-app
npm run dev
```

---

## ✅ Server está rodando quando você ver:

```
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

---

## 🌐 Abrir no Navegador

Copie e cole na barra de endereço:
```
http://localhost:3000
```

Ou clique aqui: [http://localhost:3000](http://localhost:3000)

---

## 🔧 Troubleshooting

### Porta 3000 já está em uso?
Se aparecer erro "Port 3000 already in use":

**Opção 1:** Mude a porta
```bash
npm run dev -- -p 3001
```
Depois abra http://localhost:3001

**Opção 2:** Termine o processo
```powershell
# Windows PowerShell
Get-Process node | Stop-Process -Force
```

### Node não está instalado?
Baixe em: https://nodejs.org/

### Ainda não funciona?
Verifique:
1. Pasta `.next` existe? (se sim, delete)
2. Pasta `node_modules` existe?
3. Arquivo `.env.local` existe?

Se ainda não funcionar:
```bash
# Delete cache e reinstale
rm -r .next node_modules
npm install
npm run dev
```

---

## 📝 Importante!

**Antes de rodar, adicione sua Claude API Key:**

1. Abra o arquivo `.env.local`
2. Procure por `ANTHROPIC_API_KEY=`
3. Substitua por sua chave real de https://console.anthropic.com

Sem isso, o chat não funcionará!

---

## ⏹️ Para Parar o Servidor

Pressione no terminal: **CTRL + C**

---

**Tudo funcionando? 🎉 Bora testar o funnel!**
