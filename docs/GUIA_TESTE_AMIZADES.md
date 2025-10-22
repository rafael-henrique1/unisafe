# 🧪 GUIA DE TESTE - SISTEMA DE AMIZADES COMPLETO

## 🚀 Preparação para Testes

### 1. Certifique-se de que os servidores estão rodando:

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

## ✅ ROTEIRO DE TESTES

### **Teste 1: Adicionar Amigo**

**Objetivo:** Verificar se o botão "Adicionar Amigo" aparece e funciona

**Passos:**
1. Faça login no sistema (Ex: usuário `joao@gmail.com`)
2. Acesse o feed (`/feed`)
3. Clique no nome de outro usuário em uma postagem
4. Você será redirecionado para `/usuario/@username`
5. **Verifique:** Deve aparecer um botão azul "Adicionar Amigo" (com ícone de usuário +)
6. Clique no botão
7. **Resultado esperado:**
   - Mensagem verde: "Solicitação de amizade enviada!"
   - Botão muda para "Solicitação Enviada" (cinza, desabilitado)

---

### **Teste 2: Aceitar Solicitação**

**Objetivo:** Verificar se consegue aceitar solicitação de amizade

**Passos:**
1. Faça logout do usuário atual
2. Faça login com o usuário que recebeu a solicitação (Ex: `maria@gmail.com`)
3. Vá para **Perfil** → Aba **Solicitações**
4. Deve aparecer a solicitação de João
5. Clique em **"Aceitar"**
6. **Resultado esperado:**
   - Mensagem verde: "Amizade aceita!"
   - João aparece na aba "Amigos"

**Teste Alternativo (via perfil público):**
1. Ainda logado como Maria
2. Acesse `/usuario/@joao` (ou clique no nome dele)
3. **Verifique:** Deve aparecer botão verde "Aceitar Solicitação"
4. Clique no botão
5. **Resultado esperado:**
   - Mensagem verde: "Amizade aceita!"
   - Botão muda para "Remover Amigo" (vermelho)

---

### **Teste 3: Verificar Estatísticas de Amigos**

**Objetivo:** Verificar se o contador de amigos funciona

**Passos:**
1. Acesse o perfil público de João: `/usuario/@joao`
2. **Verifique:** Deve exibir:
   ```
   Postagens    Amigos    Comentários
       X          1           X
   ```
3. A coluna "Amigos" deve mostrar **1** (Maria)

---

### **Teste 4: Remover Amizade**

**Objetivo:** Verificar se consegue remover um amigo

**Passos:**
1. Logado como Maria
2. Acesse `/usuario/@joao`
3. **Verifique:** Deve aparecer botão vermelho "Remover Amigo"
4. Clique no botão
5. Aparece confirmação: "Tem certeza que deseja remover João Silva dos seus amigos?"
6. Clique em **"OK"**
7. **Resultado esperado:**
   - Mensagem verde: "Amizade removida"
   - Botão volta para "Adicionar Amigo" (azul)
   - Contador de amigos de João volta para **0**

---

### **Teste 5: Próprio Perfil**

**Objetivo:** Verificar comportamento ao acessar próprio perfil

**Passos:**
1. Logado como João
2. Acesse seu próprio perfil: `/usuario/@joao`
3. **Verifique:** Deve aparecer botão cinza "Editar Meu Perfil"
4. Clique no botão
5. **Resultado esperado:**
   - Redireciona para `/perfil` (página de edição)

---

### **Teste 6: Usuário Não Logado**

**Objetivo:** Verificar comportamento sem autenticação

**Passos:**
1. Faça logout
2. Acesse qualquer perfil público (Ex: `/usuario/@joao`)
3. **Verifique:** Deve aparecer botão azul "Fazer Login para Adicionar"
4. Clique no botão
5. **Resultado esperado:**
   - Redireciona para `/login`

---

### **Teste 7: Solicitação Pendente (Enviada por Você)**

