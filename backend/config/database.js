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
        username VARCHAR(30) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        bio TEXT,
        avatar_url TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE,
        INDEX idx_email (email),
        INDEX idx_username (username)
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
        imagem_url TEXT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario (usuario_id),
        INDEX idx_categoria (categoria),
        INDEX idx_criado_em (criado_em)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    // Migração: Adiciona coluna imagem_url se não existir
    try {
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'postagens' 
        AND COLUMN_NAME = 'imagem_url'
      `)
      
      if (columns.length === 0) {
        await pool.execute(`
          ALTER TABLE postagens 
          ADD COLUMN imagem_url TEXT NULL AFTER localizacao
        `)
        console.log('✅ Coluna imagem_url adicionada à tabela postagens')
      }
    } catch (err) {
      if (!err.message.includes('Duplicate')) {
        console.error('❌ Erro na migração de imagem_url:', err.message)
      }
    }

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
      // Verifica se a coluna postagem_id já existe
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'notificacoes' 
        AND COLUMN_NAME = 'postagem_id'
      `)
      
      if (columns.length === 0) {
        // Coluna não existe, adiciona
        await pool.execute(`
          ALTER TABLE notificacoes 
          ADD COLUMN postagem_id INT NULL AFTER remetente_id
        `)
        
        // Adiciona foreign key
        await pool.execute(`
          ALTER TABLE notificacoes 
          ADD CONSTRAINT fk_notificacoes_postagem 
          FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE
        `)
        console.log('✅ Coluna postagem_id adicionada à tabela notificacoes')
      } else {
        console.log('⚠️  Coluna postagem_id já existe na tabela notificacoes')
      }
    } catch (err) {
      // Ignora erro se constraint já existir
      if (err.code === 'ER_DUP_KEYNAME' || err.message.includes('Duplicate')) {
        console.log('⚠️  Migração de notificacoes já aplicada')
      } else {
        console.error('❌ Erro na migração:', err.message)
      }
    }

    // Tabela de amigos (sistema de amizade)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS amigos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        amigo_id INT NOT NULL,
        status ENUM('pendente', 'aceito', 'recusado') DEFAULT 'pendente',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (amigo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_amizade (usuario_id, amigo_id),
        INDEX idx_usuario (usuario_id),
        INDEX idx_amigo (amigo_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✅ Tabela de amigos criada/verificada')

    // Migração: Adiciona coluna foto_perfil e torna senha NULL (Google OAuth)
    try {
      // Verifica se a coluna foto_perfil já existe
      const [fotoColumns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'usuarios' 
        AND COLUMN_NAME = 'foto_perfil'
      `)
      
      if (fotoColumns.length === 0) {
        // Adiciona coluna foto_perfil
        await pool.execute(`
          ALTER TABLE usuarios 
          ADD COLUMN foto_perfil TEXT NULL AFTER bio
        `)
        console.log('✅ Coluna foto_perfil adicionada à tabela usuarios')
      }

      // Verifica se a coluna username já existe
      const [usernameColumns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'usuarios' 
        AND COLUMN_NAME = 'username'
      `)
      
      if (usernameColumns.length === 0) {
        // Adiciona coluna username
        await pool.execute(`
          ALTER TABLE usuarios 
          ADD COLUMN username VARCHAR(30) UNIQUE NULL AFTER nome,
          ADD INDEX idx_username (username)
        `)
        console.log('✅ Coluna username adicionada à tabela usuarios')
      }

      // Verifica se a coluna senha permite NULL
      const [senhaInfo] = await pool.execute(`
        SELECT IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'usuarios' 
        AND COLUMN_NAME = 'senha'
      `)
      
      if (senhaInfo.length > 0 && senhaInfo[0].IS_NULLABLE === 'NO') {
        // Modifica coluna senha para permitir NULL (usuários Google OAuth)
        await pool.execute(`
          ALTER TABLE usuarios 
          MODIFY COLUMN senha VARCHAR(255) NULL
        `)
        console.log('✅ Coluna senha modificada para permitir NULL (Google OAuth)')
      }
      
    } catch (err) {
      if (!err.message.includes('Duplicate')) {
        console.error('❌ Erro na migração OAuth:', err.message)
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
// Retorna o pool de conexões (para uso direto em rotas OAuth)
function getPool() {
  if (!pool) {
    throw new Error('Pool de conexões não inicializado. Execute initializeDatabase() primeiro.');
  }
  return pool;
}

async function closeDatabase() {
  if (pool) {
    await pool.end()
    console.log('��� Conexão MySQL encerrada')
  }
}

module.exports = {
  initializeDatabase,
  query,
  query,
  getPool,
  closeDatabase
}
