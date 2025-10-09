# 🔍 Guia de Migração e Persistência de Dados - UniSafe

## 📋 Diagnóstico do Problema

### **Por que o login não funciona após clonar o repositório?**

Quando você clona o repositório do UniSafe em outro computador, **o banco de dados SQLite NÃO é transferido junto**. Isso acontece porque:

1. **O arquivo `unisafe.db` está no `.gitignore`**
   - Linha 61 do `.gitignore`: `*.db`
   - Isso significa que o Git **ignora completamente** o arquivo de banco de dados
   - O arquivo `unisafe.db` **NÃO é versionado** e **NÃO vai para o GitHub**

2. **Cada ambiente cria seu próprio banco de dados**
   - Quando você roda `npm start` no novo computador
   - O sistema cria um arquivo `unisafe.db` **VAZIO** em `backend/database/`
   - Este banco novo **NÃO contém** as contas criadas no primeiro computador

3. **As contas são salvas localmente**
   - ✅ Sim, as contas ficam salvas no SQLite (tabela `usuarios`)
   - ❌ Mas apenas no computador onde foram criadas
   - ❌ Não são transferidas para outros ambientes

---

## 🔍 Investigação Detalhada

### **1. Onde as contas ficam salvas?**

**Sim, as contas ficam salvas no banco SQLite:**
- Arquivo: `backend/database/unisafe.db`
- Tabela: `usuarios`
- Campos: `id`, `nome`, `email`, `senha` (hash bcrypt), `telefone`, `bio`, `avatar_url`, `criado_em`, `ativo`

### **2. O que acontece ao clonar o projeto?**

```bash
# Computador 1 (original)
backend/database/unisafe.db  ← Contém usuários cadastrados

# Git ignora este arquivo
.gitignore contém: *.db

# Computador 2 (novo)
git clone https://github.com/...
# Resultado: NÃO existe unisafe.db

npm start
# Sistema cria: unisafe.db VAZIO (sem usuários)
```

### **3. A rota de login funciona corretamente?**

**Sim, a rota está validando corretamente:**

```javascript
// backend/routes/auth.js - Linha 116
router.post('/login', async (req, res) => {
  // 1. Busca usuário por email
  const usuario = await db.get(
    'SELECT id, nome, email, senha FROM usuarios WHERE email = ?',
    [email]
  )
  
  // 2. Verifica se usuário existe
  if (!usuario) {
    return res.status(401).json({ message: 'Email ou senha incorretos' })
  }
  
  // 3. Compara senha com hash bcrypt
  const senhaValida = await bcrypt.compare(senha, usuario.senha)
  
  // 4. Gera token JWT se senha válida
  const token = jwt.sign({ id, email, nome }, JWT_SECRET, { expiresIn: '7d' })
})
```

**O problema NÃO é a validação, é a ausência de dados!**

### **4. Diferenças entre os bancos**

| Aspecto | Computador Original | Computador Novo |
|---------|---------------------|-----------------|
| Arquivo existe? | ✅ Sim | ❌ Não (criado vazio) |
| Tabela `usuarios` | ✅ Com dados | ✅ Vazia |
| Contas cadastradas | ✅ Presentes | ❌ Nenhuma |
| Login funciona? | ✅ Sim | ❌ Não (sem usuários) |

---

## 🚀 Soluções para Migração de Dados

### **Solução 1: Copiar o Arquivo do Banco de Dados (Mais Simples)**

**Passo a Passo:**

```bash
# No Computador 1 (original)
# 1. Localize o arquivo do banco
# Caminho: backend/database/unisafe.db

# 2. Copie este arquivo para um pendrive, Google Drive, ou envie por email

# No Computador 2 (novo)
# 3. Clone o repositório normalmente
git clone https://github.com/rafael-henrique1/unisafe.git
cd unisafe

# 4. Cole o arquivo unisafe.db copiado em:
# backend/database/unisafe.db

# 5. Instale as dependências e rode
cd backend
npm install
npm start
```

**Pronto! Todos os usuários estarão disponíveis.**

---

### **Solução 2: Exportar e Importar Dados SQL**

**No Computador 1 - Exportar:**

