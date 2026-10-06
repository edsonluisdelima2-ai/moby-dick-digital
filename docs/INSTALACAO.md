# Moby Dick Digital — White Label
## Guia de Instalação e Uso

### Versão
1.0.0

### O que é
Sistema de vitrine digital para restaurantes. Permite que o dono configure:
- Nome, endereço, contato (WhatsApp)
- Prato do dia com foto e preço
- Promoções
- Cardápio completo
- Mapa (Google Maps)
- Cadastro de clientes que querem receber o cardápio do dia

Clientes veem uma página pública responsiva. Dono acessa área autenticada para editar conteúdo sem mexer em código.

---

## Instalação Local (Desenvolvimento)

### Pré-requisitos
- Node.js 16+ (https://nodejs.org)
- npm ou yarn

### Passos

1. Entre na pasta do projeto
```bash
cd Moby_Dick_White_Label
```

2. Instale as dependências
```bash
npm install
```

3. Inicie o servidor
```bash
npm start
```

4. Abra no navegador
```
http://localhost:3000
```

Acesso do dono:
```
http://localhost:3000/dono
```

---

## Estrutura de Pastas

```
Moby_Dick_White_Label/
├── public/
│   ├── index.html              (página pública)
│   ├── dono/
│   │   └── index.html          (painel do dono)
│   └── media/                  (imagens dos pratos/promoções)
├── private/                    (reservado para futuro)
├── data/                       (banco de dados SQLite)
│   └── moby.db
├── server.js                   (backend Node.js)
├── package.json
└── docs/
    ├── INSTALACAO.md           (este arquivo)
    └── API.md                  (documentação da API)
```

---

## Primeiro Uso

### 1. Registrar um restaurante

Acesse `http://localhost:3000/dono`

Clique em "Registrar novo restaurante" e preecha:
- Nome do restaurante
- Email
- Senha

Após registrar, você estará automaticamente logado.

### 2. Configurar informações básicas

Na aba "Configurações":
- Nome do restaurante
- Endereço completo
- Número do WhatsApp
- URL do Google Maps

Salve as alterações.

### 3. Adicionar prato do dia

Na aba "Cardápio e Promoções":
- Tipo: Prato do Dia
- Nome: ex. "Sobrecoxa desossada grelhada"
- Descrição: ex. "Polenta frita, arroz e salada"
- Preço: ex. 29.90
- Foto: selecione uma imagem PNG ou JPG

Clique "Adicionar Item". A imagem é salva no servidor.

### 4. Verificar página pública

Acesse `http://localhost:3000` para ver como fica.

A página mostra:
- Prato do dia com foto em tamanho integral
- Promoções (se houver)
- Cardápio
- Mapa e contato
- Formulário de cadastro

---

## Hospedagem em Produção

### Opções recomendadas

1. **Vercel** (Node.js)
   - Grátis + pago
   - Muito simples
   - Banco de dados SQLite funciona mas é melhor usar D1

2. **Heroku** ou **Railway**
   - Grátis + pago
   - Compatível

3. **VPS/Self-hosted** (DigitalOcean, Linode, AWS)
   - Controle total
   - Requer mais configuração

### Passos para Vercel

1. Instale Vercel CLI
```bash
npm i -g vercel
```

2. Faça deploy
```bash
vercel
```

3. Configure variáveis de ambiente em Vercel Dashboard:
   - `SESSION_SECRET`: gere uma string aleatória longa

### Passos para D1 (se usar Cloudflare)

1. Migre o banco de dados SQLite para Cloudflare D1
2. Atualize `server.js` para usar D1 em produção
3. Deploy via Wrangler

---

## Configurações Importantes

### Arquivo `.env` (crie na raiz do projeto)

```
PORT=3000
NODE_ENV=development
SESSION_SECRET=sua-chave-super-secreta-aqui
```

Em produção, use uma chave aleatória forte:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Dados e Persistência

### Banco de dados
- Arquivo: `data/moby.db`
- Tipo: SQLite 3
- Criado automaticamente na primeira execução

### Imagens
- Salvas em: `public/media/`
- Referenciadas no banco de dados
- URLs públicas: `/media/nome-da-imagem.png`

### O que é salvo automaticamente
- Configurações do restaurante (nome, endereço, WhatsApp, mapa)
- Itens do menu (pratos, preços, descrições)
- Imagens
- Cadastros de clientes
- Sessões autenticadas

---

## Segurança

### Implementado
- Hash de senhas com bcrypt
- Sessões seguras (httpOnly cookies em HTTPS)
- Autenticação por email/senha
- Verificação de permissões (dono só vê seus dados)

### Recomendações para produção
1. Use HTTPS obrigatório
2. Altere `SESSION_SECRET` para algo único e forte
3. Configure CORS se a API for usada de domínios diferentes
4. Use variáveis de ambiente para credenciais sensíveis
5. Faça backup regular do banco de dados

---

## APIs Disponíveis

### Públicas (sem autenticação)

```
GET /api/establishments/:slug
GET /api/menu-images?establishment_id=X
POST /api/customers
```

### Autenticadas (precisa estar logado)

```
POST /api/owner/register
POST /api/owner/login
POST /api/owner/logout
GET /api/owner/me
POST /api/establishments
GET /api/establishments/:id/config
PUT /api/establishments/:id
POST /api/menu-items
PUT /api/menu-items/:id
POST /api/menu-images
GET /api/customers/:establishment_id
```

Veja `API.md` para detalhes completos.

---

## Troubleshooting

### "sqlite3 not found"
Execute `npm install` novamente:
```bash
npm install
```

### Porta 3000 já está em uso
Use outra porta:
```bash
PORT=3001 npm start
```

### Imagens não aparecem
1. Verifique se `public/media/` existe
2. Confira se o caminho da imagem no banco está correto
3. Reinicie o servidor

### Erro ao fazer login
1. Verifique se o email existe no banco
2. Confira a senha
3. Limpe cookies do navegador e tente novamente

---

## Próximos Passos

1. Clonar para novo restaurante
2. Integrar com sistemas de pagamento (Stripe, PagSeguro)
3. App mobile (React Native)
4. Sistema de pedidos
5. Dashboard de analytics

---

## Suporte

Para dúvidas ou problemas, verifique:
- `docs/API.md` para detalhes técnicos
- Logs do console (`npm start`)
- Banco de dados em `data/moby.db` (use SQLite Browser para visualizar)

---

**Desenvolvido com ❤️ para Edson Lima**
Moby Dick Digital — White Label
