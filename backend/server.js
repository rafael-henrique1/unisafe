/**
 * Servidor principal da API UniSafe
 * 
 * Este arquivo configura o servidor Express.js que fornece a API REST
 * para a plataforma de segurança comunitária UniSafe.
 * 
 * Funcionalidades principais:
 * - Autenticação de usuários (login/cadastro)
 * - Gerenciamento de postagens de segurança
 * - Conexão com banco de dados MySQL (Railway)
 * - Middlewares de segurança e CORS
 * - Notificações em tempo real via Socket.IO
 */

const express = require('express')
const http = require('http') // ← HTTP para integrar Socket.IO
const { Server } = require('socket.io') // ← Socket.IO para notificações em tempo real
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const env = require('./config/env')
const db = require('./config/database')

// Importa as rotas da API
const authRoutes = require('./routes/auth')
const postagensRoutes = require('./routes/postagens')
const usuariosRoutes = require('./routes/usuarios')

// Cria a instância do Express
const app = express()

// Cria servidor HTTP (necessário para Socket.IO)
const server = http.createServer(app)

const PORT = env.PORT

// Middlewares de segurança e utilidade
app.use(helmet()) // Adiciona headers de segurança
app.use(morgan('combined')) // Log das requisições

// CORS dinâmico com suporte a múltiplos domínios
const allowedOrigins = env.FRONTEND_URL ? env.FRONTEND_URL.split(',') : ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed by CORS'));
    }
  },
  credentials: true
}))

// Configura Socket.IO com CORS (mesmas origens do Express)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
})

app.use(express.json({ limit: '10mb' })) // Parser JSON para requisições
app.use(express.urlencoded({ extended: true })) // Parser URL-encoded

// Middleware para log personalizado
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Rota de teste da API
app.get('/', (req, res) => {
  res.json({
    message: 'API UniSafe funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      postagens: '/api/postagens',
      usuarios: '/api/usuarios'
    }
  })
})

// Rota de saúde do sistema
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// Configuração das rotas da API
app.use('/api/auth', authRoutes) // Rotas de autenticação
app.use('/api/postagens', postagensRoutes) // Rotas de postagens
app.use('/api/usuarios', usuariosRoutes) // Rotas de usuários

// Rota para login (compatibilidade)
app.use('/api/login', authRoutes)
app.use('/api/cadastro', authRoutes)

// Middleware de tratamento de erros 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

// Middleware de tratamento de erros gerais
app.use((error, req, res, next) => {
  console.error('[ERRO]', error)
  
  res.status(error.status || 500).json({
    error: error.message || 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
})

// Inicia o servidor
async function startServer() {
  try {
    // Inicializa o banco de dados MySQL
    await db.initializeDatabase()
    
    // Configura Socket.IO (autenticação e eventos)
    const setupSocket = require('./config/socket')
    setupSocket(io)
    
    // Inicia o servidor HTTP (Express + Socket.IO)
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║           🚀 UniSafe API               ║
║                                        ║
║  Servidor: http://localhost:${PORT}      ║
║  Status: ✅ Online                     ║
║  Banco: MySQL (Railway)                ║
║  Socket.IO: ✅ Ativo                   ║
║  Ambiente: ${process.env.NODE_ENV || 'development'}              ║
║  Hora: ${new Date().toLocaleString('pt-BR')}   ║
╚════════════════════════════════════════╝
      `)
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🔄 Desligando servidor...')
      io.close() // ← Fecha conexões Socket.IO
      await db.closeDatabase()
      server.close(() => {
        console.log('✅ Servidor desligado com sucesso')
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error.message)
    process.exit(1)
  }
}

// Inicia a aplicação
startServer()

// Exporta app e io para uso em outros módulos (ex: rotas)
module.exports = { app, io }
