# Relatório: Implementação de Redirecionamento de Notificações

**Data**: 14/10/2025  
**Projeto**: UniSafe - Plataforma de Segurança Comunitária  
**Tarefa**: Sistema de redirecionamento ao clicar em notificações

---

## 📋 Resumo Executivo

Implementado com sucesso o sistema de redirecionamento de notificações. Agora, quando um usuário clica em uma notificação de curtida ou comentário, ele é automaticamente redirecionado para a postagem correspondente, e a notificação é marcada como lida.

---

## 🎯 Objetivos Alcançados

✅ **Banco de Dados**: Adicionada coluna `postagem_id` na tabela `notificacoes`  
✅ **Backend API**: Criada rota PUT `/api/notificacoes/:id/lida` para marcar como lida e retornar `postagem_id`  
✅ **Socket.IO**: Atualizado para salvar `postagem_id` ao criar notificações  
✅ **Frontend**: Implementado onClick nas notificações com redirecionamento automático  
✅ **Página Individual**: Criada página `/postagem/[id]` para visualização de postagens  

---

## 📁 Arquivos Modificados

### Backend

#### 1. `backend/config/database.js`
**Alterações**:
- Adicionada coluna `postagem_id INT NULL` na criação da tabela `notificacoes`
- Adicionado `FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE`
- Implementada migração automática para bancos existentes usando `ALTER TABLE`

```sql
-- Nova coluna adicionada
postagem_id INT NULL,

-- Nova constraint
FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE
```

#### 2. `backend/config/socket.js`
**Alterações**:
- Atualizada função `emitirNovaCurtida()` para incluir `postagem_id` ao salvar notificação
- Atualizada função `emitirNovoComentario()` para incluir `postagem_id` ao salvar notificação
- Atualizada query em `solicitar_notificacoes` para retornar `postagem_id`

**Antes**:
```javascript
INSERT INTO notificacoes (usuario_id, remetente_id, tipo, mensagem)
VALUES (?, ?, 'curtida', ?)
```

**Depois**:
```javascript
INSERT INTO notificacoes (usuario_id, remetente_id, postagem_id, tipo, mensagem)
VALUES (?, ?, ?, 'curtida', ?)
```

#### 3. `backend/routes/notificacoes.js` (NOVO ARQUIVO)
**Funcionalidade**: Gerenciamento de notificações via API REST

**Rotas implementadas**:
- `GET /api/notificacoes` - Lista todas as notificações do usuário
- `PUT /api/notificacoes/:id/lida` - Marca notificação como lida e retorna `postagem_id`
- `PUT /api/notificacoes/marcar-todas-lidas` - Marca todas como lidas
- `GET /api/notificacoes/nao-lidas/total` - Retorna contagem de não lidas

**Exemplo de resposta**:
```json
{
  "success": true,
  "data": {
    "postagemId": 123,
    "tipo": "curtida"
  }
}
```

#### 4. `backend/server.js`
**Alterações**:
- Importado `notificacoesRoutes`
- Registrado rota `app.use('/api/notificacoes', notificacoesRoutes)`

### Frontend

#### 5. `frontend/config/api.js`
**Alterações**:
- Adicionado `base: API_URL` para facilitar construção de URLs
- Adicionado `notificacoes: ${API_URL}/api/notificacoes`

#### 6. `frontend/pages/feed.js`
**Alterações**:
- Modificada função `marcarComoLida()` para chamar API e redirecionar
- Removida lógica de Socket.IO `emit('marcar_lida')` (agora usa REST API)
- Implementado redirecionamento com `router.push(/postagem/${postagemId})`
- Atualizado onClick das notificações para sempre permitir clique (lidas e não lidas)

