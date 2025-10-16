# 🗄️ Database - UniSafe

Esta pasta contém a documentação e configurações do banco de dados MySQL do projeto UniSafe.

---

## 📊 Conexão

O banco de dados MySQL está hospedado no **Railway** e é acessado via variável de ambiente `DATABASE_URL`.

### Configuração em `backend/.env`:
```properties
DATABASE_URL="mysql://user:password@host:port/database"
```

**Exemplo:**
```properties
DATABASE_URL="mysql://root:senha@mainline.proxy.rlwy.net:20818/railway"
```

---

## 🔧 Como Funciona

O banco de dados é **inicializado automaticamente** quando o servidor backend é executado pela primeira vez. O arquivo `config/database.js` contém toda a lógica de:

- ✅ Conexão com MySQL via pool (`mysql2/promise`)
- ✅ Criação automática das tabelas necessárias
- ✅ Configuração de foreign keys e índices
- ✅ Métodos para executar queries com prepared statements
- ✅ Logs detalhados para debug

---

## 📋 Schema do Banco de Dados

### **1. Tabela: `usuarios`**

Armazena informações dos usuários da plataforma.

```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,  -- Hash bcrypt
  telefone VARCHAR(20),
  bio TEXT,
  avatar_url TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos:**
- `id`: Identificador único do usuário
- `nome`: Nome completo (mínimo: nome + sobrenome)
- `email`: Email único (usado para login)
- `senha`: Hash bcrypt com salt rounds = 12
- `telefone`: Telefone para contato (opcional)
- `bio`: Biografia do usuário (max 200 chars)
- `avatar_url`: URL da foto de perfil
- `criado_em`: Data de cadastro
- `ativo`: Soft delete (TRUE = ativo, FALSE = deletado)

---

### **2. Tabela: `postagens`**

Armazena as postagens de segurança da comunidade.

```sql
CREATE TABLE postagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  categoria VARCHAR(50) DEFAULT 'informacao',
  localizacao VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_categoria (categoria),
  INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos:**
- `id`: Identificador único da postagem
- `usuario_id`: FK para usuarios.id (autor)
- `titulo`: Título gerado automaticamente (primeiros 50 chars)
- `conteudo`: Texto completo da postagem
- `categoria`: Tipo (aviso, alerta, emergencia, informacao)
- `localizacao`: Localização do incidente (opcional)
- `criado_em`: Data de criação
- `ativo`: Soft delete

**Categorias válidas:**
- `aviso` - Avisos gerais
- `alerta` - Alertas de segurança
- `emergencia` - Situações de emergência
- `informacao` - Informações úteis

---

### **3. Tabela: `curtidas`**

Sistema de curtidas nas postagens (relação many-to-many).

```sql
CREATE TABLE curtidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  postagem_id INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_curtida (usuario_id, postagem_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_postagem (postagem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos:**
- `id`: Identificador único da curtida
- `usuario_id`: FK para usuarios.id
- `postagem_id`: FK para postagens.id
- `criado_em`: Data da curtida

**Regra:**
- Um usuário só pode curtir uma postagem uma vez (UNIQUE KEY)
- Se excluir novamente = descurtir

---

### **4. Tabela: `comentarios`**

Comentários nas postagens.

```sql
CREATE TABLE comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  postagem_id INT NOT NULL,
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_postagem (postagem_id),
  INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos:**
- `id`: Identificador único do comentário
- `usuario_id`: FK para usuarios.id (autor)
- `postagem_id`: FK para postagens.id
- `conteudo`: Texto do comentário (max 500 chars)
- `criado_em`: Data do comentário
- `ativo`: Soft delete

---

### **5. Tabela: `notificacoes`**

Sistema de notificações em tempo real (Socket.IO).

