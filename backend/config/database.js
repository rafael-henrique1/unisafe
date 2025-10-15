/**
 * Configuração de Conexão com Banco de Dados MySQL
 * 
 * Este arquivo estabelece a conexão com o banco MySQL (Railway) e fornece
 * métodos para executar queries de forma segura e eficiente.
 */

const mysql = require('mysql2/promise')
require('dotenv').config()

// Pool de conexões MySQL
let pool

// Inicializa o banco de dados
async function initializeDatabase() {
  try {
    // Parse da DATABASE_URL
    const DATABASE_URL = process.env.DATABASE_URL
    
    if (!DATABASE_URL) {
      throw new Error('❌ DATABASE_URL não configurada no .env')
    }

    console.log('��� Conectando ao MySQL...')
    
    // Cria pool de conexões
    pool = mysql.createPool({
      uri: DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    })

    // Testa a conexão
    const connection = await pool.getConnection()
    console.log('✅ Conexão MySQL estabelecida com sucesso!')
    connection.release()

    // Cria as tabelas
    await createTables()
    
    return pool
  } catch (error) {
    console.error('❌ Erro ao conectar ao MySQL:', error.message)
    throw error
  }
}

// Cria as tabelas
async function createTables() {
  try {
    console.log('���️  Criando tabelas no MySQL...')

    // Tabela de usuários
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        bio TEXT,
        avatar_url TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Tabela de postagens
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS postagens (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Tabela de curtidas
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS curtidas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        postagem_id INT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_curtida (usuario_id, postagem_id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
        INDEX idx_usuario (usuario_id),
        INDEX idx_postagem (postagem_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Tabela de comentários
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS comentarios (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Tabela de notificações (para sistema de notificações em tempo real)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notificacoes (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    // Adiciona a coluna postagem_id se a tabela já existe (migração)
    try {
      await pool.execute(`
        ALTER TABLE notificacoes 
        ADD COLUMN IF NOT EXISTS postagem_id INT NULL
      `)
      await pool.execute(`
        ALTER TABLE notificacoes 
        ADD CONSTRAINT fk_notificacoes_postagem 
        FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE
      `)
    } catch (err) {
      // Ignora erro se coluna/constraint já existir
      if (!err.message.includes('Duplicate')) {
        console.log('⚠️  Migração de notificacoes já aplicada ou não necessária')
      }
    }

    console.log('✅ Tabelas criadas com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message)
    throw error
  }
}

// Executa uma query (para SELECT retorna rows, para INSERT/UPDATE retorna info)
async function query(sql, params = []) {
  try {
    if (!pool) {
      throw new Error('Pool de conexões não inicializado. Execute initializeDatabase() primeiro.')
    }

    const [rows] = await pool.execute(sql, params)
    
    // Para queries INSERT/UPDATE/DELETE, retorna info com insertId
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      console.log(`✅ INSERT executado - ID: ${rows.insertId}, Linhas afetadas: ${rows.affectedRows}`)
      return {
        lastID: rows.insertId,
        insertId: rows.insertId,
        affectedRows: rows.affectedRows,
        changes: rows.affectedRows
      }
    }
    
    if (sql.trim().toUpperCase().startsWith('UPDATE')) {
      console.log(`✅ UPDATE executado - Linhas afetadas: ${rows.affectedRows}`)
      return {
        affectedRows: rows.affectedRows,
        changes: rows.affectedRows
      }
    }
    
    if (sql.trim().toUpperCase().startsWith('DELETE')) {
      console.log(`✅ DELETE executado - Linhas afetadas: ${rows.affectedRows}`)
      return {
        affectedRows: rows.affectedRows,
        changes: rows.affectedRows
      }
    }
    
    // Para SELECT, retorna as rows
    console.log(`✅ SELECT executado - ${rows.length} linha(s) retornada(s)`)
    return rows
  } catch (error) {
    console.error('❌ Erro na query MySQL:')
    console.error('   Mensagem:', error.message)
    console.error('   Código:', error.code)
    console.error('   SQL:', sql.substring(0, 200))
    console.error('   Params:', JSON.stringify(params))
    throw error
  }
}

// Fecha o pool de conexões
async function closeDatabase() {
  if (pool) {
    await pool.end()
    console.log('��� Conexão MySQL encerrada')
  }
}

module.exports = {
  initializeDatabase,
  query,
  closeDatabase
}
