/**
 * Configuração de Conexão com Banco de Dados SQLite
 * 
 * Este arquivo estabelece a conexão com o banco SQLite e fornece
 * métodos para executar queries de forma segura e eficiente.
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
require('dotenv').config()

// Caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'database', 'unisafe.db')

// Variável global para o banco
let db

// Inicializa o banco de dados
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Cria o banco SQLite
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar SQLite:', err.message)
        reject(err)
        return
      }
      
      console.log('📊 Conexão SQLite estabelecida:', dbPath)
      
      // Habilita foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('❌ Erro ao habilitar foreign keys:', err.message)
          reject(err)
          return
        }
        
        console.log('🔗 Foreign keys habilitadas')
        createTables().then(resolve).catch(reject)
      })
    })
  })
}

// Cria as tabelas
function createTables() {
  return new Promise((resolve, reject) => {
    const sql = `
      -- Tabela de usuários
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        telefone TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT 1
      );

      -- Tabela de postagens
      CREATE TABLE IF NOT EXISTS postagens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        categoria TEXT DEFAULT 'informacao',
        localizacao TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT 1,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );

      -- Tabela de curtidas
      CREATE TABLE IF NOT EXISTS curtidas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        postagem_id INTEGER NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, postagem_id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE
      );

      -- Tabela de comentários
      CREATE TABLE IF NOT EXISTS comentarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        postagem_id INTEGER NOT NULL,
        conteudo TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT 1,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE
      );
    `

    db.exec(sql, (err) => {
      if (err) {
        console.error('❌ Erro ao criar tabelas:', err.message)
        reject(err)
      } else {
        console.log('🏗️ Tabelas criadas com sucesso')
        resolve()
      }
    })
  })
}

// Executa uma query
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Erro SELECT:', err.message, 'SQL:', sql)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    } else {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Erro RUN:', err.message, 'SQL:', sql)
          reject(err)
        } else {
          resolve({ lastID: this.lastID, changes: this.changes })
        }
      })
    }
  })
}

// Executa uma query que retorna uma linha
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('❌ Erro GET:', err.message, 'SQL:', sql)
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

// Inicializa automaticamente
initializeDatabase().catch(err => {
  console.error('❌ Falha na inicialização:', err.message)
  process.exit(1)
})

module.exports = { query, get }
