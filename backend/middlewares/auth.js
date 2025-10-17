/**
 * Middleware de Autenticação JWT
 * 
 * Middleware centralizado para verificar tokens JWT em rotas protegidas.
 * Substitui as implementações duplicadas em postagens.js e usuarios.js.
 * 
 * Uso:
 * ```javascript
 * const { verificarAuth } = require('../middlewares/auth')
 * router.get('/perfil', verificarAuth, (req, res) => { ... })
 * ```
 * 
 * O usuário autenticado fica disponível em `req.usuario` com:
 * - id: ID do usuário
 * - email: Email do usuário
 * - nome: Nome do usuário
 */

const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/env')
const logger = require('../config/logger')

/**
 * Middleware para verificar autenticação JWT
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Próximo middleware
 */
const verificarAuth = (req, res, next) => {
  try {
    // Extrai o token do header Authorization
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      logger.warn('Tentativa de acesso sem token', { 
        path: req.path, 
        method: req.method,
        ip: req.ip 
      })
      
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
        code: 'TOKEN_MISSING'
      })
    }

    // Remove o prefixo "Bearer " do token
    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      logger.warn('Header Authorization vazio', { 
        path: req.path, 
        method: req.method,
        ip: req.ip 
      })
      
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
        code: 'TOKEN_MISSING'
      })
    }

    // Verifica e decodifica o token JWT
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Adiciona os dados do usuário ao objeto req
    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      nome: decoded.nome
    }
    
    logger.debug('Usuário autenticado com sucesso', { 
      userId: decoded.id, 
      path: req.path,
      method: req.method
    })
    
    // Prossegue para o próximo middleware/rota
    next()
    
  } catch (error) {
    // Token inválido ou expirado
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Token JWT inválido', { 
        path: req.path, 
        method: req.method,
        ip: req.ip,
        error: error.message 
      })
      
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'TOKEN_INVALID'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token JWT expirado', { 
        path: req.path, 
        method: req.method,
        ip: req.ip,
        expiredAt: error.expiredAt 
      })
      
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor, faça login novamente.',
        code: 'TOKEN_EXPIRED'
      })
    }
    
    // Erro genérico
    logger.error('Erro na verificação de autenticação', { 
      error: error.message,
      stack: error.stack,
      path: req.path 
    })
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar autenticação',
      code: 'AUTH_ERROR'
    })
  }
}

/**
 * Middleware opcional - tenta autenticar mas não bloqueia se falhar
 * Útil para rotas que funcionam com ou sem autenticação
 */
const verificarAuthOpcional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      req.usuario = null
      return next()
    }

    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      req.usuario = null
      return next()
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    
    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      nome: decoded.nome
    }
    
    next()
    
  } catch (error) {
    // Em caso de erro, simplesmente não autentica
    req.usuario = null
    next()
  }
}

module.exports = {
  verificarAuth,
  verificarAuthOpcional
}
