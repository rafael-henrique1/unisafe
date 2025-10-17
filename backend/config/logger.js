/**
 * Configuração de Logs com Winston
 * 
 * Sistema de logging estruturado com diferentes níveis e destinos.
 * 
 * Níveis de Log (ordem de severidade):
 * - error: Erros que precisam de atenção imediata
 * - warn: Avisos que podem indicar problemas futuros
 * - info: Informações gerais sobre o funcionamento do sistema
 * - http: Logs de requisições HTTP
 * - debug: Informações detalhadas para debugging
 * 
 * Destinos:
 * - Console: Logs coloridos para desenvolvimento
 * - error.log: Apenas erros (permanente)
 * - combined.log: Todos os logs (permanente)
 */

const winston = require('winston')
const path = require('path')

// Define o formato dos logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// Formato personalizado para console (mais legível)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    
    // Adiciona metadados se existirem
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`
    }
    
    return msg
  })
)

// Cria o diretório de logs se não existir
const logsDir = path.join(__dirname, '..', 'logs')

// Configuração dos transportes (destinos dos logs)
const transports = [
  // Logs de erro (apenas errors)
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  }),
  
  // Logs combinados (todos os níveis)
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  })
]

// Adiciona console apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat
    })
  )
}

// Cria o logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
})

/**
 * Stream para integração com Morgan (logs HTTP)
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim())
  }
}

/**
 * Helper para logar erros com contexto adicional
 */
logger.logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  })
}

/**
 * Helper para logar requisições com detalhes
 */
logger.logRequest = (req, context = {}) => {
  logger.info({
    type: 'request',
    method: req.method,
    path: req.path,
    ip: req.ip,
    ...context
  })
}

// Log de inicialização
logger.info('Sistema de logs Winston inicializado', {
  level: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development'
})

module.exports = logger
