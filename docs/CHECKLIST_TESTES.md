# ✅ CHECKLIST DE TESTES - UNISAFE

**Data:** 21/10/2025  
**Objetivo:** Validar todos os fluxos críticos antes da entrega  
**Prazo:** 23/10/2025 às 22h30

---

## 🔐 AUTENTICAÇÃO

### Login Tradicional
- [ ] **Cadastro com email/senha válidos**
  - Testar: Email novo + senha forte (min 6 caracteres)
  - Esperado: Conta criada, redirecionamento para /login
  - Status: ⬜ PENDENTE

- [ ] **Login com credenciais corretas**
  - Testar: Email existente + senha correta
  - Esperado: Token salvo no localStorage, redirecionamento para /feed
  - Status: ⬜ PENDENTE

- [ ] **Login com credenciais incorretas**
  - Testar: Email correto + senha errada
  - Esperado: Mensagem de erro "Credenciais inválidas"
  - Status: ⬜ PENDENTE

- [ ] **Cadastro com email duplicado**
  - Testar: Email já existente no banco
  - Esperado: Erro "Email já cadastrado"
  - Status: ⬜ PENDENTE

- [ ] **Rate limiter bloqueia após 5 tentativas**
  - Testar: 6 tentativas de login em sequência
  - Esperado: Mensagem "Muitas tentativas, tente novamente em 15 minutos"
  - Status: ⬜ PENDENTE

### Login Google OAuth
- [ ] **Botão "Continuar com Google" redireciona**
  - Testar: Clicar no botão de OAuth
  - Esperado: Redireciona para tela de login do Google
  - Status: ⬜ PENDENTE

- [ ] **Login Google funciona (usuário novo)**
  - Testar: Conta Google nunca usada no UniSafe
  - Esperado: Conta criada automaticamente, token salvo, redirect /feed
  - Status: ⬜ PENDENTE

- [ ] **Login Google funciona (usuário existente)**
  - Testar: Conta Google já cadastrada
  - Esperado: Login direto, token salvo, redirect /feed
  - Status: ⬜ PENDENTE

- [ ] **Token salvo no localStorage**
  - Verificar: `localStorage.getItem('unisafe_token')`
  - Esperado: JWT válido
  - Status: ⬜ PENDENTE

- [ ] **Foto do Google aparece no perfil**
  - Verificar: Avatar no header do feed
  - Esperado: Imagem do Google Profile
  - Status: ⬜ PENDENTE

---

## 📰 FEED DE POSTAGENS

### Carregamento
- [ ] **Postagens carregam rapidamente**
  - Testar: Acessar /feed
  - Esperado: Lista carrega em < 3 segundos
  - Métrica: Verificar Network tab do DevTools
  - Status: ⬜ PENDENTE

- [ ] **Query otimizada (1 query única)**
  - Verificar: Console do backend
  - Esperado: Log "[LISTAR POSTAGENS] ✅ Executando query OTIMIZADA"
  - Status: ⬜ PENDENTE

### Criar Postagem
- [ ] **Nova postagem aparece no topo**
  - Testar: Criar postagem com tipo "alerta"
  - Esperado: Postagem aparece imediatamente no topo do feed
  - Status: ⬜ PENDENTE

- [ ] **Socket.IO emite evento broadcast**
  - Verificar: Console do frontend
  - Esperado: Log "[SOCKET] 📢 Nova postagem recebida"
  - Status: ⬜ PENDENTE

### Curtir/Descurtir
- [ ] **Curtir atualiza contador**
  - Testar: Clicar no botão de curtir
  - Esperado: Contador incrementa de 0 → 1
  - Status: ⬜ PENDENTE

- [ ] **Descurtir atualiza contador**
  - Testar: Clicar novamente (já curtido)
  - Esperado: Contador decrementa de 1 → 0
  - Status: ⬜ PENDENTE

- [ ] **Ícone muda de estado**
  - Testar: Curtir/descurtir
  - Esperado: Coração vazio ↔ Coração preenchido
  - Status: ⬜ PENDENTE

### Comentários
- [ ] **Comentar funciona**
  - Testar: Adicionar comentário em uma postagem
  - Esperado: Comentário aparece na lista, contador incrementa
  - Status: ⬜ PENDENTE

- [ ] **Lista de comentários carrega**
  - Testar: Expandir seção de comentários
  - Esperado: Lista ordenada (mais recentes primeiro)
  - Status: ⬜ PENDENTE

- [ ] **Deletar comentário próprio**
  - Testar: Clicar em "Deletar" no seu comentário
  - Esperado: Comentário removido, contador decrementa
  - Status: ⬜ PENDENTE

---

## 🔔 NOTIFICAÇÕES (TEMPO REAL)

### Socket.IO
- [ ] **Conexão Socket.IO estabelecida**
  - Verificar: Console do frontend
  - Esperado: Log "[SOCKET] ✅ CONECTADO"
  - Status: ⬜ PENDENTE

- [ ] **Notificação de curtida**
  - Testar: Usuário B curte postagem do usuário A
  - Esperado: Usuário A recebe notificação "❤️ [Nome] curtiu sua postagem"
  - Status: ⬜ PENDENTE

