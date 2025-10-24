# Guia Atualizado de Deploy na Vercel - UniSafe

## 🎯 Arquitetura Recomendada

Devido às limitações do Socket.IO em ambientes serverless, a arquitetura ideal é:

```
Frontend (Vercel)  →  Backend (Railway/Render)  →  Database (Railway)
    Next.js              Express + Socket.IO           MySQL
```

## 📦 Deploy do Frontend (Vercel)

### 1. Configuração no Dashboard da Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe seu repositório do GitHub
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 2. Variáveis de Ambiente (Frontend)

Configure no painel da Vercel:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app/api
```

**⚠️ IMPORTANTE**: 
- Troque `https://seu-backend.railway.app` pela URL real do seu backend no Railway
- Variáveis com `NEXT_PUBLIC_` são expostas no browser

### 3. Deploy

```bash
# Via CLI
cd frontend
vercel --prod

# Ou apenas faça push no GitHub
git add .
git commit -m "Deploy frontend"
git push origin main
```

## 🚂 Deploy do Backend (Railway - Recomendado)

### Por que Railway para o Backend?

✅ Suporta Socket.IO (servidor persistente)  
✅ Fácil configuração  
✅ Plano gratuito generoso  
✅ Integração com GitHub  
✅ Banco de dados MySQL integrado  

### 1. Criar Conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub

### 2. Deploy do Backend

1. **New Project** → **Deploy from GitHub repo**
2. Selecione o repositório `unisafe`
3. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
   - **Build Command**: `npm install`

### 3. Variáveis de Ambiente (Backend no Railway)

```env
# Database (Railway fornece automaticamente se você criar um serviço MySQL)
DB_HOST=${{MYSQL.MYSQL_HOST}}
DB_PORT=${{MYSQL.MYSQL_PORT}}
DB_USER=${{MYSQL.MYSQL_USER}}
DB_PASSWORD=${{MYSQL.MYSQL_PASSWORD}}
DB_NAME=unisafe

# JWT
JWT_SECRET=seu_jwt_secret_super_secreto_aqui

# URLs
FRONTEND_URL=https://seu-app.vercel.app
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/api/auth/google/callback

# Node
NODE_ENV=production
PORT=5000
```

### 4. Adicionar MySQL ao Railway

1. No projeto, clique em **New** → **Database** → **Add MySQL**
2. As variáveis de conexão serão criadas automaticamente
3. Configure `DB_NAME=unisafe`

### 5. Obter URL do Backend

1. No Railway, vá em **Settings** → **Networking**
2. Clique em **Generate Domain**
3. Copie a URL (ex: `https://unisafe-backend-production.up.railway.app`)
4. Use essa URL no `NEXT_PUBLIC_API_URL` do frontend na Vercel

## 🔄 Fluxo Completo de Deploy

### Primeira vez:

```bash
# 1. Commit das alterações
git add .
git commit -m "Configuração para deploy"
git push origin main

# 2. Deploy do Backend no Railway
# - Faça via dashboard do Railway
# - Anote a URL gerada

# 3. Deploy do Frontend na Vercel
# - Configure NEXT_PUBLIC_API_URL com a URL do Railway
# - Faça via dashboard da Vercel
```

### Atualizações futuras:

```bash
# Apenas faça push - deploy automático!
git add .
git commit -m "Nova feature"
git push origin main
```

## 🧪 Testar o Deploy

### 1. Teste o Backend (Railway)

```bash
# Health check
curl https://seu-backend.railway.app/api/health

# Deve retornar:
# {"status":"ok","timestamp":"...","environment":"production"}
```

### 2. Teste o Frontend (Vercel)

1. Abra `https://seu-app.vercel.app`
2. Teste login/cadastro
3. Verifique console do navegador para erros de CORS

### 3. Teste Socket.IO

```bash
# No console do navegador
const socket = io('https://seu-backend.railway.app')
socket.on('connect', () => console.log('✅ Socket conectado!'))
```

## ⚙️ Configuração do CORS

Certifique-se que no backend (`backend/server.js`), o CORS está configurado:

```javascript
const allowedOrigins = [
  'https://seu-app.vercel.app',
  'http://localhost:3000' // Para desenvolvimento
]
```

## 🐛 Troubleshooting

### Erro: "Failed to fetch" ou "CORS error"

**Solução**: Adicione a URL do Vercel no array `allowedOrigins` do backend

### Socket.IO não conecta

**Solução**: Verifique se:
1. Backend está no Railway (não Vercel)
2. URL do Socket.IO está correta no frontend
3. CORS permite a origem do Vercel

### Erro 500 no backend

**Solução**: 
1. Verifique logs no Railway Dashboard
2. Confira variáveis de ambiente
3. Teste conexão com banco de dados

### Imagens não carregam

**Solução**: Use Cloudinary ou outro serviço de hospedagem de imagens
- Em serverless (Railway/Vercel), uploads locais não persistem

## 📊 Monitoramento

### Railway
- Dashboard → Seu projeto → **Deployments**
- Veja logs em tempo real
- Monitore uso de recursos

### Vercel
- Dashboard → Seu projeto → **Deployments**
- Analytics disponível no plano Pro
- Logs de build e runtime

## 💰 Custos (Planos Gratuitos)

### Vercel (Frontend)
- ✅ 100 GB bandwidth/mês
- ✅ Builds ilimitados
- ✅ Deploy automático

### Railway (Backend)
- ✅ $5 de crédito grátis/mês
- ✅ Suficiente para projetos pequenos/médios
- ⚠️ Monitore uso para não exceder

## 🎓 Resumo dos Comandos

```bash
# Deploy inicial
git add .
git commit -m "Setup deploy"
git push origin main

# Atualizações
git add .
git commit -m "Descrição da mudança"
git push origin main

# Verificar status
vercel ls                    # Lista deploys do Vercel
railway status               # Status do Railway (via CLI)

# Logs
vercel logs <deployment-url> # Logs do Vercel
railway logs                 # Logs do Railway
```

## ✅ Checklist Final

- [ ] Código commitado no GitHub
- [ ] Backend deployado no Railway
- [ ] MySQL configurado no Railway
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] URL do backend anotada
- [ ] Frontend deployado na Vercel
- [ ] `NEXT_PUBLIC_API_URL` configurado na Vercel
- [ ] CORS configurado no backend com URL da Vercel
- [ ] Testado login/cadastro
- [ ] Testado Socket.IO
- [ ] Testado upload de imagens (se usar)

## 🔗 Links Úteis

- [Railway Dashboard](https://railway.app/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
