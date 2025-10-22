/**
 * Rotas de Usuários do UniSafe
 * 
 * Este arquivo contém rotas relacionadas ao gerenciamento de usuários:
 * - GET /api/usuarios - Listar usuários (admin)
 * - GET /api/usuarios/:id - Obter perfil de usuário específico
 * - PUT /api/usuarios/:id - Atualizar dados do usuário
 * - DELETE /api/usuarios/:id - Deletar conta do usuário
 */

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const db = require('../config/database')
const { JWT_SECRET } = require('../config/env')
const { verificarAuth } = require('../middlewares/auth')
const logger = require('../config/logger')

const router = express.Router()

/**
 * GET /api/usuarios/verificar-email
 * Verifica se um email já está cadastrado no sistema
 */
router.get('/verificar-email', async (req, res) => {
  try {
    const { email } = req.query

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      })
    }

    // Verifica se o email existe no banco
    const resultado = await db.query(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    )

    res.json({
      success: true,
      existe: resultado.length > 0
    })

  } catch (error) {
    console.error('❌ [ERRO VERIFICAR EMAIL]', error.message)
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar email'
    })
  }
})

/**
 * GET /api/usuarios/verificar-username
 * Verifica se um nome de usuário já está em uso
 */
router.get('/verificar-username', async (req, res) => {
  try {
    const { username } = req.query

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário é obrigatório'
      })
    }

    // Validação de formato do username
    const usernameRegex = /^[a-z0-9._]+$/
    if (!usernameRegex.test(username.toLowerCase())) {
      return res.json({
        success: true,
        existe: false,
        valido: false,
        mensagem: 'Use apenas letras, números, pontos e sublinhados'
      })
    }

    if (username.length > 30) {
      return res.json({
        success: true,
        existe: false,
        valido: false,
        mensagem: 'Máximo de 30 caracteres'
      })
    }

    if (username.length < 3) {
      return res.json({
        success: true,
        existe: false,
        valido: false,
        mensagem: 'Mínimo de 3 caracteres'
      })
    }

    // Verifica se o username existe no banco (case insensitive)
    const resultado = await db.query(
      'SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [username]
    )

    res.json({
      success: true,
      existe: resultado.length > 0,
      valido: true,
      disponivel: resultado.length === 0
    })

  } catch (error) {
    console.error('❌ [ERRO VERIFICAR USERNAME]', error.message)
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar nome de usuário'
    })
  }
})

/**
 * GET /api/usuarios
 * Lista usuários da plataforma (para funcionalidades futuras)
 */
router.get('/', verificarAuth, async (req, res) => {
  try {
    const { limite = 20, pagina = 1, curso } = req.query

    let query = `
      SELECT 
        id,
        nome,
        curso,
        criado_em,
        (SELECT COUNT(*) FROM postagens WHERE usuario_id = usuarios.id AND ativo = 1) as total_postagens
      FROM usuarios
    `

    const params = []

    // Filtra por curso se especificado
    if (curso) {
      query += ' WHERE curso LIKE ?'
      params.push(`%${curso}%`)
    }

    query += ' ORDER BY criado_em DESC LIMIT ? OFFSET ?'

    const offset = (parseInt(pagina) - 1) * parseInt(limite)
    params.push(parseInt(limite), offset)

    const usuarios = await db.query(query, params)

    res.json({
      success: true,
      data: usuarios.map(user => ({
        id: user.id,
        nome: user.nome,
        curso: user.curso,
        membro_desde: user.criado_em,
        total_postagens: parseInt(user.total_postagens)
      })),
      meta: {
        pagina: parseInt(pagina),
        limite: parseInt(limite)
      }
    })

  } catch (error) {
    console.error('[ERRO LISTAR USUÁRIOS]', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar usuários'
    })
  }
})

/**
 * GET /api/usuarios/perfil/:username
 * Obtém perfil público de um usuário pelo username (não requer autenticação)
 */
