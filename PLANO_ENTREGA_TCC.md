# 🚀 PLANO DE ENTREGA TCC - UNISAFE

**Prazo Final:** Quinta-feira, 23/10/2025 às 22h30  
**Tempo Disponível:** ~3 dias  
**Objetivo:** Sistema 100% funcional e estável

---

## ⚡ PRIORIDADE CRÍTICA - EXECUTAR HOJE (20/10)

### 1. Corrigir N+1 Queries (URGENTE - 2h)
**Arquivo:** `backend/routes/postagens.js`

**Problema:** 61 queries para carregar 20 postagens (lentidão crítica)

**Solução:**
```javascript
// SUBSTITUIR a rota GET /api/postagens por:
router.get('/', async (req, res) => {
  const { limite = 20, pagina = 1 } = req.query;
  const offset = (pagina - 1) * limite;
  
  // Pega ID do usuário autenticado (se houver)
  const token = req.headers.authorization?.replace('Bearer ', '');
  let usuarioLogadoId = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      usuarioLogadoId = decoded.id;
    } catch (err) {}
  }

  // QUERY OTIMIZADA - 1 única query
  const postagens = await db.query(`
    SELECT 
      p.id,
      p.titulo,
      p.conteudo,
      p.categoria as tipo,
      p.localizacao,
      p.criado_em,
      u.nome as usuario_nome,
      COUNT(DISTINCT cur.id) as total_curtidas,
      COUNT(DISTINCT com.id) as total_comentarios,
      MAX(CASE WHEN cur.usuario_id = ? THEN 1 ELSE 0 END) as usuario_curtiu
    FROM postagens p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    LEFT JOIN curtidas cur ON p.id = cur.postagem_id
    LEFT JOIN comentarios com ON p.id = com.postagem_id AND com.ativo = 1
    WHERE p.ativo = 1
    GROUP BY p.id
    ORDER BY p.criado_em DESC
    LIMIT ? OFFSET ?
  `, [usuarioLogadoId || 0, limite, offset]);

  const postagensFormatadas = postagens.map(p => ({
    id: p.id,
    titulo: p.titulo,
    conteudo: p.conteudo,
    tipo: p.tipo,
    localizacao: p.localizacao,
    usuario: p.usuario_nome,
    data: formatarData(p.criado_em),
    curtidas: parseInt(p.total_curtidas) || 0,
    comentarios: parseInt(p.total_comentarios) || 0,
    usuarioCurtiu: Boolean(p.usuario_curtiu)
  }));

  res.json({ success: true, data: postagensFormatadas });
});
```

**Resultado:** 61 queries → 1 query (98% mais rápido)

---

### 2. Variabilizar URLs de Produção (CRÍTICO - 30min)

**Arquivos a modificar:**

#### `backend/.env` (adicionar):
```env
FRONTEND_URL=http://localhost:3000
```

#### `backend/config/env.js` (adicionar validação):
```javascript
FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
```

#### `backend/routes/authGoogle.js` (linha ~41):
```javascript
// ANTES:
res.redirect(`http://localhost:3000/login/success?token=${token}`);

