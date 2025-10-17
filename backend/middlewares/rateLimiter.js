/**
 * Rate Limiter - Proteção contra Força Bruta
 * 
 * Implementa limitação de requisições para proteger rotas sensíveis
 * como login, cadastro e recuperação de senha.
 * 
 * Configurações PRODUÇÃO:
 * - Login: 5 tentativas a cada 15 minutos por IP
 * - Cadastro: 3 cadastros a cada 1 hora por IP
 * - Geral: 100 requisições a cada 15 minutos por IP
 * 
 * Configurações DESENVOLVIMENTO (mais generosas para testes):
 * - Login: 50 tentativas a cada 1 minuto por IP
 * - Cadastro: 20 cadastros a cada 1 minuto por IP
 * - Geral: 1000 requisições a cada 1 minuto por IP
 */

const rateLimit = require('express-rate-limit')

// Detecta o ambiente
const isDevelopment = process.env.NODE_ENV !== 'production'

/**
 * Rate Limiter para rota de Login
 * Previne ataques de força bruta em tentativas de autenticação
 */
const loginLimiter = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min (dev) ou 15 min (prod)
  max: isDevelopment ? 50 : 5, // 50 tentativas (dev) ou 5 (prod)
  message: {
    success: false,
    message: isDevelopment 
      ? 'Muitas tentativas de login. Aguarde 1 minuto. [MODO DEV]'
      : 'Muitas tentativas de login. Por favor, tente novamente em 15 minutos.',
    retry_after: isDevelopment ? '1 minuto' : '15 minutos'
  },
  standardHeaders: true, // Retorna info de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  skipSuccessfulRequests: false, // Conta tentativas bem-sucedidas
  skipFailedRequests: false, // Conta tentativas falhadas
  handler: (req, res) => {
    const env = isDevelopment ? '[DEV]' : '[PROD]'
    console.log(`[RATE LIMIT] ${env} ⚠️ IP bloqueado por excesso de tentativas: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: isDevelopment
        ? 'Muitas tentativas de login. Aguarde 1 minuto. [MODO DEV]'
        : 'Muitas tentativas de login. Por favor, tente novamente em 15 minutos.',
      retry_after: isDevelopment ? '1 minuto' : '15 minutos'
    })
  }
})

/**
 * Rate Limiter para rota de Cadastro
 * Previne spam de criação de contas
 */
const cadastroLimiter = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1000 : 60 * 60 * 1000, // 1 min (dev) ou 1 hora (prod)
  max: isDevelopment ? 20 : 3, // 20 cadastros (dev) ou 3 (prod)
  message: {
    success: false,
    message: isDevelopment
      ? 'Muitas tentativas de cadastro. Aguarde 1 minuto. [MODO DEV]'
      : 'Muitas tentativas de cadastro. Por favor, tente novamente em 1 hora.',
    retry_after: isDevelopment ? '1 minuto' : '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const env = isDevelopment ? '[DEV]' : '[PROD]'
    console.log(`[RATE LIMIT] ${env} ⚠️ IP bloqueado por excesso de cadastros: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: isDevelopment
        ? 'Muitas tentativas de cadastro. Aguarde 1 minuto. [MODO DEV]'
        : 'Muitas tentativas de cadastro. Por favor, tente novamente em 1 hora.',
      retry_after: isDevelopment ? '1 minuto' : '1 hora'
    })
  }
})

/**
 * Rate Limiter Geral para API
 * Protege contra uso excessivo da API
 */
const apiLimiter = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min (dev) ou 15 min (prod)
  max: isDevelopment ? 1000 : 100, // 1000 requisições (dev) ou 100 (prod)
  message: {
    success: false,
    message: isDevelopment
      ? 'Muitas requisições. Aguarde 1 minuto. [MODO DEV]'
      : 'Muitas requisições. Por favor, tente novamente em alguns minutos.',
    retry_after: isDevelopment ? '1 minuto' : '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const env = isDevelopment ? '[DEV]' : '[PROD]'
    console.log(`[RATE LIMIT] ${env} ⚠️ IP bloqueado por excesso de requisições: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: isDevelopment
        ? 'Muitas requisições. Aguarde 1 minuto. [MODO DEV]'
        : 'Muitas requisições. Por favor, tente novamente em alguns minutos.'
    })
  }
})

// Log de configuração ao iniciar
if (isDevelopment) {
  console.log(`
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
  `)
}

module.exports = {
  loginLimiter,
  cadastroLimiter,
  apiLimiter
}
