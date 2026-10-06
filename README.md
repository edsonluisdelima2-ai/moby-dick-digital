# Moby Dick Digital — White Label

**Versão 1.0.0**

Vitrine digital completa para restaurantes. Prato do dia, promoções, cardápio, mapa, WhatsApp, cadastro de clientes.

## Início Rápido

```bash
npm install
npm start
```

Abra `http://localhost:3000`

Painel do dono: `http://localhost:3000/dono`

## O que funciona

✓ Página pública responsiva  
✓ Prato do dia com foto em tamanho integral  
✓ Promoções com imagens  
✓ Cardápio completo  
✓ Google Maps  
✓ WhatsApp integrado  
✓ Cadastro de clientes  
✓ QR code permanente (imagens ajustáveis)  
✓ Área do dono autenticada  
✓ Edição de conteúdo sem mexer em código  
✓ Banco de dados persistente (SQLite)  
✓ Upload de imagens  

## Estrutura

```
├── public/
│   ├── index.html              (página pública)
│   ├── dono/index.html         (painel do dono)
│   └── media/                  (imagens)
├── data/moby.db                (banco de dados)
├── server.js                   (backend)
└── docs/INSTALACAO.md          (guia completo)
```

## Para o dono

1. Registre-se em `/dono`
2. Configure informações básicas (nome, endereço, WhatsApp)
3. Adicione prato do dia e promoções
4. Suba imagens (PNG/JPG em tamanho integral, sem cortes)
5. Pronto — a página pública atualiza automaticamente

## Para o cliente

Acessa página pública em `/` ou por QR code:
- Vê prato do dia
- Vê promoções
- Abre mapa
- Entra em contato por WhatsApp
- Cadastra para receber cardápio do dia

## Hospedagem

Compatível com:
- Vercel (recomendado para começar)
- Heroku
- Railway
- VPS própria

Veja `docs/INSTALACAO.md` para instruções.

## Segurança

- Senhas com hash bcrypt
- Sessões seguras
- Autenticação por owner
- CORS configurável

## Próximas versões

- Sistema de pedidos
- Integração com Stripe
- App mobile
- Analytics
- Múltiplos administradores

---

Para detalhes completos, leia `docs/INSTALACAO.md`

**Moby Dick Digital © 2025**
