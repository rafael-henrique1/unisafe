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

const router = express.Router()

// Chave secreta para JWT (em produção deve estar no .env)
const JWT_SECRET = process.env.JWT_SECRET || 'unisafe_jwt_secret_2024'

/**
 * POST /api/auth/cadastro
 * Registra um novo usuário da comunidade no sistema
 */
router.post('/cadastro', [
  // Validações dos campos para usuários da comunidade
  body('nome').notEmpty().withMessage('Nome completo é obrigatório')
    .isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres')
    .matches(/^[A-Za-zÀ-ÿ\s]+$/).withMessage('Nome deve conter apenas letras e espaços'),
  body('email').isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('senha').isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula e 1 número'),
  body('telefone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido')
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

    const { nome, email, senha, telefone } = req.body

    // Verifica se o nome tem pelo menos nome e sobrenome
    if (nome.trim().split(' ').length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe seu nome completo (nome e sobrenome)'
      })
    }

    // Verifica se o email já está cadastrado
    const emailExistente = await db.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    )

    if (emailExistente.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Este email já está em uso na comunidade'
      })
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 12)

    // Insere o novo usuário no banco
    const resultado = await db.query(
      'INSERT INTO usuarios (nome, email, senha, telefone, criado_em) VALUES (?, ?, ?, ?, NOW())',
      [nome, email, senhaHash, telefone || null]
    )

    console.log(`[CADASTRO] Novo membro da comunidade: ${email}`)

    res.status(201).json({
      success: true,
      message: 'Bem-vindo à comunidade UniSafe!',
      data: {
        id: resultado.insertId,
        nome,
        email
      }
    })

  } catch (error) {
    console.error('[ERRO CADASTRO]', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * POST /api/auth/login
 * Autentica um usuário no sistema
 */
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
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

    // Busca o usuário no banco
    const usuarios = await db.query(
      'SELECT id, nome, email, senha, criado_em FROM usuarios WHERE email = ?',
      [email]
    )

    if (usuarios.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      })
    }

    const usuario = usuarios[0]

    // Verifica a senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
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
        nome: usuario.nome 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log(`[LOGIN] Usuário autenticado: ${email}`)

    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        }
      }
    })

  } catch (error) {
    console.error('[ERRO LOGIN]', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
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
