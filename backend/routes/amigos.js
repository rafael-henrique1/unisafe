/**
 * Rotas de Amizade do UniSafe
 * 
 * Sistema de amizade entre usuários permitindo:
 * - Enviar solicitações de amizade
 * - Aceitar ou recusar solicitações
 * - Listar amigos
 * - Remover amizades
 */

const express = require('express')
const db = require('../config/database')
const { verificarAuth } = require('../middlewares/auth')
const logger = require('../config/logger')

const router = express.Router()

// Socket.IO será passado via req.app.get('io')
const getIO = (req) => req.app.get('io')

/**
 * POST /api/amigos/enviar
 * Envia uma solicitação de amizade
 */
router.post('/enviar', verificarAuth, async (req, res) => {
  try {
    const { amigo_id } = req.body
    const usuario_id = req.usuario.id

    // Validações
    if (!amigo_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do amigo é obrigatório'
      })
    }

    if (usuario_id === parseInt(amigo_id)) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode adicionar a si mesmo como amigo'
      })
    }

    // Verifica se o usuário a ser adicionado existe
    const usuarioExiste = await db.query(
      'SELECT id FROM usuarios WHERE id = ?',
      [amigo_id]
    )

    if (usuarioExiste.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      })
    }

    // Verifica se já existe uma solicitação (em qualquer direção)
    const amizadeExistente = await db.query(
      `SELECT * FROM amigos 
       WHERE (usuario_id = ? AND amigo_id = ?) 
       OR (usuario_id = ? AND amigo_id = ?)`,
      [usuario_id, amigo_id, amigo_id, usuario_id]
    )

    if (amizadeExistente.length > 0) {
      const status = amizadeExistente[0].status
      if (status === 'aceito') {
        return res.status(400).json({
          success: false,
          message: 'Vocês já são amigos'
        })
      } else if (status === 'pendente') {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma solicitação de amizade pendente'
        })
      } else if (status === 'recusado') {
        // Permite reenviar se foi recusado
        await db.query(
          'UPDATE amigos SET status = ?, criado_em = CURRENT_TIMESTAMP WHERE id = ?',
          ['pendente', amizadeExistente[0].id]
        )
        
        logger.info(`Solicitação de amizade reenviada: ${usuario_id} -> ${amigo_id}`)
        
        return res.json({
          success: true,
          message: 'Solicitação de amizade enviada novamente',
          data: { id: amizadeExistente[0].id }
        })
      }
    }

    // Cria nova solicitação
    const resultado = await db.query(
      'INSERT INTO amigos (usuario_id, amigo_id, status) VALUES (?, ?, ?)',
      [usuario_id, amigo_id, 'pendente']
    )

    logger.info(`Nova solicitação de amizade: ${usuario_id} -> ${amigo_id}`)

    // Emite evento Socket.IO para o destinatário
    try {
      const io = getIO(req)
      const remetente = await db.query('SELECT nome FROM usuarios WHERE id = ?', [usuario_id])
      
      io.to(`user_${amigo_id}`).emit('nova_solicitacao_amizade', {
        solicitacao_id: resultado.insertId,
        remetente_id: usuario_id,
        remetente_nome: remetente[0]?.nome || 'Alguém',
        mensagem: `${remetente[0]?.nome || 'Alguém'} enviou uma solicitação de amizade`,
        timestamp: new Date().toISOString()
      })
      
      logger.info(`Notificação de amizade enviada via Socket.IO para usuário ${amigo_id}`)
    } catch (socketError) {
      logger.error('Erro ao emitir evento Socket.IO:', socketError)
      // Não falha a requisição se Socket.IO falhar
    }

    res.status(201).json({
      success: true,
      message: 'Solicitação de amizade enviada com sucesso',
      data: { id: resultado.insertId }
    })

  } catch (error) {
    logger.error('Erro ao enviar solicitação de amizade:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar solicitação de amizade'
    })
  }
})

/**
 * POST /api/amigos/aceitar
 * Aceita uma solicitação de amizade
 */
router.post('/aceitar', verificarAuth, async (req, res) => {
  try {
    const { solicitacao_id } = req.body
    const usuario_id = req.usuario.id

    if (!solicitacao_id) {
      return res.status(400).json({
        success: false,
        message: 'ID da solicitação é obrigatório'
      })
    }

    // Busca a solicitação
    const solicitacao = await db.query(
      'SELECT * FROM amigos WHERE id = ? AND amigo_id = ? AND status = ?',
      [solicitacao_id, usuario_id, 'pendente']
    )

    if (solicitacao.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada ou você não tem permissão'
      })
    }

    // Aceita a solicitação
    await db.query(
      'UPDATE amigos SET status = ? WHERE id = ?',
      ['aceito', solicitacao_id]
    )

    logger.info(`Amizade aceita: solicitação ${solicitacao_id}`)

    // Emite evento Socket.IO para quem enviou a solicitação
    try {
      const io = getIO(req)
      const aceitador = await db.query('SELECT nome FROM usuarios WHERE id = ?', [usuario_id])
      const remetenteId = solicitacao[0].usuario_id
      
      io.to(`user_${remetenteId}`).emit('amizade_aceita', {
        amigo_id: usuario_id,
        amigo_nome: aceitador[0]?.nome || 'Alguém',
        mensagem: `${aceitador[0]?.nome || 'Alguém'} aceitou sua solicitação de amizade`,
        timestamp: new Date().toISOString()
      })
      
      logger.info(`Notificação de amizade aceita enviada via Socket.IO para usuário ${remetenteId}`)
    } catch (socketError) {
      logger.error('Erro ao emitir evento Socket.IO:', socketError)
    }

    res.json({
      success: true,
      message: 'Solicitação de amizade aceita',
      data: { solicitacao_id }
    })

  } catch (error) {
    logger.error('Erro ao aceitar solicitação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao aceitar solicitação de amizade'
    })
  }
})

