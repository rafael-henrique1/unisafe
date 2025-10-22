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
 * 
 * Integração Socket.IO para notificações em tempo real
 */

const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const db = require('../config/database')
const { JWT_SECRET } = require('../config/env')
const { emitirNovaPostagem, emitirNovaCurtida, emitirNovoComentario } = require('../config/socket')
const { verificarAuth, verificarAuthOpcional } = require('../middlewares/auth')
const logger = require('../config/logger')

const router = express.Router()

// ✅ Função helper para obter io de forma dinâmica (evita circular dependency)
const getIO = () => {
  return require('../server').io
}

/**
 * GET /api/postagens
 * Lista todas as postagens do feed (ordenadas por data)
 * ✅ OTIMIZADO - Query única com JOINs (61 queries → 1 query)
 */
router.get('/', async (req, res) => {
  try {
    console.log('[LISTAR POSTAGENS] Recebendo requisição...')
    const { limite = 20, pagina = 1, tipo } = req.query
    
    // Verifica se há usuário autenticado
    const token = req.headers.authorization?.replace('Bearer ', '')
    let usuarioLogadoId = null
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        usuarioLogadoId = decoded.id
        console.log(`[LISTAR POSTAGENS] Usuário autenticado ID: ${usuarioLogadoId}`)
      } catch (error) {
        console.log('[LISTAR POSTAGENS] Token inválido, continuando sem autenticação')
      }
    }

    const params = []
    
    const limite_int = parseInt(limite) || 20
    const pagina_int = parseInt(pagina) || 1
    const offset = (pagina_int - 1) * limite_int
    
    // Valida valores
    if (limite_int < 1 || limite_int > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limite deve estar entre 1 e 100'
      })
    }
    
    // 🚀 QUERY OTIMIZADA - 1 única query com JOINs
    let query = `
      SELECT 
        p.id,
        p.titulo,
        p.conteudo,
        p.categoria as tipo,
        p.localizacao,
        p.criado_em,
        u.nome as usuario_nome,
        u.username as usuario_username,
        COUNT(DISTINCT cur.id) as total_curtidas,
        COUNT(DISTINCT com.id) as total_comentarios,
        MAX(CASE WHEN cur.usuario_id = ? THEN 1 ELSE 0 END) as usuario_curtiu
      FROM postagens p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN curtidas cur ON p.id = cur.postagem_id
      LEFT JOIN comentarios com ON p.id = com.postagem_id AND com.ativo = 1
      WHERE p.ativo = 1
    `

    // Adiciona ID do usuário logado como primeiro parâmetro
    params.push(usuarioLogadoId || 0)

    // Filtra por categoria se especificado
    if (tipo) {
      query += ' AND p.categoria = ?'
      params.push(tipo)
    }
    
    query += ` 
      GROUP BY p.id, p.titulo, p.conteudo, p.categoria, p.localizacao, p.criado_em, u.nome, u.username
      ORDER BY p.criado_em DESC 
      LIMIT ${limite_int} OFFSET ${offset}
    `

    console.log(`[LISTAR POSTAGENS] ✅ Executando query OTIMIZADA - Limite: ${limite_int}, Offset: ${offset}`)
    const postagens = await db.query(query, params)
    console.log(`[LISTAR POSTAGENS] ${postagens.length} postagens encontradas em 1 query única! 🚀`)

    // Formata as postagens para o frontend
    const postagensFormatadas = postagens.map(postagem => ({
      id: postagem.id,
      titulo: postagem.titulo,
      conteudo: postagem.conteudo,
      tipo: postagem.tipo,
      localizacao: postagem.localizacao,
      usuario: postagem.usuario_nome,
      username: postagem.usuario_username,
      data: formatarData(postagem.criado_em),
      curtidas: parseInt(postagem.total_curtidas) || 0,
      comentarios: parseInt(postagem.total_comentarios) || 0,
      usuarioCurtiu: Boolean(postagem.usuario_curtiu)
    }))

    console.log(`✅ [LISTAR POSTAGENS] Retornando ${postagensFormatadas.length} postagens formatadas`)

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
    logger.error('Erro ao listar postagens', {
      message: error.message,
      stack: error.stack,
      query: { 
        limite: req.query.limite || 20, 
        pagina: req.query.pagina || 1, 
        tipo: req.query.tipo 
      }
    })
    console.error('❌ [ERRO LISTAR POSTAGENS]', error.message)
    console.error('Stack:', error.stack)
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

    console.log(`[CRIAR POSTAGEM] Usuário ID ${usuarioId} criando postagem tipo: ${tipo}`)

    // Insere a nova postagem
    const resultado = await db.query(
      'INSERT INTO postagens (usuario_id, titulo, conteudo, categoria) VALUES (?, ?, ?, ?)',
      [usuarioId, conteudo.substring(0, 50) + '...', conteudo, tipo]
    )

    console.log(`✅ [CRIAR POSTAGEM] Postagem criada - ID: ${resultado.lastID}, Tipo: ${tipo}`)

    // Emite evento Socket.IO para notificar todos os usuários conectados
    emitirNovaPostagem(getIO(), {
      id: resultado.lastID,
      usuario: req.usuario.nome,
      usuario_id: usuarioId, // ✅ Adicionado para evitar auto-notificação
      conteudo,
      tipo,
      criado_em: new Date().toISOString()
    })

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
    console.error('❌ [ERRO CRIAR POSTAGEM]', error.message)
    console.error('Stack:', error.stack)
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

    console.log(`[CURTIR] Usuário ID ${usuarioId} tentando curtir postagem ID ${id}`)

    // Verifica se a postagem existe e busca o autor
    const postagens = await db.query('SELECT id, usuario_id FROM postagens WHERE id = ?', [id])
    if (postagens.length === 0) {
      console.log(`[CURTIR] Postagem ID ${id} não encontrada`)
      return res.status(404).json({
        success: false,
        message: 'Postagem não encontrada'
      })
    }

    const autorPostagemId = postagens[0].usuario_id

    // Verifica se o usuário já curtiu
    const curtidaExistente = await db.query(
      'SELECT id FROM curtidas WHERE postagem_id = ? AND usuario_id = ?',
      [id, usuarioId]
    )

    if (curtidaExistente.length > 0) {
      // Remove a curtida
      await db.query('DELETE FROM curtidas WHERE postagem_id = ? AND usuario_id = ?', [id, usuarioId])
      
      // Busca total DEPOIS de remover
      const totalCurtidasResult = await db.query(
        'SELECT COUNT(*) as total FROM curtidas WHERE postagem_id = ?',
        [id]
      )
      const totalCurtidas = totalCurtidasResult[0].total
      
      console.log(`[CURTIR] ❌ Curtida removida - Total agora: ${totalCurtidas}`)
      
      res.json({
        success: true,
        message: 'Curtida removida',
        action: 'removed',
        totalCurtidas
      })
    } else {
      // Adiciona a curtida
      await db.query(
        'INSERT INTO curtidas (postagem_id, usuario_id, criado_em) VALUES (?, ?, NOW())',
        [id, usuarioId]
      )
      
      // Busca total DEPOIS de adicionar
      const totalCurtidasResult = await db.query(
        'SELECT COUNT(*) as total FROM curtidas WHERE postagem_id = ?',
        [id]
      )
      const totalCurtidas = totalCurtidasResult[0].total
      
      console.log(`[CURTIR] ✅ Curtida adicionada - Total agora: ${totalCurtidas}`)
      
      // Emite notificação privada para o autor (se não for ele mesmo)
      const ioInstance = getIO()
      emitirNovaCurtida(ioInstance, {
        postagemId: id,
        usuarioId,
        autorPostagemId,
        nomeUsuario: req.usuario.nome
      })
      
      res.json({
        success: true,
        message: 'Postagem curtida',
        action: 'added',
        totalCurtidas
      })
    }

  } catch (error) {
    console.error('❌ [ERRO CURTIR POSTAGEM]', error.message)
    console.error('Stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erro ao processar curtida'
    })
  }
})