**Nova implementação**:
```javascript
const marcarComoLida = async (notificacaoId) => {
  const token = localStorage.getItem('unisafe_token')
  const notificacao = notificacoes.find(n => n.id === notificacaoId)
  
  // Se já lida e tem postagemId, apenas redireciona
  if (notificacao && notificacao.lida && notificacao.postagem_id) {
    router.push(`/postagem/${notificacao.postagem_id}`)
    return
  }
  
  // Caso contrário, marca como lida via API
  const response = await fetch(`${endpoints.base}/api/notificacoes/${notificacaoId}/lida`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    const data = await response.json()
    // Atualiza estado local
    setNotificacoes(prev => 
      prev.map(n => n.id === notificacaoId ? { ...n, lida: true } : n)
    )
    setNotificacoesNaoLidas(prev => Math.max(0, prev - 1))
    
    // Redireciona
    if (data.data && data.data.postagemId) {
      router.push(`/postagem/${data.data.postagemId}`)
    }
  }
}
```

#### 7. `frontend/pages/postagem/[id].js` (NOVO ARQUIVO)
**Funcionalidade**: Página de visualização individual de postagens

**Recursos implementados**:
- Exibição completa da postagem (título, conteúdo, autor, data, localização)
- Badge de categoria com cores dinâmicas
- Botão de curtir com contador
- Lista de comentários ordenada por data
- Formulário para adicionar novo comentário
- Navegação breadcrumb (voltar para feed)
- Design responsivo com Tailwind CSS
- Loading spinner durante carregamento
- Tratamento de erros (postagem não encontrada)

**Estrutura**:
```javascript
/postagem/[id]
├── Cabeçalho (categoria + título)
├── Informações do autor
├── Localização (opcional)
├── Conteúdo da postagem
├── Ações (curtir + comentários)
├── Formulário de novo comentário
└── Lista de comentários
```

---

## 🔄 Fluxo Completo

### 1. Criação da Notificação (Backend)
```
Usuário B curte postagem do Usuário A
   ↓
backend/routes/postagens.js → emitirNovaCurtida()
   ↓
backend/config/socket.js → INSERT INTO notificacoes
   ↓
INSERT ... VALUES (autorId, usuarioId, postagemId, 'curtida', mensagem)
   ↓
Socket.IO emite 'notificacao' para sala user_${autorId}
```

### 2. Recebimento no Frontend
```
Socket.IO listener 'notificacao'
   ↓
setNotificacoes(prev => [notificacao, ...prev])
   ↓
setNotificacoesNaoLidas(prev => prev + 1)
   ↓
Notificação aparece no painel com badge azul
```

