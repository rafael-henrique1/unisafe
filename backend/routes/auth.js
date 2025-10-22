/**
 * Rotas de Autenticação do UniSafe
 * 
 * Este arquivo contém todas as rotas relacionadas à autenticação:
 * - POST /login - Autenticar usuário
 * - POST /cadastro - Registrar novo usuário  
 * - POST /logout - Deslogar usuário
 * - GET /perfil - Obter dados do usuário logado
 */

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const db = require('../config/database')
const { JWT_SECRET } = require('../config/env')
const { loginLimiter, cadastroLimiter } = require('../middlewares/rateLimiter')

const router = express.Router()

/**
 * POST /api/auth/cadastro
 * Registra um novo usuário da comunidade no sistema
 */
router.post('/cadastro', cadastroLimiter, [
  // Validações dos campos para usuários da comunidade
  body('nome').notEmpty().withMessage('Nome completo é obrigatório')
    .isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres')
    .matches(/^[a-zA-Z\s\u00C0-\u017F]+$/).withMessage('Nome deve conter apenas letras e espaços'),
  body('username').notEmpty().withMessage('Nome de usuário é obrigatório')
    .isLength({ min: 3, max: 30 }).withMessage('Nome de usuário deve ter entre 3 e 30 caracteres')
    .matches(/^[a-z0-9._]+$/).withMessage('Use apenas letras minúsculas, números, pontos e sublinhados')
    .custom((value) => {
      // Verifica se contém caracteres proibidos
      if (/[\s!%$@#^&*()+=\[\]{};':"\\|,<>\/?]/.test(value)) {
        throw new Error('Nome de usuário contém caracteres proibidos')
      }
      return true
    }),
  body('email').isEmail().withMessage('Email inválido')
    .normalizeEmail()
    .custom((value) => {
      const emailLower = value.toLowerCase()
      const dominiosPermitidos = ['@gmail.com', '@hotmail.com', '@outlook.com', '@eaportal.org']
      const emailValido = dominiosPermitidos.some(dominio => emailLower.endsWith(dominio))
      if (!emailValido) {
        throw new Error('Apenas emails @gmail.com, @hotmail.com, @outlook.com ou @eaportal.org são permitidos')
      }
      return true
    }),
  body('senha').isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula e 1 número'),
  body('telefone').optional().matches(/^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$|^\d{10,11}$/).withMessage('Telefone inválido')
], async (req, res) => {
  try {
    // Verifica se há erros de validação
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      })
    }

    const { nome, username, email, senha, telefone } = req.body

    console.log(`[CADASTRO] Tentativa de cadastro - Username: ${username}, Email: ${email}`)

    // Verifica se o nome tem pelo menos nome e sobrenome
    if (nome.trim().split(' ').length < 2) {
      console.log(`[CADASTRO] Nome incompleto fornecido: ${nome}`)
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe seu nome completo (nome e sobrenome)'
      })
    }

    // Verifica se o username já está em uso (case insensitive)
    console.log(`[CADASTRO] Verificando se username já existe: ${username}`)
    const usernameExistente = await db.query(
      'SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?)',
      [username]
    )

    if (usernameExistente.length > 0) {
      console.log(`[CADASTRO] Username já em uso: ${username}`)
      return res.status(409).json({
        success: false,
        message: 'Este nome de usuário já está em uso'
      })
    }

    // Verifica se o email já está cadastrado
    console.log(`[CADASTRO] Verificando se email já existe: ${email}`)
    const emailExistente = await db.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    )

    if (emailExistente.length > 0) {
      console.log(`[CADASTRO] Email já cadastrado: ${email}`)
      return res.status(409).json({
        success: false,
        message: 'Este email já está em uso na comunidade'
      })
    }

    // Criptografa a senha
    console.log('[CADASTRO] Criptografando senha...')
    const senhaHash = await bcrypt.hash(senha, 12)

    // Insere o novo usuário no banco
    console.log('[CADASTRO] Inserindo usuário no banco de dados...')
    const resultado = await db.query(
      'INSERT INTO usuarios (nome, username, email, senha, telefone) VALUES (?, ?, ?, ?, ?)',
      [nome, username.toLowerCase(), email, senhaHash, telefone || null]
    )

    console.log(`[CADASTRO] Usuário inserido com ID: ${resultado.lastID}`)

    // Gera token JWT para o novo usuário
    const token = jwt.sign(
      { 
        id: resultado.lastID, 
        email: email,
        username: username.toLowerCase(),
        nome: nome 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log(`✅ [CADASTRO] Cadastro concluído com sucesso - Username: ${username}, Email: ${email}, ID: ${resultado.lastID}`)

    res.status(201).json({
      success: true,
      message: 'Bem-vindo à comunidade UniSafe!',
      data: {
        token,
        usuario: {
          id: resultado.lastID,
          nome,
          username: username.toLowerCase(),
          email
        }
      }
    })

  } catch (error) {
    console.error('❌ [ERRO CADASTRO]', error.message)
    console.error('Stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao processar cadastro'
    })
  }
})

/**
 * POST /api/auth/login
 * Autentica um usuário no sistema
 */
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Email inválido')
    .custom((value) => {
      const emailLower = value.toLowerCase()
      const dominiosPermitidos = ['@gmail.com', '@hotmail.com', '@outlook.com', '@eaportal.org']
      const emailValido = dominiosPermitidos.some(dominio => emailLower.endsWith(dominio))
      if (!emailValido) {
        throw new Error('Apenas emails @gmail.com, @hotmail.com, @outlook.com ou @eaportal.org são permitidos')
      }
      return true
    }),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
  try {
    // Verifica se há erros de validação
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      })
    }

    const { email, senha } = req.body

    console.log(`[LOGIN] Tentativa de login - Email: ${email}`)

    // Busca o usuário no banco
    const usuarios = await db.query(
      'SELECT id, nome, username, email, senha, criado_em FROM usuarios WHERE email = ?',
      [email]
    )

    const usuario = usuarios[0]

    if (!usuario) {
      console.log(`[LOGIN] Usuário não encontrado: ${email}`)
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      })
    }

    console.log(`[LOGIN] Usuário encontrado - ID: ${usuario.id}, Nome: ${usuario.nome}`)

    // Verifica a senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
      console.log(`[LOGIN] Senha incorreta para: ${email}`)
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      })
    }

    // Gera o token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email,
        username: usuario.username,
        nome: usuario.nome 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log(`✅ [LOGIN] Login realizado com sucesso - Usuário: ${email}, ID: ${usuario.id}`)

    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          username: usuario.username,
          email: usuario.email
        }
      }
    })

  } catch (error) {
    console.error('❌ [ERRO LOGIN]', error.message)
    console.error('Stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao processar login'
    })
  }
})

/**
 * POST /api/auth/logout
 * Desloga o usuário (invalida o token no frontend)
 */
router.post('/logout', (req, res) => {
  // No JWT, o logout é feito no frontend removendo o token
  // Aqui apenas confirmamos a operação
  res.json({
    success: true,
    message: 'Logout realizado com sucesso!'
  })
})

/**
 * GET /api/auth/perfil
 * Retorna os dados do usuário logado
 */
router.get('/perfil', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      })
    }

    // Verifica e decodifica o token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Busca os dados atuais do usuário
    const usuarios = await db.query(
      'SELECT id, nome, email, telefone, criado_em FROM usuarios WHERE id = ?',
      [decoded.id]
    )

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      })
    }

    const usuario = usuarios[0]

    res.json({
      success: true,
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        membro_desde: usuario.criado_em
      }
    })

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      })
    }

    console.error('[ERRO PERFIL]', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

module.exports = router