/**
 * POST /api/postagens/:id/comentarios
 * Adiciona um comentário a uma postagem
 */
router.post('/:id/comentarios', verificarAuth, [
  body('conteudo')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comentário deve ter entre 1 e 500 caracteres')
], async (req, res) => {
  try {
    const { id } = req.params
    const { conteudo } = req.body
    const usuarioId = req.usuario.id

    console.log(`[COMENTAR] Usuário ID ${usuarioId} comentando na postagem ID ${id}`)

    // Verifica erros de validação
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log(`[COMENTAR] Validação falhou:`, errors.array())
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      })
    }

    // Verifica se a postagem existe e busca o autor
    const postagens = await db.query('SELECT id, usuario_id FROM postagens WHERE id = ?', [id])
    if (postagens.length === 0) {
      console.log(`[COMENTAR] Postagem ID ${id} não encontrada`)
      return res.status(404).json({
        success: false,
        message: 'Postagem não encontrada'
      })
    }

    const autorPostagemId = postagens[0].usuario_id

    // Insere o comentário
    const resultado = await db.query(
      'INSERT INTO comentarios (postagem_id, usuario_id, conteudo, criado_em) VALUES (?, ?, ?, NOW())',
      [id, usuarioId, conteudo]
    )

    console.log(`✅ [COMENTAR] Comentário inserido - ID: ${resultado.lastID}`)

    // Busca o comentário criado com dados do usuário
    const novoComentario = await db.query(`
      SELECT 
        c.id,
        c.conteudo,
        c.criado_em,
        u.nome as usuario_nome,
        u.username as usuario_username
      FROM comentarios c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ?
    `, [resultado.lastID])

    console.log(`✅ [COMENTAR] Comentário completo criado com sucesso`)

    // Debug: Verifica se getIO() retorna io válido
    const ioInstance = getIO()
    console.log('[DEBUG] getIO():', ioInstance ? 'OK' : 'UNDEFINED')
    console.log('[DEBUG] Chamando emitirNovoComentario...')
    
    // Emite evento Socket.IO de novo comentário
    emitirNovoComentario(ioInstance, {
      comentarioId: novoComentario[0].id, // ID do comentário criado
      postagemId: id,
      usuarioId,
      autorPostagemId,
      nomeUsuario: req.usuario.nome,
      username: req.usuario.username,
      conteudo: novoComentario[0].conteudo
    })
    
    console.log('[DEBUG] emitirNovoComentario chamado')

    res.status(201).json({
      success: true,
      message: 'Comentário adicionado com sucesso',
      data: {
        id: novoComentario[0].id,
        conteudo: novoComentario[0].conteudo,
        usuario: novoComentario[0].usuario_nome,
        username: novoComentario[0].usuario_username,
        data: formatarData(novoComentario[0].criado_em)
      }
    })

  } catch (error) {
    console.error('❌ [ERRO ADICIONAR COMENTARIO]', error.message)
    console.error('Stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar comentário'
    })
  }
})

