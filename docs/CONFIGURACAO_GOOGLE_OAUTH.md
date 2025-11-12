# 🔐 Configuração Google OAuth - UniSafe

## ✅ O que foi feito

### 1. **Frontend - Configuração Dinâmica**
- ✅ Adicionado endpoint `googleAuth` em `frontend/config/api.js`
- ✅ Atualizado `login.js` para usar `endpoints.googleAuth` (dinâmico)
- ✅ Atualizado `cadastro.js` para usar `endpoints.googleAuth` (dinâmico)
- ✅ Atualizado `login/success.js` para usar `API_URL` (dinâmico)

### 2. **Backend - Já Configurado**
- ✅ Passport.js configurado corretamente
- ✅ Rotas OAuth funcionando (`/api/auth/google` e `/api/auth/google/callback`)
- ✅ Railway com variáveis de ambiente corretas

### 3. **Google Console - Já Configurado**
- ✅ URIs de redirecionamento autorizados:
  - `https://unisafe-production.up.railway.app/api/auth/google/callback`
  - `https://unisafe-ruby.vercel.app`
  - `http://localhost:3000`

---

## 🚀 Configuração Final no Vercel

Para que o login Google funcione **em produção**, você precisa adicionar a variável de ambiente no Vercel:

### Passo 1: Acessar Vercel Dashboard
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: **unisafe-ruby**
3. Vá em: **Settings** > **Environment Variables**

### Passo 2: Adicionar Variável
Adicione a seguinte variável de ambiente:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://unisafe-production.up.railway.app` |

**Importante:** Marque para aplicar em **Production, Preview e Development**

### Passo 3: Fazer Redeploy
Após adicionar a variável:
1. Vá na aba **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Selecione **Redeploy**

---

## 🧪 Como Testar

### **Localmente (Localhost)**
1. Backend rodando em: `http://localhost:5000`
2. Frontend rodando em: `http://localhost:3000`
3. Acesse: http://localhost:3000/login
4. Clique em **"Google"**
5. ✅ Deve redirecionar para Google → Callback localhost → Success → Feed

### **Produção (Vercel + Railway)**
1. Backend em: `https://unisafe-production.up.railway.app`
2. Frontend em: `https://unisafe-ruby.vercel.app`
3. Acesse: https://unisafe-ruby.vercel.app/login
4. Clique em **"Google"**
5. ✅ Deve redirecionar para Google → Callback Railway → Success → Feed

---

## 📋 Fluxo Completo do OAuth

```
1. Usuário clica em "Google" no login/cadastro
   ↓
2. Frontend redireciona para: ${API_URL}/api/auth/google
   - Local: http://localhost:5000/api/auth/google
   - Prod: https://unisafe-production.up.railway.app/api/auth/google
   ↓
3. Backend redireciona para tela de login do Google
   ↓
4. Usuário faz login no Google
   ↓
5. Google redireciona para callback do backend:
   - Local: http://localhost:5000/api/auth/google/callback
   - Prod: https://unisafe-production.up.railway.app/api/auth/google/callback
   ↓
6. Backend valida, gera JWT e redireciona para frontend:
   - Local: http://localhost:3000/login/success?token=JWT
   - Prod: https://unisafe-ruby.vercel.app/login/success?token=JWT
   ↓
7. Frontend (success.js) captura token, salva no localStorage
   ↓
8. Frontend busca dados do usuário: ${API_URL}/api/usuarios/${userId}
   ↓
9. Redireciona para /feed
   ✅ SUCESSO!
```

---

## 🔧 Variáveis de Ambiente

### **Frontend (.env.local)**
```bash
# Desenvolvimento
NEXT_PUBLIC_API_URL=http://localhost:5000

# Produção (configurar no Vercel)
NEXT_PUBLIC_API_URL=https://unisafe-production.up.railway.app
```

### **Backend (.env no Railway)**
```bash
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALLBACK_URL=https://unisafe-production.up.railway.app/api/auth/google/callback
FRONTEND_URL=https://unisafe-ruby.vercel.app
JWT_SECRET=seu_jwt_secret_aqui
DATABASE_URL=sua_database_url_aqui
```

---

## ✅ Checklist Final

- [x] Google Console configurado com todos os URIs
- [x] Railway com variáveis de ambiente corretas
- [ ] **Vercel com NEXT_PUBLIC_API_URL configurada** ⚠️ FAÇA ISSO!
- [x] Frontend atualizado com URLs dinâmicas
- [x] Backend com Passport.js funcionando
- [x] Teste local funcionando
- [ ] Teste produção após configurar Vercel

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se o URI de callback está cadastrado no Google Console
- Deve ser: `https://unisafe-production.up.railway.app/api/auth/google/callback`

### Erro: "ERR_CONNECTION_REFUSED"
- Verifique se o backend está rodando
- Local: http://localhost:5000
- Prod: https://unisafe-production.up.railway.app

### Erro: Token não encontrado
- Verifique se o callback está retornando para o frontend correto
- Verifique a variável `FRONTEND_URL` no Railway

### Erro: "Failed to fetch user data"
- Verifique se `NEXT_PUBLIC_API_URL` está configurada no Vercel
- Deve apontar para o Railway em produção

---

**Última atualização:** 11/11/2025