**Objetivo:** Verificar que não pode reenviar solicitação

**Passos:**
1. Logado como João
2. Acesse perfil de Maria: `/usuario/@maria`
3. Envie solicitação de amizade
4. Recarregue a página
5. **Verifique:** Deve aparecer "Solicitação Enviada" (desabilitado)
6. Não deve permitir clicar novamente

---

### **Teste 8: Notificações em Tempo Real (Socket.IO)**

**Objetivo:** Verificar se notificações chegam instantaneamente

**Passos:**
1. Abra **2 abas** do navegador
2. **Aba 1:** Login como João
3. **Aba 2:** Login como Maria
4. **Aba 1 (João):** Acesse `/usuario/@maria` e envie solicitação
5. **Aba 2 (Maria):** Vá para **Perfil** → Aba **Solicitações**
6. **Resultado esperado:**
   - Na Aba 2 (Maria), deve aparecer **mensagem em tempo real** (sem recarregar):
     ```
     "João Silva enviou uma solicitação de amizade!"
     ```
7. **Aba 2 (Maria):** Aceite a solicitação
8. **Aba 1 (João):** Deve receber notificação:
   ```
   "Maria Santos aceitou sua solicitação de amizade!"
   ```

---

### **Teste 9: Múltiplos Amigos**

**Objetivo:** Verificar contagem correta com vários amigos

**Passos:**
1. Crie 3 usuários (ou use existentes)
2. Faça amizade entre todos
3. Acesse o perfil de cada um
4. **Verifique:** Contador de amigos deve estar correto:
   - Se A é amigo de B e C → Contador = **2**

---

### **Teste 10: Reenvio de Solicitação Recusada**

**Objetivo:** Verificar que pode reenviar após recusa

**Passos:**
1. João envia solicitação para Maria
2. Maria recusa (via `/perfil` → Aba Solicitações → Recusar)
3. João acessa `/usuario/@maria` novamente
4. **Verifique:** Deve aparecer "Adicionar Amigo" novamente (pode reenviar)
5. João envia novamente
6. **Resultado esperado:**
   - Nova solicitação é criada com status `pendente`

---

## 📊 CHECKLIST DE VERIFICAÇÃO

- [ ] Botão "Adicionar Amigo" aparece no perfil público
- [ ] Botão muda para "Solicitação Enviada" após enviar
- [ ] Botão "Aceitar Solicitação" aparece quando há pedido recebido
- [ ] Botão "Remover Amigo" aparece quando são amigos
- [ ] Botão "Editar Meu Perfil" aparece no próprio perfil
- [ ] Botão "Fazer Login" aparece quando não está autenticado
- [ ] Mensagens de sucesso aparecem (verde)
- [ ] Mensagens de erro aparecem (vermelho)
- [ ] Mensagens desaparecem após 4 segundos
- [ ] Confirmação antes de remover amigo
- [ ] Contador de amigos atualiza corretamente
- [ ] Notificações Socket.IO funcionam em tempo real
- [ ] Aba "Amigos" em `/perfil` lista corretamente
- [ ] Aba "Solicitações" em `/perfil` lista corretamente
- [ ] Loading states aparecem nos botões

---

## 🐛 POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema: Botão não aparece
**Solução:** Verifique se está acessando via `/usuario/@username` (com @)

### Problema: Erro 401 ao adicionar amigo
**Solução:** Verifique se está logado e o token JWT está válido

### Problema: Notificações não chegam
**Solução:** Verifique se Socket.IO está conectado (console do navegador)

### Problema: Contador de amigos sempre 0
**Solução:** Verifique se a query SQL foi atualizada no backend

---

## ✅ TESTE COMPLETO

Execute todos os 10 testes acima e marque o checklist. Se tudo passar, o sistema de amizades está **100% funcional**! 🎉

---

**Última atualização:** 22/10/2025
