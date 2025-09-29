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
        (SELECT COUNT(*) FROM postagens WHERE usuario_id = usuarios.id) as total_postagens
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
        email,
        bio,
        avatar_url,
        telefone,
        criado_em,
        (SELECT COUNT(*) FROM postagens WHERE usuario_id = usuarios.id AND ativo = 1) as total_postagens,
        (SELECT COUNT(*) FROM curtidas WHERE usuario_id = usuarios.id) as total_curtidas,
        (SELECT COUNT(*) FROM comentarios WHERE usuario_id = usuarios.id AND ativo = 1) as total_comentarios
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
        email: usuario.email,
        bio: usuario.bio,
        avatar_url: usuario.avatar_url,
        telefone: usuario.telefone,
        membro_desde: usuario.criado_em,
        estatisticas: {
          total_postagens: parseInt(usuario.total_postagens || 0),
          total_curtidas: parseInt(usuario.total_curtidas || 0),
          total_comentarios: parseInt(usuario.total_comentarios || 0)
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
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bio deve ter no máximo 200 caracteres'),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('URL do avatar inválida'),
  body('telefone')
    .optional()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX'),
  body('senha')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
], async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] PUT /api/usuarios/${req.params.id}`)
    
    const { id } = req.params
    const { nome, bio, avatar_url, telefone, senha, senhaAtual } = req.body

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
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      })
    }

    // Monta a query de atualização
    const campos = []
    const valores = []

    if (nome !== undefined) {
      campos.push('nome = ?')
      valores.push(nome.trim())
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
      SELECT id, nome, email, bio, avatar_url, telefone
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