// DEPOIS:
const { FRONTEND_URL } = require('../config/env');
res.redirect(`${FRONTEND_URL}/login/success?token=${token}`);
```

**Resultado:** Deploy em produção funcionará automaticamente

---

### 3. Adicionar Cleanup Socket.IO (ESSENCIAL - 1h)

**Arquivo:** `frontend/pages/feed.js`

**Localizar useEffect do Socket (linha ~74) e ADICIONAR return:**
```javascript
useEffect(() => {
  const token = localStorage.getItem('unisafe_token');
  if (!token) return;

  const socket = io(API_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socketRef.current = socket;

  // ... todos os event listeners existentes ...

  // ✅ ADICIONAR CLEANUP:
  return () => {
    console.log('[SOCKET] 🧹 Limpando listeners...');
    socket.off('connected');
    socket.off('nova_postagem');
    socket.off('nova_curtida');
    socket.off('novo_comentario');
    socket.off('nova_notificacao');
    socket.off('total_nao_lidas');
    socket.off('lista_notificacoes');
    socket.disconnect();
  };
}, []); // ⚠️ Dependências vazias = executa 1x ao montar
```

**Resultado:** Sem memory leaks, conexões duplicadas ou crashes

---

### 4. Validar .env Files (OBRIGATÓRIO - 15min)

**Checklist:**

- [ ] `backend/.env` existe e contém:
  - DATABASE_URL (Railway)
  - JWT_SECRET
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - GOOGLE_CALLBACK_URL
  - FRONTEND_URL
  - PORT=5000

- [ ] `frontend/.env.local` existe e contém:
  - NEXT_PUBLIC_API_URL=http://localhost:5000

**Se produção:**
```env
# backend/.env
FRONTEND_URL=https://unisafe.vercel.app
GOOGLE_CALLBACK_URL=https://unisafe-api.railway.app/api/auth/google/callback

# frontend/.env.local
NEXT_PUBLIC_API_URL=https://unisafe-api.railway.app
```

---

## 🟡 PRIORIDADE ALTA - AMANHÃ (21/10)

### 5. Testar Fluxos Críticos (ESSENCIAL - 3h)

**Criar:** `CHECKLIST_TESTES.md`

#### ✅ Login/Cadastro
- [ ] Cadastro com email/senha válidos
- [ ] Login com credenciais corretas
- [ ] Login com credenciais incorretas (mensagem de erro)
- [ ] Cadastro com email duplicado (erro)
- [ ] Rate limiter bloqueia após 5 tentativas

#### ✅ Google OAuth
- [ ] Botão "Continuar com Google" redireciona
- [ ] Login Google funciona (usuário novo)
- [ ] Login Google funciona (usuário existente)
- [ ] Token salvo no localStorage
- [ ] Foto do Google aparece no perfil
- [ ] Redirect para /feed após login

#### ✅ Feed
- [ ] Postagens carregam (máx 3 segundos)
- [ ] Criar nova postagem aparece no topo
- [ ] Curtir/descurtir atualiza contador
- [ ] Comentar funciona
- [ ] Socket.IO recebe eventos em tempo real
- [ ] Notificações aparecem (sino)

#### ✅ Perfil
- [ ] Dados do usuário carregam
- [ ] Editar nome/bio salva
- [ ] Máscara de telefone funciona: `(11) 99999-9999`
- [ ] Foto do Google (OAuth) ou avatar_url (tradicional)

---

### 6. Corrigir Bugs Conhecidos (2h)

**Checklist de Correções:**

- [ ] Verificar se `usuario_curtiu` retorna `true`/`false` corretamente
- [ ] Testar logout (limpa localStorage e redireciona)
- [ ] Validar formato de datas (não mostrar "Invalid Date")
- [ ] Comentários aparecem na ordem correta (mais recentes primeiro)
- [ ] Notificações marcam como lidas ao clicar

---

### 7. Adicionar Tratamento de Erros (1h)

**Backend - Adicionar try/catch em rotas críticas:**

```javascript
// Exemplo: backend/routes/postagens.js
router.post('/', verificarAuth, async (req, res) => {
  try {
    // ... código existente ...
  } catch (error) {
    logger.error('Erro ao criar postagem', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erro ao criar postagem. Tente novamente.'
    });
  }
});
```

**Frontend - Mostrar mensagens de erro ao usuário:**

```javascript
// Exemplo: feed.js
const criarPostagem = async () => {
  try {
    // ... código existente ...
  } catch (error) {
    setError('Erro ao criar postagem. Verifique sua conexão.');
    console.error(error);
  }
};
```

---

## 🟢 PRIORIDADE MÉDIA - TERÇA (22/10)

### 8. Testes de Stress (2h)

**Simular Uso Real:**

- [ ] Abrir 3 abas do navegador (usuários diferentes)
- [ ] Criar 10 postagens rapidamente
- [ ] Curtir/comentar em todas
- [ ] Verificar se notificações chegam para todos
- [ ] Testar com conexão lenta (DevTools → Network → Slow 3G)
- [ ] Verificar logs de erro (`backend/logs/error.log`)

---

### 9. Otimizar Frontend (1h)

**Melhorias Rápidas:**

```javascript
// frontend/pages/feed.js - Adicionar loading states
{loading && <p>Carregando postagens...</p>}
{error && <p className="text-red-500">{error}</p>}
{!loading && postagens.length === 0 && <p>Nenhuma postagem ainda.</p>}
```

**Otimizar imagens:**
```javascript
// Substituir <img> por <Image> do Next.js
import Image from 'next/image';

<Image 
  src={usuario.foto_perfil || '/avatar-default.png'} 
  width={40} 
  height={40} 
  alt={usuario.nome}
