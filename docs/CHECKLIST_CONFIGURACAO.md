# ✅ Checklist de Configuração - UniSafe

Use este checklist ao clonar o repositório em um novo PC.

## 📋 Pré-requisitos

- [ ] Node.js (v16+) instalado
- [ ] npm ou yarn instalado
- [ ] Git instalado
- [ ] Acesso ao banco MySQL (Railway)

---

## 🔧 Configuração do Backend

### 1. Navegue para a pasta backend
```bash
cd backend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. ⚠️ CRIE o arquivo `.env`
```bash
cp .env.example .env
```

### 4. ✏️ EDITE o arquivo `.env` com suas credenciais

Abra `backend/.env` e configure:

```bash
# ✅ OBRIGATÓRIO
DATABASE_URL="mysql://root:SUA_SENHA@mainline.proxy.rlwy.net:PORTA/railway"
JWT_SECRET="gere_uma_chave_segura_aqui"

# ✅ URLs
PORT=5000
FRONTEND_URL=http://localhost:3000

# ⚠️ OPCIONAL (somente se usar Google OAuth)
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

**Como obter:**
- **DATABASE_URL**: Copie do painel do Railway
- **JWT_SECRET**: Execute `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Google OAuth**: Veja `GUIA_GOOGLE_OAUTH.md` (opcional)

### 5. Inicie o servidor
```bash
npm run dev
```

✅ Backend rodando em http://localhost:5000

---

## 💻 Configuração do Frontend

### 1. Navegue para a pasta frontend
```bash
cd ../frontend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. ⚠️ CRIE o arquivo `.env.local`
```bash
cp .env.local.example .env.local
```

### 4. ✏️ EDITE o arquivo `.env.local` (opcional)

Abra `frontend/.env.local` e verifique:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> **Nota:** Para desenvolvimento local, o padrão já funciona.
> Altere apenas se o backend estiver em outra porta ou servidor.

### 5. Inicie o servidor
```bash
npm run dev
```

✅ Frontend rodando em http://localhost:3000

---

## 🎉 Verificação Final

Acesse http://localhost:3000 e verifique:

- [ ] Página inicial carrega corretamente
- [ ] Consegue acessar /login
- [ ] Consegue acessar /cadastro
- [ ] Backend responde em http://localhost:5000

---

## 📝 Arquivos que você DEVE criar manualmente

| Pasta | Arquivo | Template | Obrigatório? |
|-------|---------|----------|--------------|
| `backend/` | `.env` | `.env.example` | ✅ SIM |
| `frontend/` | `.env.local` | `.env.local.example` | ✅ SIM |

**IMPORTANTE:** 
- Esses arquivos NÃO estão no Git (`.gitignore`)
- Você DEVE criá-los sempre que clonar o repositório
- Use os arquivos `.example` como modelo

---

## 🆘 Problemas Comuns

### Backend não inicia
- ✅ Verificou se o `.env` existe?
- ✅ Configurou `DATABASE_URL` correta?
- ✅ Configurou `JWT_SECRET`?
- ✅ Executou `npm install`?

### Frontend não conecta ao backend
- ✅ Backend está rodando na porta 5000?
- ✅ Criou o arquivo `.env.local`?
- ✅ `NEXT_PUBLIC_API_URL` está correto?

### Erro ao fazer login
- ✅ Banco de dados está acessível?
- ✅ Tabelas foram criadas automaticamente?
- ✅ JWT_SECRET está configurado?

### Google OAuth não funciona
- ✅ Configurou `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`?
- ✅ URIs de redirecionamento estão corretas no Google Cloud Console?
- ✅ Leu o `GUIA_GOOGLE_OAUTH.md`?

---

## 📚 Documentação Adicional

- **Google OAuth:** Leia `GUIA_GOOGLE_OAUTH.md`
- **Resumo técnico:** Leia `RESUMO_IMPLEMENTACAO_OAUTH.md`
- **Informações gerais:** Leia `README.md`

---

**Última atualização:** 18/10/2025
