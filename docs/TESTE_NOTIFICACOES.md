# 🔍 Teste de Notificações - Guia de Debug

## Passo 1: Verificar Console do Navegador

Abra o DevTools (F12) → Console e procure por:

### ✅ Mensagens esperadas ao carregar a página:
```
[SOCKET] 🔌 Iniciando conexão com http://localhost:5000
[SOCKET] ✅ CONECTADO: { userId: X, userName: "Seu Nome" }
[SOCKET] 📍 User ID: X
[SOCKET] 👤 Nome: Seu Nome
```

### ✅ Ao CURTIR uma postagem:
```
[CURTIR] Curtindo postagem: X
[CURTIR] Resposta do backend: { success: true, action: "added" }
[CURTIR] Atualizando postagem: { ...postagem com curtidas+1 }
```

### ✅ Ao COMENTAR:
```
[COMENTARIO] Enviando comentário para postagem: X
[COMENTARIO] Resposta do backend: { success: true, data: {...} }
[COMENTARIO] Comentário adicionado com sucesso
```

### ✅ Ao RECEBER notificação (Socket.IO):
```
[SOCKET] 🔔 NOTIFICAÇÃO RECEBIDA: { tipo: "curtida", mensagem: "...", postagemId: X }
```

## Passo 2: Verificar Terminal do Backend

No terminal onde o backend está rodando, procure por:

### ✅ Ao CURTIR:
```
[SOCKET] ❤️  NOVA CURTIDA
[SOCKET] Postagem ID: X
[SOCKET] Quem curtiu: Nome (ID: Y)
[SOCKET] Autor da postagem ID: Z
[SOCKET] ✅ Autor é diferente! Enviando notificação...
[SOCKET] 🔔 Notificação enviada para sala: user_Z
```

### ✅ Ao COMENTAR:
```
[SOCKET] 💬 NOVO COMENTÁRIO
[SOCKET] Postagem ID: X
[SOCKET] Quem comentou: Nome (ID: Y)
[SOCKET] Autor da postagem ID: Z
[SOCKET] ✅ Autor é diferente! Enviando notificação...
[SOCKET] 🔔 Notificação enviada para sala: user_Z
```

## Passo 3: Problemas Comuns

### ❌ Socket.IO não conecta
- Verificar se backend está rodando na porta 5000
- Verificar se frontend está usando http://localhost:5000
- Verificar token JWT no localStorage

### ❌ Curtidas/Comentários não atualizam
- Verificar se a resposta HTTP está OK (status 200)
- Verificar se setState está sendo chamado
- Recarregar página força atualização = problema de estado React

### ❌ Notificações não chegam
- Verificar se o autor da postagem é DIFERENTE de quem curtiu/comentou
- Verificar se o Socket.IO emitiu para a sala correta
- Verificar se o listener está ativo

## Passo 4: Teste Manual

1. **Abra 2 navegadores diferentes** (ou aba anônima)
2. **Navegador 1:** Login com Usuário A, crie uma postagem
3. **Navegador 2:** Login com Usuário B, vá no feed
4. **Navegador 2:** Curta a postagem do Usuário A
5. **Navegador 1:** DEVE aparecer notificação instantânea
6. **Navegador 2:** Comente na postagem
7. **Navegador 1:** DEVE aparecer nova notificação

## Resultado Esperado

- ✅ Notificação aparece INSTANTANEAMENTE no sino (badge com número)
- ✅ Curtidas/comentários atualizam SEM recarregar página
- ✅ Ao clicar na notificação, redireciona para a postagem

---

**Me informe:**
1. Quais mensagens aparecem no console do navegador?
2. Quais mensagens aparecem no terminal do backend?
3. O Socket.IO está conectado? (procure por "✅ CONECTADO")
