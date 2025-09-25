/**
 * Rotas de Postagens do UniSafe
 * 
 * Este arquivo contém todas as rotas relacionadas às postagens de segurança:
 * - GET /api/postagens - Listar todas as postagens
 * - POST /api/postagens - Criar nova postagem
 * - GET /api/postagens/:id - Obter postagem específica
 * - PUT /api/postagens/:id - Atualizar postagem
 * - DELETE /api/postagens/:id - Deletar postagem
 * - POST /api/postagens/:id/curtir - Curtir/descurtir postagem
 */

const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const db = require('../config/database')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'unisafe_jwt_secret_2024'

/**
 * Middleware para verificar autenticação
 */
const verificarAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso não fornecido'
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.usuario = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    })
  }
}

/**
 * GET /api/postagens
 * Lista todas as postagens do feed (ordenadas por data)
 */
router.get('/', async (req, res) => {
  try {
    const { limite = 20, pagina = 1, tipo } = req.query

    let query = `
      SELECT 
        p.id,
        p.titulo,
        p.conteudo,
        p.categoria,
        p.localizacao,
        p.criado_em,
        u.nome as usuario_nome,
        COUNT(c.id) as total_curtidas,
        (SELECT COUNT(*) FROM comentarios co WHERE co.postagem_id = p.id) as total_comentarios
      FROM postagens p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN curtidas c ON p.id = c.postagem_id
    `

    const params = []

    // Filtra por categoria se especificado
    if (tipo) {
      query += ' WHERE p.categoria = ?'
      params.push(tipo)
    }

    query += `
      GROUP BY p.id
      ORDER BY p.criado_em DESC
      LIMIT ? OFFSET ?
    `

    const offset = (parseInt(pagina) - 1) * parseInt(limite)
    params.push(parseInt(limite), offset)

    const postagens = await db.query(query, params)

    // Formata as postagens para o frontend
    const postagensFormatadas = postagens.map(postagem => ({
      id: postagem.id,
      titulo: postagem.titulo,
      conteudo: postagem.conteudo,
      categoria: postagem.categoria,
      localizacao: postagem.localizacao,
      usuario: postagem.usuario_nome,
      data: formatarData(postagem.criado_em),
      curtidas: parseInt(postagem.total_curtidas),
      comentarios: parseInt(postagem.total_comentarios)
    }))

    res.json({
      success: true,
      data: postagensFormatadas,
      meta: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total: postagensFormatadas.length
      }
    })

  } catch (error) {
    console.error('[ERRO LISTAR POSTAGENS]', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar postagens'
    })
  }
})

/**
 * POST /api/postagens
 * Cria uma nova postagem de segurança
 */
router.post('/', verificarAuth, [
  body('conteudo').notEmpty().withMessage('Conteúdo é obrigatório'),
  body('tipo').isIn(['aviso', 'alerta', 'emergencia', 'informacao']).withMessage('Tipo inválido')
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

    const { conteudo, tipo } = req.body
    const usuarioId = req.usuario.id

    // Insere a nova postagem
    const resultado = await db.query(
      'INSERT INTO postagens (usuario_id, titulo, conteudo, categoria) VALUES (?, ?, ?, ?)',
      [usuarioId, conteudo.substring(0, 50) + '...', conteudo, tipo]
    )

    console.log(`[NOVA POSTAGEM] Usuário ${req.usuario.email} criou postagem tipo: ${tipo}`)

    res.status(201).json({
      success: true,
      message: 'Postagem criada com sucesso!',
      data: {
        id: resultado.lastID,
        conteudo,
        categoria: tipo,
        usuario: req.usuario.nome,
        criado_em: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[ERRO CRIAR POSTAGEM]', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar postagem'
    })
  }
})

/**
 * GET /api/postagens/:id
 * Obtém uma postagem específica com seus comentários
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Busca a postagem
    const postagens = await db.query(`
      SELECT 
        p.id,
        p.conteudo,
        p.tipo,
        p.criado_em,
        u.nome as usuario_nome,
        u.curso as usuario_curso,
        COUNT(c.id) as total_curtidas
      FROM postagens p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN curtidas c ON p.id = c.postagem_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id])

    if (postagens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Postagem não encontrada'
      })
    }

    const postagem = postagens[0]

    // Busca os comentários da postagem
    const comentarios = await db.query(`
      SELECT 
        co.id,
        co.conteudo,
        co.criado_em,
        u.nome as usuario_nome
      FROM comentarios co
      LEFT JOIN usuarios u ON co.usuario_id = u.id
      WHERE co.postagem_id = ?
      ORDER BY co.criado_em ASC
    `, [id])

    res.json({
      success: true,
      data: {
        id: postagem.id,
        conteudo: postagem.conteudo,
        tipo: postagem.tipo,
        usuario: postagem.usuario_nome,
        curso: postagem.usuario_curso,
        data: formatarData(postagem.criado_em),
        curtidas: parseInt(postagem.total_curtidas),
        comentarios: comentarios.map(c => ({
          id: c.id,
          conteudo: c.conteudo,
          usuario: c.usuario_nome,
          data: formatarData(c.criado_em)
        }))
      }
    })

  } catch (error) {
    console.error('[ERRO OBTER POSTAGEM]', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar postagem'
    })
  }
})

/**
 * POST /api/postagens/:id/curtir
 * Curte ou descurte uma postagem
 */
router.post('/:id/curtir', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params
    const usuarioId = req.usuario.id

    // Verifica se a postagem existe
    const postagens = await db.query('SELECT id FROM postagens WHERE id = ?', [id])
    if (postagens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Postagem não encontrada'
      })
    }

    // Verifica se o usuário já curtiu
    const curtidaExistente = await db.query(
      'SELECT id FROM curtidas WHERE postagem_id = ? AND usuario_id = ?',
      [id, usuarioId]
    )

    if (curtidaExistente.length > 0) {
      // Remove a curtida
      await db.query('DELETE FROM curtidas WHERE postagem_id = ? AND usuario_id = ?', [id, usuarioId])
      
      res.json({
        success: true,
        message: 'Curtida removida',
        action: 'removed'
      })
    } else {
      // Adiciona a curtida
      await db.query(
        'INSERT INTO curtidas (postagem_id, usuario_id, criado_em) VALUES (?, ?, NOW())',
        [id, usuarioId]
      )
      
      res.json({
        success: true,
        message: 'Postagem curtida',
        action: 'added'
      })
    }

  } catch (error) {
    console.error('[ERRO CURTIR POSTAGEM]', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao processar curtida'
    })
  }
})

/**
 * Função auxiliar para formatar datas
 */
function formatarData(data) {
  const agora = new Date()
  const dataPost = new Date(data)
  const diffMs = agora - dataPost
  const diffMinutos = Math.floor(diffMs / (1000 * 60))
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutos < 1) return 'Agora mesmo'
  if (diffMinutos < 60) return `${diffMinutos} min atrás`
  if (diffHoras < 24) return `${diffHoras}h atrás`
  if (diffDias < 7) return `${diffDias}d atrás`
  
  return dataPost.toLocaleDateString('pt-BR')
}

module.exports = router
