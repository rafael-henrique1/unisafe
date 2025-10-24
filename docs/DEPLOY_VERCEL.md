# Guia de Deploy na Vercel - UniSafe

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta no [Railway](https://railway.app) ou outro provedor de banco MySQL
3. Projeto no GitHub (recomendado para CI/CD automático)

## 🚀 Configuração do Deploy

### 1. Preparação do Projeto

O projeto já está configurado com os seguintes arquivos:

- `/vercel.json` - Configuração principal do monorepo
- `/backend/vercel.json` - Configuração específica do backend
- `/backend/api/index.js` - Handler serverless para o backend
- `/.vercelignore` - Arquivos a serem ignorados no deploy

### 2. Deploy via Vercel CLI

#### Instalar Vercel CLI:
```bash
npm install -g vercel
```

#### Fazer login:
```bash
vercel login
```

#### Deploy do projeto:
```bash
# Na raiz do projeto
vercel

# Para deploy de produção
vercel --prod
```

### 3. Deploy via GitHub (Recomendado)

1. **Push do código para o GitHub**:
   ```bash
   git add .
   git commit -m "Configuração para deploy na Vercel"
   git push origin main
   ```

2. **Conectar repositório na Vercel**:
   - Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
   - Clique em "Add New Project"
   - Importe seu repositório do GitHub
   - Selecione o projeto `unisafe`

3. **Configurar o projeto**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (raiz)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/.next`

### 4. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel da Vercel:

#### Backend:
```env
# Database
DB_HOST=seu-railway-host.railway.app
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=unisafe

# JWT
JWT_SECRET=seu_jwt_secret_aqui

# URLs
FRONTEND_URL=https://seu-dominio.vercel.app
BACKEND_URL=https://seu-dominio.vercel.app/api

# Google OAuth (se usar)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=https://seu-dominio.vercel.app/api/auth/google/callback

# Node
NODE_ENV=production
```

#### Frontend:
```env
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app/api
```

### 5. Configurações Importantes

#### ⚠️ Limitações da Vercel (Serverless)

1. **Socket.IO**: Não funciona nativamente em serverless
   - **Solução**: Use serviço externo como [Pusher](https://pusher.com) ou [Ably](https://ably.com)
   - Ou hospede o backend em serviço com servidor persistente (Railway, Render)

2. **Uploads de arquivos**: Armazenamento efêmero
   - **Solução**: Use serviço de armazenamento como:
     - [Cloudinary](https://cloudinary.com) (recomendado para imagens)
     - [AWS S3](https://aws.amazon.com/s3/)
     - [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)

3. **Timeout de execução**: 10 segundos (hobby), 60 segundos (pro)

### 6. Arquitetura Recomendada

Para melhor funcionamento, considere esta arquitetura:

```
┌─────────────────────────────────────┐
│         Vercel (Frontend)           │
│        Next.js Application          │
└─────────────────┬───────────────────┘
                  │
      ┌───────────┴──────────┐
      │                      │
┌─────▼──────────┐   ┌──────▼────────────┐
│  Railway/Render│   │   Cloudinary      │
│  (Backend API) │   │  (File Storage)   │
│  + Socket.IO   │   │                   │
└────────┬───────┘   └───────────────────┘
         │
    ┌────▼─────┐
    │  Railway │
    │  (MySQL) │
    └──────────┘
```

#### Alternativa: Backend na Vercel (Sem Socket.IO)

Se você não precisa de notificações em tempo real:

1. **Remover Socket.IO do backend**:
   - Use polling ou webhooks para notificações
   - Simplifique o `server.js` removendo dependências do Socket.IO

2. **Deploy apenas na Vercel**:
   - Frontend e Backend juntos
   - Use Vercel Blob para uploads
   - Use Railway apenas para MySQL

### 7. Testando o Deploy

Após o deploy, teste:

```bash
# Health check
curl https://seu-dominio.vercel.app/api/health

# Teste de API
curl https://seu-dominio.vercel.app/api/auth/test
```

### 8. Monitoramento

- Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
- Verifique logs em **Deployment → Logs**
- Configure alertas em **Settings → Monitoring**

### 9. Domínio Personalizado (Opcional)

1. Vá em **Settings → Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções

## 🔧 Troubleshooting

### Erro: "Module not found"
```bash
# Limpe cache e reinstale
vercel --force
```

### Erro: "Build failed"
```bash
# Verifique logs
vercel logs seu-deployment-url
```

### Erro 500 no backend
- Verifique variáveis de ambiente
- Verifique conexão com banco de dados
- Consulte logs no painel da Vercel

## 📚 Recursos

- [Documentação Vercel](https://vercel.com/docs)
- [Deploy Node.js na Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Monorepo na Vercel](https://vercel.com/docs/monorepos)

## ✅ Checklist de Deploy

- [ ] Criar conta na Vercel
- [ ] Configurar banco de dados no Railway
- [ ] Configurar variáveis de ambiente
- [ ] Fazer push do código para GitHub
- [ ] Conectar repositório na Vercel
- [ ] Configurar build settings
- [ ] Testar deploy de preview
- [ ] Fazer deploy de produção
- [ ] Testar todas as funcionalidades
- [ ] Configurar domínio (opcional)
- [ ] Configurar monitoramento
