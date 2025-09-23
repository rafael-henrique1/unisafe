/**
 * Configuração de Conexão com Banco de Dados MySQL
 * 
 * Este arquivo estabelece a conexão com o banco MySQL e fornece
 * métodos para executar queries de forma segura e eficiente.
 * 
 * Funcionalidades:
 * - Pool de conexões para melhor performance
 * - Tratamento de erros
 * - Reconexão automática
 * - Queries preparadas para segurança
 */

const mysql = require('mysql2/promise')
require('dotenv').config()

// Configurações do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'unisafe_db',
  charset: 'utf8mb4',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  
  // Configurações do pool de conexões
  connectionLimit: 10,
  queueLimit: 0,
  
  // Configurações de SSL (desabilitado para desenvolvimento local)
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
}

// Cria o pool de conexões
let pool

try {
  pool = mysql.createPool(dbConfig)
  console.log('📊 Pool de conexões MySQL criado com sucesso')
} catch (error) {
  console.error('❌ Erro ao criar pool de conexões:', error.message)
  process.exit(1)
}

/**
 * Executa uma query no banco de dados
 * @param {string} sql - Query SQL a ser executada
 * @param {Array} params - Parâmetros da query (opcional)
 * @returns {Promise<Array>} - Resultado da query
 */
async function query(sql, params = []) {
  let connection

  try {
    connection = await pool.getConnection()
    
    // Log da query em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query SQL:', sql)
      if (params.length > 0) {
        console.log('📝 Parâmetros:', params)
      }
    }

    const [rows] = await connection.execute(sql, params)
    return rows

  } catch (error) {
    console.error('❌ Erro na query SQL:', error.message)
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

/**
 * Testa a conexão com o banco de dados
 * @returns {Promise<boolean>} - True se a conexão estiver ok
 */
async function testarConexao() {
  try {
    const result = await query('SELECT 1 as connected')
    console.log('✅ Conexão com banco MySQL estabelecida!')
    return true
  } catch (error) {
    console.error('❌ Falha na conexão com MySQL:', error.message)
    return false
  }
}

/**
 * Inicializa o banco de dados criando as tabelas necessárias
 */
async function inicializarDB() {
  try {
    console.log('🔧 Inicializando estrutura do banco de dados...')

    // Tabela de usuários
    await query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        curso VARCHAR(100) NOT NULL,
        telefone VARCHAR(20) NULL,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_curso (curso)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Tabela de postagens
    await query(`
      CREATE TABLE IF NOT EXISTS postagens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        conteudo TEXT NOT NULL,
        tipo ENUM('aviso', 'alerta', 'emergencia', 'informacao') NOT NULL DEFAULT 'aviso',
        localizacao VARCHAR(255) NULL,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_tipo (tipo),
        INDEX idx_criado_em (criado_em),
        INDEX idx_usuario_id (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Tabela de curtidas
    await query(`
      CREATE TABLE IF NOT EXISTS curtidas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        postagem_id INT NOT NULL,
        usuario_id INT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_curtida (postagem_id, usuario_id),
        FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_postagem_id (postagem_id),
        INDEX idx_usuario_id (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Tabela de comentários
    await query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        postagem_id INT NOT NULL,
        usuario_id INT NOT NULL,
        conteudo TEXT NOT NULL,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_postagem_id (postagem_id),
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_criado_em (criado_em)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Tabela de sessões (para futuras implementações)
    await query(`
      CREATE TABLE IF NOT EXISTS sessoes (
        id VARCHAR(128) PRIMARY KEY,
        usuario_id INT NOT NULL,
        dados JSON,
        expires TIMESTAMP NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_expires (expires)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log('✅ Estrutura do banco de dados criada com sucesso!')
    return true

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message)
    throw error
  }
}

/**
 * Fecha o pool de conexões
 */
async function fecharConexao() {
  try {
    await pool.end()
    console.log('✅ Pool de conexões MySQL fechado')
  } catch (error) {
    console.error('❌ Erro ao fechar conexões:', error.message)
  }
}

// Testa a conexão quando o módulo é carregado
testarConexao()

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Fechando conexões com banco...')
  await fecharConexao()
})

module.exports = {
  query,
  testarConexao,
  inicializarDB,
  fecharConexao,
  pool
}
