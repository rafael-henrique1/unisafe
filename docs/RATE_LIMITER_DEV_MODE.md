# 🎯 RATE LIMITER AJUSTADO PARA DESENVOLVIMENTO

## ✅ O QUE FOI ALTERADO

O arquivo `backend/middlewares/rateLimiter.js` foi modificado para detectar automaticamente o ambiente e aplicar limites diferentes:

### 📊 **LIMITES EM DESENVOLVIMENTO (NODE_ENV !== 'production')**

| Rota | Tentativas | Janela de Tempo |
|------|-----------|-----------------|
| **Login** | 50 | 1 minuto |
| **Cadastro** | 20 | 1 minuto |
| **API Geral** | 1000 | 1 minuto |

### 🔒 **LIMITES EM PRODUÇÃO (NODE_ENV = 'production')**

| Rota | Tentativas | Janela de Tempo |
|------|-----------|-----------------|
| **Login** | 5 | 15 minutos |
| **Cadastro** | 3 | 1 hora |
| **API Geral** | 100 | 15 minutos |

---

## 🚀 COMO FUNCIONA

O middleware detecta automaticamente o ambiente através da variável `process.env.NODE_ENV`:

```javascript
const isDevelopment = process.env.NODE_ENV !== 'production'
```

### **No seu caso (desenvolvimento local):**
- ✅ NODE_ENV não está definido ou está como "development"
- ✅ Limites MUITO GENEROSOS aplicados
- ✅ Mensagens incluem "[MODO DEV]"
- ✅ Você pode testar livremente sem bloqueios

### **Em produção (Vercel/Railway):**
- 🔒 NODE_ENV será "production"
- 🔒 Limites RESTRITOS aplicados
- 🔒 Proteção real contra ataques

---

## 🧪 TESTANDO OS LIMITES

### **Para testar se o rate limit funciona:**

1. **Login (50 tentativas por minuto):**
   ```bash
   # Execute 51 vezes rapidamente
   for i in {1..51}; do
     curl -X POST http://localhost:5000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com","senha":"123"}' \
       -w "\n"
   done
   ```
   A 51ª tentativa deve retornar erro 429.

2. **No navegador:**
   - Tente fazer login/cadastro normalmente
   - Você pode fazer até 50 logins por minuto
   - Se atingir o limite, aguarde 1 minuto

---

## ⚠️ SEGURANÇA

### **Por que isso é seguro?**

1. ✅ **Ambiente automático:** Não depende de configuração manual
2. ✅ **Produção protegida:** Limites restritos quando NODE_ENV=production
3. ✅ **Desenvolvimento facilitado:** Testes sem bloqueios irritantes
4. ✅ **Logs identificados:** Mostra claramente [DEV] ou [PROD] nos logs

### **Quando vai para produção:**

No Vercel/Railway, a variável `NODE_ENV` é automaticamente definida como `production`, então os limites restritos serão aplicados SEM necessidade de alterar código.

---

## 📝 LOGS QUE VOCÊ VERÁ

### **Ao iniciar o servidor em DEV:**
```
╔══════════════════════════════════════════════════════════╗
║  ⚠️  RATE LIMITER EM MODO DESENVOLVIMENTO               ║
║                                                          ║
║  Limites MUITO GENEROSOS para facilitar testes:         ║
║  • Login: 50 tentativas/minuto                           ║
║  • Cadastro: 20 tentativas/minuto                        ║
║  • API Geral: 1000 requisições/minuto                    ║
║                                                          ║
║  ⚠️  NÃO USE EM PRODUÇÃO! Configure NODE_ENV=production ║
╚══════════════════════════════════════════════════════════╝
```

### **Se atingir o limite:**
```
[RATE LIMIT] [DEV] ⚠️ IP bloqueado por excesso de tentativas: ::1
```

### **Em produção:**
```
[RATE LIMIT] [PROD] ⚠️ IP bloqueado por excesso de tentativas: 192.168.1.100
```

---

## 🔄 REINICIE O SERVIDOR

Se o nodemon não reiniciou automaticamente, execute:

```bash
cd backend
npm run dev
```

Você verá a mensagem de "MODO DESENVOLVIMENTO" no console.

---

## 🎉 RESULTADO

Agora você pode:
- ✅ Fazer 50 logins por minuto (antes eram 5 a cada 15 minutos)
- ✅ Criar 20 contas por minuto (antes eram 3 por hora)
- ✅ Fazer 1000 requisições por minuto (antes eram 100 a cada 15 minutos)

**Teste à vontade sem preocupação com bloqueios!** 🚀

---

## 🔒 ATIVAR LIMITES DE PRODUÇÃO MANUALMENTE

Se você quiser testar os limites restritos de produção localmente, existem 3 formas:

### **Opção 1: Variável de Ambiente no Terminal (Temporário)**

**Windows (PowerShell):**
```powershell
$env:NODE_ENV="production"
cd backend
npm run dev
```

**Windows (CMD):**
```cmd
set NODE_ENV=production
cd backend
npm run dev
```

**Linux/Mac:**
```bash
NODE_ENV=production npm run dev
```

### **Opção 2: Arquivo .env (Permanente para testes)**

Adicione no arquivo `backend/.env`:
```env
NODE_ENV=production
```

Depois reinicie o servidor:
```bash
cd backend
npm run dev
```

**⚠️ IMPORTANTE:** Remova essa linha do `.env` quando voltar a desenvolver!

### **Opção 3: Script no package.json (Recomendado)**

Adicione um script no `backend/package.json`:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "dev:prod": "NODE_ENV=production nodemon server.js",
    "test": "jest --coverage"
  }
}
```

Agora você pode rodar:
```bash
npm run dev        # Modo desenvolvimento (limites generosos)
npm run dev:prod   # Simula produção (limites restritos)
```

### **Como saber qual modo está ativo?**

- **Modo DEV:** Você verá o banner com "⚠️ RATE LIMITER EM MODO DESENVOLVIMENTO"
- **Modo PROD:** O banner NÃO aparece e os limites são restritos

### **Voltar para modo desenvolvimento:**

1. Feche o servidor (Ctrl+C)
2. Remova a variável `NODE_ENV` do `.env` (se adicionou)
3. Reinicie: `npm run dev`

---

## 📌 DEPLOY EM PRODUÇÃO

**No Vercel ou Railway, você NÃO precisa fazer nada!**

Essas plataformas automaticamente definem `NODE_ENV=production`, então:
- ✅ Os limites restritos serão aplicados automaticamente
- ✅ Sem necessidade de alterar código
- ✅ Segurança máxima garantida

---

**Arquivo gerado em:** 17/10/2025  
**Desenvolvedor:** GitHub Copilot
