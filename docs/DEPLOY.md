# 🚀 GUIA DE DEPLOY - UNISAFE

**Última atualização:** 21/10/2025  
**Ambiente:** Produção  
**Stack:** Backend (Railway) + Frontend (Vercel) + MySQL (Railway)

---

## 📋 PRÉ-REQUISITOS

Antes de iniciar o deploy, certifique-se de ter:

- ✅ Conta no [Railway](https://railway.app)
- ✅ Conta no [Vercel](https://vercel.com)
- ✅ Projeto Google Cloud com OAuth configurado
- ✅ Repositório GitHub com código atualizado
- ✅ Node.js 18+ instalado localmente (para testes)

---

## 🗄️ PARTE 1: DATABASE (MySQL no Railway)

### 1.1 Criar Banco de Dados

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em **"New Project"**
3. Selecione **"Provision MySQL"**
4. Aguarde o provisionamento (~2 minutos)

### 1.2 Obter URL de Conexão

1. Clique no serviço MySQL criado
2. Vá na aba **"Variables"**
3. Copie a variável `DATABASE_URL`
   ```
   Formato: mysql://user:password@host:port/railway
   Exemplo: mysql://root:xyzABC123@containers-us-west-123.railway.app:6543/railway
   ```

### 1.3 Configurar Schema

**Opção A: Migrations Automáticas (Recomendado)**
- O backend possui migrations automáticas em `config/database.js`
- Ao iniciar pela primeira vez, as tabelas serão criadas automaticamente

**Opção B: Executar SQL Manualmente**
1. Railway Dashboard → MySQL → **"Query"**
2. Executar script:
   ```sql
   -- Ver schema completo em backend/config/database.js
   CREATE TABLE usuarios (...);
   CREATE TABLE postagens (...);
   CREATE TABLE curtidas (...);
   CREATE TABLE comentarios (...);
   CREATE TABLE notificacoes (...);
   ```

---

## ⚙️ PARTE 2: BACKEND (Railway)

### 2.1 Conectar Repositório

1. Railway Dashboard → **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Autorize acesso ao GitHub
4. Selecione o repositório `unisafe`
5. Railway detectará automaticamente Node.js

### 2.2 Configurar Root Directory

⚠️ **IMPORTANTE:** Por padrão, Railway tenta buildar a raiz do projeto

1. Clique no serviço criado
2. Vá em **"Settings"**
3. Em **"Root Directory"**, configure:
   ```
   backend
   ```
4. Salve as configurações

### 2.3 Configurar Variáveis de Ambiente

Railway Dashboard → Seu Projeto Backend → **"Variables"** → **"Add Variables"**

```env
# Database (copiar do MySQL Railway)
DATABASE_URL=mysql://root:SENHA@host:port/railway

# JWT (gerar com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=sua_chave_secreta_super_segura_64_caracteres

# URLs (ATUALIZAR após deploy do frontend!)
FRONTEND_URL=https://unisafe-seu-dominio.vercel.app

# Google OAuth (do Google Cloud Console)
GOOGLE_CLIENT_ID=918785286643-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=https://unisafe-backend-production.up.railway.app/api/auth/google/callback

# Porta (Railway define automaticamente, mas pode especificar)
PORT=5000
```

### 2.4 Deploy

1. Após configurar variáveis, Railway iniciará deploy automaticamente
2. Aguarde build (~3-5 minutos)
3. Verifique logs em **"Deployments"**
4. Se sucesso, verá: `✅ Servidor rodando na porta 5000`

### 2.5 Obter URL do Backend

1. Railway Dashboard → Seu Projeto Backend → **"Settings"**
2. Em **"Networking"**, clique em **"Generate Domain"**
3. Copie a URL gerada:
   ```
   https://unisafe-backend-production.up.railway.app
   ```

---

## 🌐 PARTE 3: FRONTEND (Vercel)

### 3.1 Conectar Repositório

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New Project"**
3. Selecione **"Import Git Repository"**
4. Escolha o repositório `unisafe`

### 3.2 Configurar Root Directory

⚠️ **IMPORTANTE:** Vercel também precisa saber onde está o frontend

1. Na tela de importação, em **"Root Directory"**, clique em **"Edit"**
2. Selecione `frontend`
3. Framework Preset: **Next.js** (auto-detectado)

### 3.3 Configurar Environment Variables

Na tela de configuração do projeto:

```env
NEXT_PUBLIC_API_URL=https://unisafe-backend-production.up.railway.app
```

⚠️ **Atenção:** Use a URL do Railway (Parte 2.5)

### 3.4 Deploy

1. Clique em **"Deploy"**
2. Aguarde build (~2-3 minutos)
3. Vercel mostrará preview da aplicação

### 3.5 Obter URL do Frontend

1. Após deploy, Vercel mostrará a URL:
   ```
   https://unisafe-seu-usuario.vercel.app
   ```
2. Copie essa URL

---

## 🔐 PARTE 4: ATUALIZAR CONFIGURAÇÕES

### 4.1 Atualizar Railway (Backend)

Agora que você tem a URL do frontend, atualize:

Railway Dashboard → Backend → **"Variables"** → Editar:
```env
FRONTEND_URL=https://unisafe-seu-usuario.vercel.app
```

Railway fará redeploy automático.

### 4.2 Atualizar Google Cloud Console

⚠️ **CRÍTICO:** Sem isso, OAuth não funcionará!

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Navegue até: **APIs & Services** → **Credentials**
3. Clique no seu **OAuth 2.0 Client ID**
4. Em **"Authorized redirect URIs"**, adicione:
   ```
   https://unisafe-backend-production.up.railway.app/api/auth/google/callback
   ```
5. Em **"Authorized JavaScript origins"**, adicione:
   ```
   https://unisafe-seu-usuario.vercel.app
   ```
6. Clique em **"Save"**

---

## ✅ PARTE 5: VALIDAÇÃO DO DEPLOY

### 5.1 Checklist de Verificação

Execute esses testes em **produção**:

- [ ] **Backend Health Check**
  - Acessar: `https://seu-backend.railway.app/`
  - Esperado: `{"message":"UniSafe API está rodando!"}`

- [ ] **Frontend Carrega**
  - Acessar: `https://seu-frontend.vercel.app`
  - Esperado: Landing page do UniSafe

- [ ] **Login Tradicional Funciona**
  - Ir para `/login`
  - Testar credenciais ou cadastrar novo usuário
  - Esperado: Redirect para `/feed`

- [ ] **Google OAuth Funciona**
  - Clicar em "Continuar com Google"
  - Esperado: Fluxo OAuth completo, redirect para `/feed`

- [ ] **Feed Carrega Postagens**
  - Acessar `/feed` autenticado
  - Esperado: Lista de postagens em < 3 segundos

- [ ] **Socket.IO Conecta**
  - Verificar console do navegador
  - Esperado: `[SOCKET] ✅ CONECTADO`

- [ ] **Criar Postagem Funciona**
  - Criar postagem de teste
  - Esperado: Aparece no feed em tempo real

### 5.2 Verificar Logs

**Backend (Railway):**
1. Dashboard → Seu Projeto → **"Deployments"**
2. Clicar no deploy ativo → **"View Logs"**
3. Verificar se há erros

**Frontend (Vercel):**
1. Dashboard → Seu Projeto → **"Functions"**
2. Verificar logs de erros

---

## 🐛 TROUBLESHOOTING

### Problema: Backend não inicia

**Sintomas:**
- Erro `APPLICATION FAILED TO RESPOND ON PORT`

**Soluções:**
1. Verificar se `PORT` está configurado corretamente
2. Verificar `backend/package.json`:
   ```json
   {
     "scripts": {
       "start": "node server.js"
     }
   }
   ```
3. Verificar logs: `Error connecting to database`
   - Conferir `DATABASE_URL`

### Problema: OAuth Google falha

**Sintomas:**
- Erro `redirect_uri_mismatch`

**Soluções:**
1. Google Cloud Console → Credentials
2. Conferir **"Authorized redirect URIs"**:
   - ✅ DEVE ter: `https://seu-backend.railway.app/api/auth/google/callback`
   - ❌ NÃO pode ter: `http://localhost:5000/...` (remover!)

### Problema: Frontend não carrega postagens

**Sintomas:**
- Erro CORS no console
- `Access to fetch blocked by CORS policy`

**Soluções:**
1. Verificar `backend/server.js`:
   ```javascript
   const corsOptions = {
     origin: [process.env.FRONTEND_URL],
     credentials: true
   }
   app.use(cors(corsOptions))
   ```
2. Verificar variável `FRONTEND_URL` no Railway

### Problema: Socket.IO não conecta

**Sintomas:**
- `[SOCKET] ❌ Erro de conexão`

**Soluções:**
1. Verificar configuração Socket.IO no backend:
   ```javascript
   const io = new Server(server, {
     cors: {
       origin: [process.env.FRONTEND_URL],
       credentials: true
     }
   })
   ```
2. Verificar se Railway expôs a porta WebSocket

---

## 🔄 ATUALIZAÇÕES FUTURAS

### Como fazer redeploy

**Backend (Railway):**
1. Fazer commit no GitHub
2. Push para `main`
3. Railway detecta e faz redeploy automático

**Frontend (Vercel):**
1. Fazer commit no GitHub
2. Push para `main`
3. Vercel detecta e faz redeploy automático

### Rollback de Emergência

**Railway:**
1. Dashboard → Deployments
2. Selecionar deploy anterior
3. Clicar em **"Redeploy"**

**Vercel:**
1. Dashboard → Deployments
2. Selecionar deploy anterior
3. Clicar em **"Promote to Production"**

---

## 📊 MONITORAMENTO

### Logs em Tempo Real

**Railway:**
```bash
railway logs --tail
```

**Vercel:**
```bash
vercel logs --follow
```

### Métricas Importantes

- **Uptime:** Railway/Vercel Dashboard
- **Response Time:** Verificar < 3s para feed
- **Concurrent Users:** Socket.IO stats

---

## 🎯 CHECKLIST FINAL PRÉ-ENTREGA

- [ ] ✅ Backend no ar (Railway)
- [ ] ✅ Frontend no ar (Vercel)
- [ ] ✅ Database conectado (MySQL Railway)
- [ ] ✅ Google OAuth funcionando
- [ ] ✅ Socket.IO conectando
- [ ] ✅ URLs de produção atualizadas
- [ ] ✅ Testes de aceitação passando (ver CHECKLIST_TESTES.md)
- [ ] ✅ Logs sem erros críticos
- [ ] ✅ README.md atualizado com URLs de produção

---

## 📞 SUPORTE

**Documentação Railway:**  
https://docs.railway.app

**Documentação Vercel:**  
https://vercel.com/docs

**Google OAuth Troubleshooting:**  
https://developers.google.com/identity/protocols/oauth2

---

**Deploy realizado por:** Rafael Henrique  
**Data:** 21/10/2025  
**Status:** ✅ PRONTO PARA EXECUÇÃO