/**
 * GET /api/postagens/:id/comentarios
 * Lista comentários de uma postagem
 */
router.get('/:id/comentarios', async (req, res) => {
  try {
    const { id } = req.params
    const pagina = parseInt(req.query.pagina) || 1
    const limite = parseInt(req.query.limite) || 20

    console.log(`[LISTAR COMENTARIOS] Postagem ID: ${id}, Página: ${pagina}, Limite: ${limite}`)

    // Verifica se a postagem existe
    const postagens = await db.query('SELECT id FROM postagens WHERE id = ?', [id])
    if (postagens.length === 0) {
      console.log(`[LISTAR COMENTARIOS] Postagem ID ${id} não encontrada`)
      return res.status(404).json({
        success: false,
        message: 'Postagem não encontrada'
      })
    }

    // Busca os comentários
    const limite_int = parseInt(limite)
    const pagina_int = parseInt(pagina)
    const offset = (pagina_int - 1) * limite_int
    const id_int = parseInt(id)
    
    console.log(`[LISTAR COMENTARIOS] Buscando comentários - Limite: ${limite_int}, Offset: ${offset}`)
    const comentarios = await db.query(`
      SELECT 
        c.id,
        c.conteudo,
        c.criado_em,
        u.nome as usuario_nome,
        u.username as usuario_username
      FROM comentarios c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.postagem_id = ${id_int} AND c.ativo = 1
      ORDER BY c.criado_em ASC
      LIMIT ${limite_int} OFFSET ${offset}
    `)

    console.log(`[LISTAR COMENTARIOS] ${comentarios.length} comentários encontrados`)

    // Conta total de comentários
    const totalResult = await db.query(
      `SELECT COUNT(*) as total FROM comentarios WHERE postagem_id = ${id_int} AND ativo = 1`
    )
    const total = totalResult[0].total

    console.log(`✅ [LISTAR COMENTARIOS] Total de ${total} comentários na postagem`)

    res.json({
      success: true,
      data: comentarios.map(c => ({
        id: c.id,
        conteudo: c.conteudo,
        usuario: c.usuario_nome,
        username: c.usuario_username,
        data: formatarData(c.criado_em)
      })),
      pagination: {
        pagina: pagina_int,
        limite: limite_int,
        total,
        totalPaginas: Math.ceil(total / limite_int)
      }
    })

  } catch (error) {
    console.error('❌ [ERRO LISTAR COMENTARIOS]', error.message)
    console.error('Stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar comentários'
    })
  }
})