```bash
# Instale o sqlite3 (se não tiver)
# Windows: Download em https://sqlite.org/download.html
# Linux/Mac: sudo apt install sqlite3

# Entre na pasta do banco
cd backend/database

# Exporte os dados
sqlite3 unisafe.db .dump > backup_usuarios.sql
```

**No Computador 2 - Importar:**

```bash
# Cole o arquivo backup_usuarios.sql em backend/database/

# Importe os dados
cd backend/database
sqlite3 unisafe.db < backup_usuarios.sql
```

---

### **Solução 3: Criar Script de Seeds (Recomendado para Desenvolvimento)**

Criar dados de teste que podem ser recriados facilmente:

```javascript
// backend/database/seeds.js
const db = require('../config/database')
const bcrypt = require('bcryptjs')

async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...')
  
  // Usuário de teste 1
  const senha1 = await bcrypt.hash('Senha123', 12)
  await db.run(`
    INSERT OR IGNORE INTO usuarios (nome, email, senha, criado_em)
    VALUES (?, ?, ?, datetime('now'))
  `, ['João Silva', 'joao@unisafe.com', senha1])
  
  // Usuário de teste 2
  const senha2 = await bcrypt.hash('Teste123', 12)
  await db.run(`
    INSERT OR IGNORE INTO usuarios (nome, email, senha, criado_em)
    VALUES (?, ?, ?, datetime('now'))
  `, ['Maria Santos', 'maria@unisafe.com', senha2])
  
  console.log('✅ Seed concluído! Usuários de teste criados.')
  console.log('📧 Login: joao@unisafe.com | Senha: Senha123')
  console.log('📧 Login: maria@unisafe.com | Senha: Teste123')
}

module.exports = { seedDatabase }
```

**Adicionar no `package.json`:**

```json
{
  "scripts": {
    "seed": "node -e \"require('./database/seeds').seedDatabase()\""
  }
}
```

**Usar em qualquer ambiente:**

```bash
npm run seed
```

---

### **Solução 4: Usar Banco em Produção (Recomendado para Deploy)**

Para aplicação real, considere migrar para PostgreSQL ou MySQL:

**Vantagens:**
- ✅ Banco centralizado (um servidor para todos)
- ✅ Múltiplos desenvolvedores acessam os mesmos dados
- ✅ Backup automático
- ✅ Melhor para produção

**Serviços gratuitos:**
- [Supabase](https://supabase.com) - PostgreSQL grátis
- [PlanetScale](https://planetscale.com) - MySQL grátis
- [Railway](https://railway.app) - PostgreSQL grátis
- [Neon](https://neon.tech) - PostgreSQL grátis

---

## 📝 Checklist de Migração

- [ ] **Copiar `unisafe.db` do computador original**
- [ ] **Colar em `backend/database/` no novo computador**
- [ ] **Ou criar script de seed para dados de teste**
- [ ] **Testar login com conta existente**
- [ ] **Verificar se postagens/comentários foram migrados**

---

## ⚠️ Importante: Dados em Produção

**Para aplicação em produção, NUNCA use SQLite com `.gitignore`!**

### **Opções recomendadas:**

1. **Desenvolvimento:** Seeds com dados de teste
2. **Staging:** Banco compartilhado (PostgreSQL)
3. **Produção:** Banco robusto com backup automático

---

## 🔐 Segurança

**⚠️ NUNCA commite o banco de dados com dados reais no Git!**

Por isso o `*.db` está no `.gitignore`:
- Senhas são hasheadas, mas ainda é sensível
- Dados pessoais dos usuários
- Informações da comunidade

**Se precisar compartilhar dados:**
- Use seeds para dados fictícios
- Ou compartilhe o arquivo diretamente (fora do Git)

---

## 📞 Resumo Executivo

### **Problema:**
Banco de dados SQLite não é versionado → Cada computador tem seu próprio banco vazio

### **Causa:**
`.gitignore` bloqueia `*.db` de ser enviado ao Git

### **Solução Rápida:**
Copiar arquivo `backend/database/unisafe.db` entre computadores

### **Solução Profissional:**
Migrar para PostgreSQL/MySQL em produção

---

**Criado em:** 07/10/2025
**Projeto:** UniSafe - Plataforma de Segurança Comunitária