router.get('/perfil/:username', async (req, res) => {
  try {
    const { username } = req.params
    console.log(`[${new Date().toISOString()}] GET /api/usuarios/perfil/${username}`)

    const usuarios = await db.query(`
      SELECT 
        id,
        nome,
        username,
        bio,
        foto_perfil,
        avatar_url,
        criado_em,
        (SELECT COUNT(*) FROM postagens WHERE usuario_id = usuarios.id AND ativo = 1) as total_postagens,
        (SELECT COUNT(*) FROM curtidas WHERE usuario_id = usuarios.id) as total_curtidas,
        (SELECT COUNT(*) FROM comentarios WHERE usuario_id = usuarios.id AND ativo = 1) as total_comentarios,
        (SELECT COUNT(*) FROM amigos WHERE (usuario_id = usuarios.id OR amigo_id = usuarios.id) AND status = 'aceito') as total_amigos
      FROM usuarios 
      WHERE LOWER(username) = LOWER(?) AND ativo = 1
    `, [username])

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
        username: usuario.username,
        bio: usuario.bio,
        avatar_url: usuario.foto_perfil || usuario.avatar_url,
        membro_desde: usuario.criado_em,
        estatisticas: {
          total_postagens: parseInt(usuario.total_postagens || 0),
          total_curtidas: parseInt(usuario.total_curtidas || 0),
          total_comentarios: parseInt(usuario.total_comentarios || 0),
          total_amigos: parseInt(usuario.total_amigos || 0)
        }
      }
    })

  } catch (error) {
    console.error('[ERRO OBTER PERFIL PÚBLICO]', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar perfil do usuário'
    })
  }
})

/**
 * GET /api/usuarios/:id
 * Obtém informações do usuário (próprio perfil se autenticado)
 */
