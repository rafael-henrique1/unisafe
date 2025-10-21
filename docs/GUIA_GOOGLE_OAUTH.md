# 🔐 Guia de Implementação - Google OAuth 2.0 no UniSafe

## ✅ Implementação Concluída

A autenticação via Google OAuth 2.0 foi implementada com sucesso no UniSafe! 

### 📦 Dependências Instaladas

```bash
npm install passport passport-google-oauth20 express-session
```

### 🗂️ Arquivos Criados/Modificados

#### Backend:
- ✅ `backend/config/passport.js` - Configuração do Passport.js com estratégia Google OAuth
- ✅ `backend/routes/authGoogle.js` - Rotas de autenticação Google (/google e /google/callback)
- ✅ `backend/config/env.js` - Adicionadas variáveis GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_CALLBACK_URL
- ✅ `backend/config/database.js` - Adicionada função `getPool()` para uso nas rotas OAuth
- ✅ `backend/server.js` - Integrado Passport.js e rotas Google OAuth
- ✅ `backend/.env.example` - Documentadas as novas variáveis de ambiente

#### Frontend:
- ✅ `frontend/pages/login.js` - Adicionado botão "Continuar com Google"
- ✅ `frontend/pages/cadastro.js` - Adicionado botão "Continuar com Google"
- ✅ `frontend/pages/login/success.js` - Página de callback para capturar token JWT

---

## 🚀 Como Configurar

### 1️⃣ Configurar Credenciais do Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google+ API** ou **Google Identity Services**
4. Vá em **Credenciais** → **Criar credenciais** → **ID do cliente OAuth 2.0**
5. Configure a **Tela de consentimento OAuth**:
   - Tipo: Externo
   - Nome do app: UniSafe
   - Email de suporte: seu-email@gmail.com
   - Domínios autorizados: localhost (para dev)
   - Escopos: email, profile

6. Em **URIs de redirecionamento autorizados**, adicione:
   ```
   http://localhost:5000/api/auth/google/callback
   ```

7. Copie o **Client ID** e **Client Secret**

### 2️⃣ Configurar Variáveis de Ambiente

Edite o arquivo `backend/.env` e adicione:

```bash
# Google OAuth 2.0
GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 3️⃣ Iniciar os Servidores

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🧪 Como Testar

### Teste 1: Novo Usuário (Cadastro Automático)
1. Acesse `http://localhost:3000/login`
2. Clique em **"Continuar com Google"**
3. Faça login com uma conta Google não cadastrada
4. O sistema deve:
   - Criar o usuário automaticamente
   - Gerar token JWT
   - Redirecionar para `/feed`
   - Armazenar token no `localStorage`

### Teste 2: Usuário Existente (Login)
1. Use uma conta Google já cadastrada
2. O sistema deve:
   - Autenticar o usuário
   - Gerar novo token JWT
   - Redirecionar para `/feed`

### Teste 3: Erro de Autenticação
1. Cancele o login do Google
2. O sistema deve redirecionar para `/login?error=google_auth_failed`

---

## 🔧 Endpoints da API

### `GET /api/auth/google`
Inicia o fluxo de autenticação OAuth

**Exemplo:**
```javascript
window.location.href = 'http://localhost:5000/api/auth/google'
```

### `GET /api/auth/google/callback`
Callback do Google OAuth (gerenciado automaticamente)

**Fluxo:**
1. Google redireciona para este endpoint com código de autorização
2. Backend valida o código e obtém perfil do usuário
3. Verifica se usuário existe no banco
4. Se não existe, cria novo usuário
5. Gera token JWT
6. Redireciona para frontend: `http://localhost:3000/login/success?token=JWT_TOKEN`

---

## 📊 Estrutura do Banco de Dados

A tabela `usuarios` suporta tanto autenticação tradicional quanto OAuth:

```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255),  -- NULL para usuários OAuth
  foto_perfil TEXT,    -- URL da foto do Google
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Diferenças:**
- Usuários Google: `senha = NULL`, `foto_perfil` contém URL do Google
- Usuários tradicionais: `senha` com hash bcrypt, `foto_perfil` pode ser NULL

---

## 🔐 Segurança

### ✅ Implementado:
- Token JWT com expiração de 7 dias
- Validação de email no Google
- CORS configurado para origens permitidas
- Passport.js sem sessões (stateless)
- Token armazenado apenas no cliente (localStorage)

### 🚨 Importante:
- **NUNCA** commite o arquivo `.env` com credenciais reais
- Use `.env.example` como referência
- Em produção, configure `GOOGLE_CALLBACK_URL` com HTTPS
- Adicione domínio de produção nas URIs autorizadas do Google Cloud

---

## 🧩 Integração com Sistema Existente

### Compatibilidade Total:
✅ Autenticação tradicional (email/senha) continua funcionando normalmente
✅ Middleware JWT funciona para ambos os tipos de login
✅ Rotas protegidas funcionam da mesma forma
✅ Sistema de notificações compatível
✅ Postagens, comentários e curtidas funcionam normalmente

### Diferenciação:
```javascript
// Verificar se usuário é OAuth ou tradicional
const isOAuthUser = !usuario.senha; // senha NULL = usuário Google
```

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"
**Causa:** URI de redirecionamento não configurada no Google Cloud
**Solução:** Adicione `http://localhost:5000/api/auth/google/callback` nas URIs autorizadas

### Erro: "Pool de conexões não inicializado"
**Causa:** Banco de dados não foi inicializado antes do Passport
**Solução:** Certifique-se de que `db.initializeDatabase()` é chamado no `server.js`

### Erro: Token não encontrado na página de sucesso
**Causa:** Callback não está gerando/passando o token
**Solução:** Verifique logs do backend para erros na rota `/google/callback`

### Usuário não é redirecionado após login
**Causa:** Frontend não está processando o token corretamente
**Solução:** Verifique o console do navegador para erros JavaScript

---

## 📝 Notas Adicionais

### URLs Dinâmicas:
Para produção, atualize as URLs hardcoded:
- `backend/routes/authGoogle.js`: linhas 32 e 36
- `frontend/pages/login.js`: botão Google
- `frontend/pages/cadastro.js`: botão Google
- `frontend/pages/login/success.js`: linha 51

**Solução:** Crie uma variável de ambiente `NEXT_PUBLIC_API_URL` no frontend

### Foto de Perfil:
A foto do Google é armazenada no campo `foto_perfil` da tabela `usuarios`. Para exibi-la:

```javascript
const user = JSON.parse(localStorage.getItem('unisafe_user'));
<img src={user.foto_perfil || '/default-avatar.png'} alt="Avatar" />
```

---

## ✨ Funcionalidades Futuras (Sugestões)

- [ ] Login com Facebook
- [ ] Login com GitHub
- [ ] Login com Microsoft
- [ ] Vincular múltiplas contas OAuth ao mesmo usuário
- [ ] Permitir converter conta OAuth em tradicional (definir senha)
- [ ] Permitir vincular conta tradicional com Google

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do backend (`backend/logs/combined.log`)
2. Verifique o console do navegador (F12)
3. Revise este guia
4. Consulte a documentação oficial:
   - [Passport.js](http://www.passportjs.org/)
   - [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

**Implementado em:** 18/10/2025
**Versão:** UniSafe 1.0.0
**Status:** ✅ Concluído e Testado
