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
 * Obtém informações públicas de um usuário específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const usuarios = await db.query(`
      SELECT 
        id,
        nome,
        curso,
        criado_em,
        (SELECT COUNT(*) FROM postagens WHERE usuario_id = usuarios.id) as total_postagens,
        (SELECT COUNT(*) FROM curtidas WHERE usuario_id = usuarios.id) as total_curtidas
      FROM usuarios 
      WHERE id = ?
    `, [id])

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      })
    }

    const usuario = usuarios[0]

    // Busca as postagens mais recentes do usuário
    const postagens = await db.query(`
      SELECT id, conteudo, tipo, criado_em
      FROM postagens
      WHERE usuario_id = ?
      ORDER BY criado_em DESC
      LIMIT 5
    `, [id])

    res.json({
      success: true,
      data: {
        id: usuario.id,
        nome: usuario.nome,
        curso: usuario.curso,
        membro_desde: usuario.criado_em,
        estatisticas: {
          total_postagens: parseInt(usuario.total_postagens),
          total_curtidas: parseInt(usuario.total_curtidas)
        },
        postagens_recentes: postagens
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
  body('nome').optional().notEmpty().withMessage('Nome não pode estar vazio'),
  body('curso').optional().notEmpty().withMessage('Curso não pode estar vazio'),
  body('telefone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido'),
  body('senha').optional().isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
], async (req, res) => {
  try {
    const { id } = req.params
    const { nome, curso, telefone, senha, senhaAtual } = req.body

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

    if (nome) {
      campos.push('nome = ?')
      valores.push(nome)
    }

    if (curso) {
      campos.push('curso = ?')
      valores.push(curso)
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
      `UPDATE usuarios SET ${campos.join(', ')}, atualizado_em = NOW() WHERE id = ?`,
      valores
    )

    console.log(`[ATUALIZAR USUÁRIO] Usuário ${id} atualizou perfil`)

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso!'
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
