# Publicar em Replit (Gratuito)

## Passo 1: Preparar
1. Acesse **replit.com** (crie conta se precisar)
2. Clique em "**+ Create Repl**"
3. Selecione "**Import from GitHub**" (ou "Upload")

## Passo 2: Upload
Se for upload direto:
1. Escolha "Node.js" como linguagem
2. Arraste o arquivo `Moby_Dick_White_Label.tar.gz` para dentro
3. Replit vai descompactar automaticamente

Se for GitHub:
1. Faça push do repositório para GitHub
2. Cole a URL do repositório em Replit
3. Clique "Import"

## Passo 3: Instalar
Na aba "Shell" do Replit, execute:
```bash
npm install
node scripts/seed-moby-dick.js
```

## Passo 4: Rodar
Clique em "**Run**" ou execute:
```bash
npm start
```

Replit vai gerar uma URL pública (algo como `https://seu-projeto.seu-usuario.repl.co`)

## Passo 5: Acessar
- 🌐 Página pública: `https://seu-projeto.seu-usuario.repl.co/`
- 👨‍💼 Painel do dono: `https://seu-projeto.seu-usuario.repl.co/dono`

**Credenciais:**
- Email: `moby@example.com`
- Senha: `moby123`

---

## Alternativa: Vercel (também gratuito)
Se preferir Vercel:
1. Acesse **vercel.com**
2. Conecte seu GitHub
3. Importe o repositório
4. Vercel faz deploy automático

(Vercel funciona melhor mas tem limitação com SQLite em serverless)
