/**
 * Serverless function handler para Vercel
 * 
 * A Vercel requer que serverless functions exportem um handler padrão.
 * Este arquivo adapta o servidor Express para funcionar como serverless function.
 */

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const path = require('path')
const env = require('../config/env')
const db = require('../config/database')
const logger = require('../config/logger')
const passport = require('../config/passport')

// Importa as rotas da API
const authRoutes = require('../routes/auth')
const authGoogleRoutes = require('../routes/authGoogle')
const postagensRoutes = require('../routes/postagens')
const usuariosRoutes = require('../routes/usuarios')
const amigosRoutes = require('../routes/amigos')

// Cria a instância do Express
const app = express()

// Middlewares de segurança e utilidade
app.use(helmet())
app.use(morgan('combined', { stream: logger.stream }))

// CORS dinâmico com suporte a múltiplos domínios
const allowedOrigins = env.FRONTEND_URL ? env.FRONTEND_URL.split(',') : ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Middlewares de parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Passport
app.use(passport.initialize())

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Registra as rotas da API
app.use('/api/auth', authRoutes)
app.use('/api/auth/google', authGoogleRoutes)
app.use('/api/postagens', postagensRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/amigos', amigosRoutes)

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'API UniSafe',
    version: '1.0.0',
    status: 'running'
  })
})

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  })
})

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  logger.error('Erro não tratado', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  })

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor'
  })
})

// Exporta o app como serverless function
module.exports = app