- [ ] **Notificação de comentário**
  - Testar: Usuário B comenta na postagem do usuário A
  - Esperado: Usuário A recebe notificação "💬 [Nome] comentou na sua postagem"
  - Status: ⬜ PENDENTE

- [ ] **Contador de não lidas**
  - Verificar: Badge no sino (header)
  - Esperado: Número de notificações não lidas
  - Status: ⬜ PENDENTE

- [ ] **Marcar como lida**
  - Testar: Clicar em uma notificação
  - Esperado: Badge decrementa, notificação fica cinza
  - Status: ⬜ PENDENTE

- [ ] **Marcar todas como lidas**
  - Testar: Botão "Marcar todas como lidas"
  - Esperado: Badge zera, todas ficam cinzas
  - Status: ⬜ PENDENTE

---

## 👤 PERFIL DO USUÁRIO

### Visualização
- [ ] **Dados do usuário carregam**
  - Testar: Acessar /perfil
  - Esperado: Nome, email, bio, telefone, avatar
  - Status: ⬜ PENDENTE

- [ ] **Avatar correto (OAuth vs Tradicional)**
  - Google: `foto_perfil` do Google
  - Tradicional: `avatar_url` ou avatar padrão
  - Status: ⬜ PENDENTE

### Edição
- [ ] **Editar nome/bio salva**
  - Testar: Alterar nome e bio, clicar em "Salvar"
  - Esperado: Mensagem de sucesso, dados atualizados
  - Status: ⬜ PENDENTE

- [ ] **Máscara de telefone funciona**
  - Testar: Digitar `11999999999`
  - Esperado: Formatação automática `(11) 99999-9999`
  - Status: ⬜ PENDENTE

---

## 🚪 LOGOUT

- [ ] **Logout limpa localStorage**
  - Testar: Clicar em "Sair"
  - Verificar: `localStorage.getItem('unisafe_token')` → null
  - Status: ⬜ PENDENTE

- [ ] **Redireciona para login**
  - Esperado: Redirect para `/login`
  - Status: ⬜ PENDENTE

- [ ] **Socket.IO desconecta**
  - Verificar: Console do backend
  - Esperado: Log de desconexão do socket
  - Status: ⬜ PENDENTE

---

## 🐛 BUGS CONHECIDOS A VERIFICAR

- [ ] **Formato de datas**
  - Verificar: Nenhuma data mostra "Invalid Date"
  - Esperado: "Agora mesmo", "2 minutos atrás", etc.
  - Status: ⬜ PENDENTE

- [ ] **Comentários ordenados**
  - Verificar: Ordem cronológica correta
  - Esperado: Mais recentes primeiro
  - Status: ⬜ PENDENTE

- [ ] **Duplicação de postagens**
  - Testar: Criar postagem, verificar se não duplica no feed
  - Esperado: Aparece apenas 1 vez
  - Status: ⬜ PENDENTE

---

## 🧪 TESTES DE STRESS

### Performance
- [ ] **Múltiplas abas (3 usuários simultâneos)**
  - Testar: Abrir 3 abas com contas diferentes
  - Criar 5 postagens em cada
  - Esperado: Todas as abas recebem eventos em tempo real
  - Status: ⬜ PENDENTE

- [ ] **Conexão lenta (Slow 3G)**
  - DevTools → Network → Slow 3G
  - Testar: Carregar feed
  - Esperado: Loading states corretos, sem crashes
  - Status: ⬜ PENDENTE

- [ ] **10 postagens rápidas**
  - Testar: Criar 10 postagens em < 30 segundos
  - Esperado: Todas aparecem, sem travamentos
  - Status: ⬜ PENDENTE

### Logs de Erro
- [ ] **Backend sem erros críticos**
  - Verificar: `backend/logs/error.log`
  - Esperado: Arquivo vazio ou apenas warnings
  - Status: ⬜ PENDENTE

- [ ] **Console frontend limpo**
  - Verificar: Console do navegador
  - Esperado: Sem erros vermelhos
  - Status: ⬜ PENDENTE

---

## 📊 RESUMO DE EXECUÇÃO

**Total de Testes:** 45  
**Executados:** 0  
**Aprovados:** 0  
**Reprovados:** 0  
**Pendentes:** 45

### Critério de Aprovação
- ✅ **Mínimo 40/45 testes aprovados** (90%)
- 🟡 **35-39 aprovados:** Revisar itens reprovados
- ❌ **< 35 aprovados:** Sistema não está pronto para entrega

---

## 🎯 AÇÕES PÓS-TESTES

Se teste **FALHOU**:
1. Anotar erro detalhado
2. Verificar logs (backend/logs/error.log)
3. Corrigir bug
4. Re-testar

Se teste **PASSOU**:
1. Marcar como ✅ APROVADO
2. Atualizar contador de resumo
3. Prosseguir para próximo teste

---

**Última atualização:** 21/10/2025  
**Responsável:** Rafael Henrique  
**Status Geral:** 🟡 EM ANDAMENTO