/**
 * POST /api/amigos/recusar
 * Recusa uma solicitação de amizade
 */
router.post('/recusar', verificarAuth, async (req, res) => {
  try {
    const { solicitacao_id } = req.body
    const usuario_id = req.usuario.id

    if (!solicitacao_id) {
      return res.status(400).json({
        success: false,
        message: 'ID da solicitação é obrigatório'
      })
    }

    // Busca a solicitação
    const solicitacao = await db.query(
      'SELECT * FROM amigos WHERE id = ? AND amigo_id = ? AND status = ?',
      [solicitacao_id, usuario_id, 'pendente']
    )

    if (solicitacao.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada ou você não tem permissão'
      })
    }

    // Recusa a solicitação
    await db.query(
      'UPDATE amigos SET status = ? WHERE id = ?',
      ['recusado', solicitacao_id]
    )

    logger.info(`Amizade recusada: solicitação ${solicitacao_id}`)

    res.json({
      success: true,
      message: 'Solicitação de amizade recusada',
      data: { solicitacao_id }
    })

  } catch (error) {
    logger.error('Erro ao recusar solicitação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao recusar solicitação de amizade'
    })
  }
})

/**
 * GET /api/amigos/lista/:id
 * Lista os amigos de um usuário
 */
router.get('/lista/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params

    // Busca amigos aceitos (bidirecional)
    const amigos = await db.query(
      `SELECT 
        u.id,
        u.nome,
        u.email,
        u.foto_perfil,
        u.bio,
        a.criado_em as amigos_desde
      FROM amigos a
      INNER JOIN usuarios u ON (
        CASE 
          WHEN a.usuario_id = ? THEN u.id = a.amigo_id
          ELSE u.id = a.usuario_id
        END
      )
      WHERE (a.usuario_id = ? OR a.amigo_id = ?)
      AND a.status = 'aceito'
      ORDER BY u.nome ASC`,
      [id, id, id]
    )

    res.json({
      success: true,
      data: amigos,
      total: amigos.length
    })

  } catch (error) {
    logger.error('Erro ao listar amigos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar amigos'
    })
  }
})

/**
 * GET /api/amigos/pedidos
 * Lista solicitações de amizade pendentes recebidas pelo usuário logado
 */
router.get('/pedidos', verificarAuth, async (req, res) => {
  try {
    const usuario_id = req.usuario.id

    // Busca solicitações pendentes recebidas
    const pedidos = await db.query(
      `SELECT 
        a.id as solicitacao_id,
        a.criado_em,
        u.id as usuario_id,
        u.nome,
        u.email,
        u.foto_perfil,
        u.bio
      FROM amigos a
      INNER JOIN usuarios u ON u.id = a.usuario_id
      WHERE a.amigo_id = ? AND a.status = 'pendente'
      ORDER BY a.criado_em DESC`,
      [usuario_id]
    )

    res.json({
      success: true,
      data: pedidos,
      total: pedidos.length
    })

  } catch (error) {
    logger.error('Erro ao listar pedidos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar pedidos de amizade'
    })
  }
})

/**
 * DELETE /api/amigos/remover/:id
 * Remove uma amizade
 */
router.delete('/remover/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params // ID do amigo a ser removido
    const usuario_id = req.usuario.id

    // Remove amizade (bidirecional)
    const resultado = await db.query(
      `DELETE FROM amigos 
       WHERE ((usuario_id = ? AND amigo_id = ?) OR (usuario_id = ? AND amigo_id = ?))
       AND status = 'aceito'`,
      [usuario_id, id, id, usuario_id]
    )

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Amizade não encontrada'
      })
    }

    logger.info(`Amizade removida entre ${usuario_id} e ${id}`)

    res.json({
      success: true,
      message: 'Amizade removida com sucesso'
    })

  } catch (error) {
    logger.error('Erro ao remover amizade:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao remover amizade'
    })
  }
})

/**
 * GET /api/amigos/status/:id
 * Verifica o status de amizade com um usuário específico
 */
router.get('/status/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params // ID do outro usuário
    const usuario_id = req.usuario.id

    if (usuario_id === parseInt(id)) {
      return res.json({
        success: true,
        data: { status: 'proprio_usuario' }
      })
    }

    // Verifica se existe amizade (em qualquer direção)
    const amizade = await db.query(
      `SELECT * FROM amigos 
       WHERE (usuario_id = ? AND amigo_id = ?) OR (usuario_id = ? AND amigo_id = ?)`,
      [usuario_id, id, id, usuario_id]
    )

    if (amizade.length === 0) {
      return res.json({
        success: true,
        data: { 
          status: 'nao_amigo',
          pode_enviar: true
        }
      })
    }

    const registro = amizade[0]
    const enviada_por_mim = registro.usuario_id === usuario_id

    res.json({
      success: true,
      data: {
        status: registro.status,
        solicitacao_id: registro.id,
        enviada_por_mim,
        pode_aceitar: !enviada_por_mim && registro.status === 'pendente'
      }
    })

  } catch (error) {
    logger.error('Erro ao verificar status de amizade:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status de amizade'
    })
  }
})

module.exports = router