/**
 * DELETE /api/postagens/:id/comentarios/:comentarioId
 * Exclui um comentário (soft delete)
 */
router.delete('/:id/comentarios/:comentarioId', verificarAuth, async (req, res) => {
  try {
    const { id, comentarioId } = req.params
    const usuarioId = req.usuario.id

    console.log(`[EXCLUIR COMENTARIO] Usuário ID ${usuarioId} tentando excluir comentário ID ${comentarioId}`)

    // Verifica se o comentário existe e se pertence ao usuário
    const comentarios = await db.query(
      'SELECT id, usuario_id, postagem_id FROM comentarios WHERE id = ? AND ativo = 1',
      [comentarioId]
    )

    if (comentarios.length === 0) {
      console.log(`[EXCLUIR COMENTARIO] Comentário ID ${comentarioId} não encontrado`)
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      })
    }

    const comentario = comentarios[0]

    // Verifica se o usuário é o autor do comentário
    if (comentario.usuario_id !== usuarioId) {
      console.log(`[EXCLUIR COMENTARIO] Usuário ${usuarioId} não é o autor do comentário ${comentarioId}`)
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para excluir este comentário'
      })
    }

    // Soft delete: marca como inativo
    await db.query(
      'UPDATE comentarios SET ativo = 0 WHERE id = ?',
      [comentarioId]
    )

    console.log(`✅ [EXCLUIR COMENTARIO] Comentário ${comentarioId} excluído com sucesso`)

    // Busca total de comentários DEPOIS da exclusão
    const totalResult = await db.query(
      'SELECT COUNT(*) as total FROM comentarios WHERE postagem_id = ? AND ativo = 1',
      [id]
    )
    const totalComentarios = totalResult[0].total

    console.log(`[EXCLUIR COMENTARIO] Total de comentários agora: ${totalComentarios}`)

    // Emite evento Socket.IO para atualizar contador em tempo real
    const ioInstance = getIO()
    if (ioInstance) {
      ioInstance.emit('comentario_excluido', {
        postagemId: parseInt(id),
        comentarioId: parseInt(comentarioId),
        usuarioId,
        totalComentarios
      })
      console.log(`[EXCLUIR COMENTARIO] Evento Socket.IO emitido`)
    }

    res.json({
      success: true,
      message: 'Comentário excluído com sucesso',
      totalComentarios
    })

  } catch (error) {
    console.error('❌ [ERRO EXCLUIR COMENTARIO]', error.message)
    console.error('Stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir comentário'
    })
  }
})

/**
 * DELETE /api/postagens/:id
 * Exclui uma postagem (soft delete)
 */
router.delete('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params
    const usuarioId = req.usuario.id

    console.log(`[EXCLUIR POSTAGEM] Usuário ID ${usuarioId} tentando excluir postagem ID ${id}`)

    // Verifica se a postagem existe e se pertence ao usuário
    const postagens = await db.query(
      'SELECT id, usuario_id FROM postagens WHERE id = ? AND ativo = 1',
      [id]
    )

    if (postagens.length === 0) {
      console.log(`[EXCLUIR POSTAGEM] Postagem ID ${id} não encontrada`)
      return res.status(404).json({
        success: false,
        message: 'Postagem não encontrada'
      })
    }

    const postagem = postagens[0]

    // Verifica se o usuário é o autor da postagem
    if (postagem.usuario_id !== usuarioId) {
      console.log(`[EXCLUIR POSTAGEM] Usuário ${usuarioId} não é o autor da postagem ${id}`)
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para excluir esta postagem'
      })
    }

    // Soft delete: marca como inativo
    await db.query(
      'UPDATE postagens SET ativo = 0 WHERE id = ?',
      [id]
    )

    console.log(`✅ [EXCLUIR POSTAGEM] Postagem ${id} excluída com sucesso`)

    // Emite evento Socket.IO para remover da lista em tempo real
    const ioInstance = getIO()
    if (ioInstance) {
      ioInstance.emit('postagem_excluida', {
        postagemId: parseInt(id),
        usuarioId
      })
      console.log(`[EXCLUIR POSTAGEM] Evento Socket.IO emitido`)
    }

    res.json({
      success: true,
      message: 'Postagem excluída com sucesso'
    })

  } catch (error) {
    console.error('❌ [ERRO EXCLUIR POSTAGEM]', error.message)
    console.error('Stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir postagem'
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