router.get('/:id', verificarAuth, async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] GET /api/usuarios/${req.params.id}`)
    
    const { id } = req.params
    const usuarioLogadoId = req.usuario.id

    // Verifica se é o próprio usuário
    if (parseInt(id) !== usuarioLogadoId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você só pode ver seu próprio perfil'
      })
    }

    const usuarios = await db.query(`
      SELECT 
        id,
        nome,
        username,
        email,
        bio,
        avatar_url,
        foto_perfil,
        telefone,
        criado_em,
        (SELECT COUNT(*) FROM postagens WHERE usuario_id = usuarios.id AND ativo = 1) as total_postagens,
        (SELECT COUNT(*) FROM curtidas WHERE usuario_id = usuarios.id) as total_curtidas,
        (SELECT COUNT(*) FROM comentarios WHERE usuario_id = usuarios.id AND ativo = 1) as total_comentarios,
        (SELECT COUNT(*) FROM amigos WHERE (usuario_id = usuarios.id OR amigo_id = usuarios.id) AND status = 'aceito') as total_amigos
      FROM usuarios 
      WHERE id = ? AND ativo = 1
    `, [id])

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
        username: usuario.username,
        email: usuario.email,
        bio: usuario.bio,
        avatar_url: usuario.foto_perfil || usuario.avatar_url, // Prioriza foto_perfil (Google)
        foto_perfil: usuario.foto_perfil,
        telefone: usuario.telefone,
        membro_desde: usuario.criado_em,
        estatisticas: {
          total_postagens: parseInt(usuario.total_postagens || 0),
          total_curtidas: parseInt(usuario.total_curtidas || 0),
          total_comentarios: parseInt(usuario.total_comentarios || 0),
          total_amigos: parseInt(usuario.total_amigos || 0)
        }
      }
    })

  } catch (error) {
    console.error('[ERRO OBTER USUÁRIO]', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar dados do usuário'
    })
  }
})

/**
 * PUT /api/usuarios/:id
 * Atualiza os dados do usuário (apenas o próprio usuário)
 */
router.put('/:id', verificarAuth, [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nome deve ter entre 1 e 50 caracteres'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Nome de usuário deve ter entre 3 e 30 caracteres')
    .matches(/^[a-z0-9._]+$/)
    .withMessage('Nome de usuário pode conter apenas letras minúsculas, números, pontos e sublinhados'),
  body('bio')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bio deve ter no máximo 200 caracteres'),
  body('avatar_url')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || value.trim() === '') return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    })
    .withMessage('URL do avatar inválida'),
  body('telefone')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || value.trim() === '') return true
      // Aceita formatos mais flexíveis
      return /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(value) || /^\d{10,11}$/.test(value.replace(/\D/g, ''))
    })
    .withMessage('Telefone inválido'),
  body('senha')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
], async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] PUT /api/usuarios/${req.params.id}`)
    console.log('📝 [DEBUG] Body recebido:', req.body)
    
    const { id } = req.params
    const { nome, username, bio, avatar_url, telefone, senha, senhaAtual } = req.body

    // Verifica se é o próprio usuário
    if (parseInt(id) !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a editar este usuário'
      })
    }

    // Verifica se há erros de validação
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('❌ [DEBUG] Erros de validação:', errors.array())
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      })
    }

    // Se está tentando atualizar o username, verifica se já está em uso
    if (username !== undefined) {
      const usernameExistente = await db.query(
        'SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?) AND id != ?',
        [username.trim().toLowerCase(), id]
      )

      if (usernameExistente.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Nome de usuário já está em uso'
        })
      }
    }

    // Monta a query de atualização
    const campos = []
    const valores = []

    if (nome !== undefined) {
      campos.push('nome = ?')
      valores.push(nome.trim())
    }

    if (username !== undefined) {
      campos.push('username = ?')
      valores.push(username.trim().toLowerCase())
    }

    if (bio !== undefined) {
      campos.push('bio = ?')
      valores.push(bio.trim() || null)
    }

    if (avatar_url !== undefined) {
      campos.push('avatar_url = ?')
      valores.push(avatar_url || null)
    }

    if (telefone !== undefined) {
      campos.push('telefone = ?')
      valores.push(telefone || null)
    }

    // Se está alterando a senha, verifica a senha atual
    if (senha) {
      if (!senhaAtual) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual é obrigatória para alterar a senha'
        })
      }

      // Verifica a senha atual
      const usuario = await db.query('SELECT senha FROM usuarios WHERE id = ?', [id])
      if (usuario.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        })
      }

      const senhaValida = await bcrypt.compare(senhaAtual, usuario[0].senha)
      
      if (!senhaValida) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        })
      }

      const senhaHash = await bcrypt.hash(senha, 12)
      campos.push('senha = ?')
      valores.push(senhaHash)
    }

    if (campos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      })
    }

    valores.push(id)
    
    await db.query(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`,
      valores
    )

    console.log(`[ATUALIZAR USUÁRIO] Usuário ${id} atualizou perfil`)

    // Retorna os dados atualizados
    const usuarioAtualizado = await db.query(`
      SELECT id, nome, email, username, bio, avatar_url, telefone
      FROM usuarios 
      WHERE id = ?
    `, [id])

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      data: usuarioAtualizado[0]
    })

  } catch (error) {
    console.error('[ERRO ATUALIZAR USUÁRIO]', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil'
    })
  }
})

/**
 * DELETE /api/usuarios/:id
 * Deleta a conta do usuário (apenas o próprio usuário)
 */
router.delete('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params

    // Verifica se é o próprio usuário
    if (parseInt(id) !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a deletar este usuário'
      })
    }

    // Inicia uma transação para deletar todos os dados relacionados
    await db.query('START TRANSACTION')

    try {
      // Deleta curtidas do usuário
      await db.query('DELETE FROM curtidas WHERE usuario_id = ?', [id])
      
      // Deleta comentários do usuário
      await db.query('DELETE FROM comentarios WHERE usuario_id = ?', [id])
      
      // Deleta postagens do usuário (isso também deletará curtidas e comentários relacionados)
      await db.query('DELETE FROM postagens WHERE usuario_id = ?', [id])
      
      // Finalmente deleta o usuário
      await db.query('DELETE FROM usuarios WHERE id = ?', [id])

      await db.query('COMMIT')

      console.log(`[DELETAR USUÁRIO] Usuário ${id} deletou sua conta`)

      res.json({
        success: true,
        message: 'Conta deletada com sucesso!'
      })

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('[ERRO DELETAR USUÁRIO]', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar conta'
    })
  }
})

module.exports = router