/>
```

---

### 10. Documentação de Deploy (1h)

**Criar:** `DEPLOY.md`

```markdown
# Deploy UniSafe

## Backend (Railway)
1. Conectar repositório GitHub
2. Configurar variáveis:
   - DATABASE_URL (auto-gerado)
   - JWT_SECRET
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - GOOGLE_CALLBACK_URL=https://[seu-app].railway.app/api/auth/google/callback
   - FRONTEND_URL=https://[seu-app].vercel.app
3. Deploy automático ao push main

## Frontend (Vercel)
1. Importar repositório
2. Configurar:
   - NEXT_PUBLIC_API_URL=https://[backend].railway.app
3. Deploy automático

## Google Cloud Console
1. Adicionar URLs autorizadas:
   - https://[backend].railway.app/api/auth/google/callback
   - https://[frontend].vercel.app/login/success
```

---

## ⚪ OPCIONAL - QUARTA (23/10) - SE HOUVER TEMPO

### 11. Melhorias de UX (Não Crítico)
- [ ] Scroll infinito no feed (lazy loading)
- [ ] Animações CSS (Tailwind transitions)
- [ ] Toast notifications (em vez de alerts)
- [ ] Skeleton loaders

### 12. Segurança Extra (Não Crítico)
- [ ] CSRF tokens
- [ ] Refresh tokens JWT
- [ ] Sanitização de HTML (DOMPurify)

---

## 📋 CHECKLIST FINAL - QUINTA (23/10) MANHÃ

### Pré-Entrega (até 14h)

- [ ] **Backend rodando:** `cd backend && npm start`
- [ ] **Frontend rodando:** `cd frontend && npm run dev`
- [ ] **Banco de dados:** Conexão estável com Railway
- [ ] **Socket.IO:** Notificações em tempo real funcionando
- [ ] **Google OAuth:** Login funcional
- [ ] **Logs limpos:** Sem erros no console/terminal

### Testes de Aceitação (14h-18h)

- [ ] Login tradicional: ✅
- [ ] Login Google: ✅
- [ ] Criar postagem: ✅
- [ ] Curtir: ✅
- [ ] Comentar: ✅
- [ ] Notificações: ✅
- [ ] Perfil: ✅
- [ ] Logout: ✅

### Deploy em Produção (18h-20h)

- [ ] Backend no Railway: ✅
- [ ] Frontend no Vercel: ✅
- [ ] URLs de produção testadas: ✅
- [ ] Google OAuth em produção: ✅

### Backup de Segurança (20h-21h)

```bash
# Backup do banco
mysqldump -u user -p database > backup_23-10-2025.sql

# Commit final
git add .
git commit -m "feat: Versão final TCC - Sistema completo funcional"
git push origin main
```

---

## ❌ NÃO FAZER (Risco de quebrar)

- ❌ Refatorar arquitetura (ex: separar controllers)
- ❌ Migrar para TypeScript
- ❌ Adicionar novas features
- ❌ Mudar versões de dependências (npm update all)
- ❌ Alterar schema do banco (migrations)
- ❌ Reescrever lógica do Socket.IO

---

## 🎯 RESULTADO ESPERADO

**Sistema Funcional:**
- ✅ Login/Cadastro tradicional
- ✅ Login via Google OAuth
- ✅ Feed de postagens (rápido)
- ✅ Curtidas e comentários
- ✅ Notificações em tempo real
- ✅ Perfil do usuário
- ✅ Deploy em produção

**Performance:**
- ✅ Feed carrega em < 3 segundos
- ✅ Sem memory leaks
- ✅ Socket.IO estável

**Documentação:**
- ✅ README.md atualizado
- ✅ DEPLOY.md com instruções
- ✅ .env.example preenchidos

---

## 📞 SUPORTE DE EMERGÊNCIA

**Se algo quebrar:**

1. **Erro no banco:** Verificar `backend/logs/error.log`
2. **Socket não conecta:** Verificar CORS no `server.js`
3. **OAuth falha:** Verificar URLs no Google Cloud Console
4. **Deploy quebrou:** Rollback para commit anterior

```bash
# Rollback de emergência
git log --oneline  # Ver commits
git reset --hard <hash-commit-anterior>
git push -f origin main
```

---

**Foco:** Funcionalidade > Perfeição  
**Lema:** "Feito é melhor que perfeito"  
**Meta:** Entregar na quinta, 22h30 ✅

---

**Última atualização:** 20/10/2025  
**Status:** Pronto para execução