### 3. Clique na Notificação
```
onClick={() => marcarComoLida(notif.id)}
   ↓
PUT /api/notificacoes/:id/lida
   ↓
Backend: UPDATE notificacoes SET lida = TRUE
   ↓
Backend: SELECT postagem_id FROM notificacoes
   ↓
Response: { success: true, data: { postagemId: 123 } }
   ↓
Frontend: router.push('/postagem/123')
   ↓
Página da postagem carrega com todos os detalhes
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `notificacoes`
```sql
CREATE TABLE notificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,              -- Quem recebe a notificação
  remetente_id INT NULL,                 -- Quem gerou a ação
  postagem_id INT NULL,                  -- ← NOVO: ID da postagem relacionada
  tipo ENUM('postagem', 'curtida', 'comentario', 'sistema') NOT NULL,
  mensagem VARCHAR(255) NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,  -- ← NOVO
  
  INDEX idx_usuario_lida (usuario_id, lida),
  INDEX idx_criada_em (criada_em)
)
```

---

## 🧪 Como Testar

### Teste 1: Curtida
1. **Usuário A**: Criar uma postagem
2. **Usuário B**: Curtir a postagem do Usuário A
3. **Usuário A**: Verificar notificação "Usuário B curtiu sua postagem"
4. **Usuário A**: Clicar na notificação
5. **Resultado esperado**: 
   - Notificação marcada como lida (fundo cinza)
   - Redirecionamento para `/postagem/[id]`
   - Visualização completa da postagem com comentários

### Teste 2: Comentário
1. **Usuário A**: Criar uma postagem
2. **Usuário B**: Comentar na postagem do Usuário A
3. **Usuário A**: Verificar notificação "Usuário B comentou em sua postagem"
4. **Usuário A**: Clicar na notificação
5. **Resultado esperado**:
   - Redirecionamento para a postagem
   - Comentário de Usuário B visível na lista

### Teste 3: Notificação Já Lida
1. Clicar em uma notificação já marcada como lida
2. **Resultado esperado**: Redirecionamento direto sem chamada à API

---

## 🔐 Segurança

- ✅ Todas as rotas de notificações protegidas com JWT
- ✅ Verificação de propriedade: usuário só pode marcar suas próprias notificações
- ✅ Validação de token em middleware `verificarAuth`
- ✅ Foreign keys garantem integridade referencial
- ✅ CASCADE DELETE evita notificações órfãs

---

## 📊 Melhorias Futuras (Opcional)

### Curto Prazo
- [ ] Loading spinner durante redirecionamento
- [ ] Toast notification ao marcar como lida
- [ ] Animação de transição ao clicar
- [ ] Badge com número de não lidas no ícone do sino

### Médio Prazo
- [ ] Filtro de notificações por tipo (curtidas, comentários, etc)
- [ ] Paginação de notificações (lazy loading)
- [ ] Notificações por email (opcional)
- [ ] Sons de notificação (opcional)

### Longo Prazo
- [ ] Push notifications (PWA)
- [ ] Configurações de notificações (quais tipos receber)
- [ ] Agrupamento de notificações similares
- [ ] Resumo diário de notificações

---

## ✅ Checklist de Validação

- [x] Coluna `postagem_id` criada no banco
- [x] Migration automática funcionando
- [x] Socket.IO salvando `postagem_id` corretamente
- [x] API `/notificacoes/:id/lida` retornando `postagemId`
- [x] Frontend redirecionando ao clicar
- [x] Página `/postagem/[id]` exibindo conteúdo completo
- [x] Notificações não lidas destacadas visualmente
- [x] Contador de não lidas decrementando corretamente
- [x] Backend rodando sem erros
- [x] Frontend sem warnings no console

---

## 📝 Notas Técnicas

### Decisões de Design

1. **REST API vs Socket.IO para marcar como lida**:
   - Escolhemos REST API para ter resposta síncrona com `postagem_id`
   - Socket.IO é usado apenas para notificações em tempo real
   - Mais simples de debugar e testar

2. **Página dedicada vs Modal**:
   - Criamos página dedicada `/postagem/[id]` para melhor UX
   - Permite compartilhar link direto da postagem
   - Facilita SEO e navegação com histórico do navegador

3. **Redirecionamento mesmo se já lida**:
   - Permite revisitar notificações antigas
   - Melhora usabilidade como "histórico de interações"

### Compatibilidade

- ✅ MySQL 5.7+
- ✅ Node.js 14+
- ✅ Next.js 14
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)

---

## 🐛 Troubleshooting

### Problema: "Cannot find module '../middleware/auth'"
**Solução**: Usar middleware inline `verificarAuth` em vez de arquivo separado

### Problema: Redirecionamento não funciona
**Verificar**:
1. `postagem_id` está sendo salvo no banco?
2. API está retornando `postagemId` na resposta?
3. `useRouter` foi importado do Next.js?

### Problema: Notificação não marca como lida
**Verificar**:
1. Token JWT está sendo enviado no header?
2. `usuario_id` da notificação corresponde ao usuário logado?
3. Verificar logs do backend para erros SQL

---

## 📚 Documentação de Referência

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Next.js Dynamic Routes](https://nextjs.org/docs/routing/dynamic-routes)
- [MySQL Foreign Keys](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html)
- [JWT Authentication](https://jwt.io/introduction)

---

## 👥 Créditos

**Desenvolvido por**: GitHub Copilot  
**Data**: 14/10/2025  
**Projeto**: UniSafe - Plataforma de Segurança Comunitária

---

**Status Final**: ✅ **IMPLEMENTAÇÃO COMPLETA E FUNCIONAL**