```sql
CREATE TABLE notificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  remetente_id INT NULL,
  postagem_id INT NULL,
  tipo ENUM('postagem', 'curtida', 'comentario', 'sistema') NOT NULL,
  mensagem VARCHAR(255) NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
  INDEX idx_usuario_lida (usuario_id, lida),
  INDEX idx_criada_em (criada_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos:**
- `id`: Identificador único da notificação
- `usuario_id`: FK para usuarios.id (destinatário)
- `remetente_id`: FK para usuarios.id (quem gerou a notificação)
- `postagem_id`: FK para postagens.id (contexto)
- `tipo`: Tipo da notificação
- `mensagem`: Texto da notificação
- `lida`: Status de leitura (FALSE = não lida)
- `criada_em`: Data de criação

**Tipos válidos:**
- `postagem` - Nova postagem no feed
- `curtida` - Alguém curtiu sua postagem
- `comentario` - Alguém comentou em sua postagem
- `sistema` - Notificações do sistema

---

## 🔐 Segurança

### **Características de Segurança:**

1. **Prepared Statements**: Todas as queries usam prepared statements para prevenir SQL injection
2. **Foreign Keys**: Integridade referencial garantida
3. **ON DELETE CASCADE**: Limpeza automática de dados relacionados
4. **Soft Delete**: Opção `ativo` permite recuperar dados se necessário
5. **Charset UTF-8 MB4**: Suporta emojis e caracteres especiais
6. **Índices**: Otimizados para queries frequentes

---

## 🔄 Desenvolvimento vs Produção

### **Desenvolvimento:**
- Usa MySQL do Railway (mesma instância de produção)
- Dados persistem entre diferentes máquinas
- Ideal para trabalho em equipe

### **Produção:**
- Usa MySQL do Railway (escalável e com backup)
- Backup diário automático
- Retenção de 7 dias
- Recuperação point-in-time disponível

**Vantagem:** Sem necessidade de setup local de MySQL!

---

## 📊 Queries Úteis

### Listar todas as tabelas:
```sql
SHOW TABLES;
```

### Ver estrutura de uma tabela:
```sql
DESCRIBE usuarios;
```

### Contar registros:
```sql
SELECT 
  (SELECT COUNT(*) FROM usuarios) as total_usuarios,
  (SELECT COUNT(*) FROM postagens) as total_postagens,
  (SELECT COUNT(*) FROM comentarios) as total_comentarios,
  (SELECT COUNT(*) FROM curtidas) as total_curtidas;
```

### Postagens mais curtidas:
```sql
SELECT 
  p.id,
  p.conteudo,
  u.nome as autor,
  COUNT(c.id) as total_curtidas
FROM postagens p
LEFT JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN curtidas c ON p.id = c.postagem_id
WHERE p.ativo = 1
GROUP BY p.id
ORDER BY total_curtidas DESC
LIMIT 10;
```

---

## 🛠️ Manutenção

### **Backup Manual:**
```bash
# No Railway, backups são automáticos
# Para backup manual local:
mysqldump -h HOST -P PORT -u USER -p DATABASE > backup.sql
```

### **Restaurar Backup:**
```bash
mysql -h HOST -P PORT -u USER -p DATABASE < backup.sql
```

### **Limpar dados de teste:**
```sql
-- CUIDADO: Isso apaga TODOS os dados!
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notificacoes;
TRUNCATE TABLE curtidas;
TRUNCATE TABLE comentarios;
TRUNCATE TABLE postagens;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## 📞 Troubleshooting

### **Erro de Conexão:**
```
❌ Erro ao conectar ao MySQL
```

**Soluções:**
1. Verifique se a `DATABASE_URL` está correta no `.env`
2. Confirme que o Railway está online
3. Teste a conexão: `mysql -h HOST -P PORT -u USER -p`
4. Verifique firewall/rede

### **Erro de Charset:**
```
❌ Incorrect string value
```

**Solução:** Certifique-se de que o charset seja `utf8mb4`:
```sql
ALTER DATABASE railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### **Tabelas não criadas:**
```
❌ Table 'usuarios' doesn't exist
```

**Solução:** Reinicie o servidor backend para criar as tabelas:
```bash
cd backend
npm start
```

---

## 📚 Referências

- [MySQL 8 Documentation](https://dev.mysql.com/doc/refman/8.0/en/)
- [Railway MySQL Guide](https://docs.railway.app/databases/mysql)
- [mysql2 npm package](https://www.npmjs.com/package/mysql2)

---

**Última atualização:** Outubro 2025  
**Versão do Schema:** 1.0  
**Engine:** InnoDB  
**Charset:** utf8mb4_unicode_ci
