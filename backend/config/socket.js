/**
 * ============================================================================
 * SOCKET.IO - CONFIGURAÇÃO DE NOTIFICAÇÕES EM TEMPO REAL
 * ============================================================================
 * 
 * ARQUITETURA:
 * 1. Autenticação JWT obrigatória no handshake
 * 2. Cada usuário conecta em uma sala privada: `user_{userId}`
 * 3. Eventos broadcast: nova_postagem (todos veem)
 * 4. Eventos direcionados: notificações pessoais (apenas autor da postagem)
 * 
 * EVENTOS IMPLEMENTADOS:
 * - nova_postagem: Broadcast para todos (nova postagem no feed)
 * - nova_curtida: Broadcast + notificação privada (só se autor != quem curtiu)
 * - novo_comentario: Broadcast + notificação privada (só se autor != quem comentou)
 * 
 * SEGURANÇA:
 * - Token JWT validado ANTES de aceitar conexão
 * - Notificações salvas no DB para histórico
 * - Salas isoladas previnem vazamento de dados
 */

const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('./env')
const db = require('./database')

// Map para rastrear conexões ativas (userId -> socketId)
const usuariosConectados = new Map()

/**
 * ============================================================================
 * SETUP PRINCIPAL DO SOCKET.IO
 * ============================================================================
 */
function setupSocket(io) {
  
  // ========================================
  // MIDDLEWARE: Autenticação JWT
  // ========================================
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token
      
      if (!token) {
        console.log('[SOCKET] ❌ Conexão rejeitada: Token ausente')
        return next(new Error('Token de autenticação necessário'))
      }
      
      // Verifica e decodifica o token JWT
      const decoded = jwt.verify(token, JWT_SECRET)
      
      // Armazena dados do usuário autenticado no socket
      socket.userId = decoded.id
      socket.userName = decoded.nome
      socket.userEmail = decoded.email
      
      console.log(`[SOCKET] ✅ Token validado - Usuário: ${decoded.nome} (ID: ${decoded.id})`)
      next()
      
    } catch (error) {
      console.log(`[SOCKET] ❌ Token inválido: ${error.message}`)
      next(new Error('Token inválido ou expirado'))
    }
  })
  
  // ========================================
  // EVENTO: Conexão estabelecida
  // ========================================
  io.on('connection', (socket) => {
    const { userId, userName } = socket
    
    console.log(`\n[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`[SOCKET] 🔌 CONECTADO: ${userName}`)
    console.log(`[SOCKET] 📍 User ID: ${userId}`)
    console.log(`[SOCKET] 🆔 Socket ID: ${socket.id}`)
    console.log(`[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    // Adiciona usuário à sala privada
    const salaPrivada = `user_${userId}`
    socket.join(salaPrivada)
    console.log(`[SOCKET] 🏠 Usuário ${userName} entrou na sala: ${salaPrivada}`)
    
    // Registra conexão ativa
    usuariosConectados.set(userId, socket.id)
    
    // Envia confirmação ao cliente
    socket.emit('connected', {
      success: true,
      message: `Conectado ao UniSafe como ${userName}`,
      userId,
      userName,
      timestamp: new Date().toISOString()
    })
    
    // Envia total de notificações não lidas
    enviarTotalNaoLidas(socket, userId)
    
    // ========================================
    // EVENTO: Cliente solicita notificações
    // ========================================
    socket.on('solicitar_notificacoes', async () => {
      try {
        console.log(`[SOCKET] 📬 ${userName} solicitou lista de notificações`)
        
        const notificacoes = await db.query(`
          SELECT 
            n.id,
            n.tipo,
            n.mensagem,
            n.lida,
            n.postagem_id,
            n.criada_em,
            u.nome as remetente_nome
          FROM notificacoes n
          LEFT JOIN usuarios u ON n.remetente_id = u.id
          WHERE n.usuario_id = ?
          ORDER BY n.criada_em DESC
          LIMIT 50
        `, [userId])
        
        socket.emit('lista_notificacoes', notificacoes)
        console.log(`[SOCKET] ✅ Enviadas ${notificacoes.length} notificações para ${userName}`)
        
      } catch (error) {
        console.error('[SOCKET] ❌ Erro ao buscar notificações:', error)
        socket.emit('erro', { mensagem: 'Erro ao carregar notificações' })
      }
    })
    
    // ========================================
    // EVENTO: Marcar notificação como lida
    // ========================================
    socket.on('marcar_lida', async (notificacaoId) => {
      try {
        await db.query(
          'UPDATE notificacoes SET lida = TRUE WHERE id = ? AND usuario_id = ?',
          [notificacaoId, userId]
        )
        console.log(`[SOCKET] ✅ Notificação ${notificacaoId} marcada como lida por ${userName}`)
        
        // Atualiza total de não lidas
        enviarTotalNaoLidas(socket, userId)
        
      } catch (error) {
        console.error('[SOCKET] ❌ Erro ao marcar como lida:', error)
      }
    })
    
    // ========================================
    // EVENTO: Marcar TODAS como lidas
    // ========================================
    socket.on('marcar_todas_lidas', async () => {
      try {
        await db.query(
          'UPDATE notificacoes SET lida = TRUE WHERE usuario_id = ?',
          [userId]
        )
        console.log(`[SOCKET] ✅ Todas notificações de ${userName} marcadas como lidas`)
        
        socket.emit('total_nao_lidas', 0)
        
      } catch (error) {
        console.error('[SOCKET] ❌ Erro ao marcar todas como lidas:', error)
      }
    })
    
    // ========================================
    // EVENTO: Desconexão
    // ========================================
    socket.on('disconnect', () => {
      usuariosConectados.delete(userId)
      console.log(`\n[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`[SOCKET] 🔌 DESCONECTADO: ${userName}`)
      console.log(`[SOCKET] 📍 User ID: ${userId}`)
      console.log(`[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    })
  })
  
  console.log('[SOCKET] ✅ Socket.IO configurado com sucesso\n')
}

/**
 * ============================================================================
 * HELPER: Envia total de notificações não lidas
 * ============================================================================
 */
async function enviarTotalNaoLidas(socket, userId) {
  try {
    const resultado = await db.query(`
      SELECT COUNT(*) as total 
      FROM notificacoes 
      WHERE usuario_id = ? AND lida = FALSE
    `, [userId])
    
    const total = resultado[0].total
    socket.emit('total_nao_lidas', total)
    console.log(`[SOCKET] 📊 Usuário ID ${userId} tem ${total} notificações não lidas`)
    
  } catch (error) {
    console.error('[SOCKET] ❌ Erro ao contar notificações:', error)
  }
}

/**
 * ============================================================================
 * EMITIR: Nova Postagem (Broadcast para TODOS)
 * ============================================================================
 */
async function emitirNovaPostagem(io, postagem) {
  try {
    console.log(`\n[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`[SOCKET] 📢 NOVA POSTAGEM`)
    console.log(`[SOCKET] ID: ${postagem.id}`)
    console.log(`[SOCKET] Autor: ${postagem.usuario}`)
    console.log(`[SOCKET] Tipo: ${postagem.tipo}`)
    console.log(`[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    // Broadcast para TODOS os clientes conectados
    io.emit('nova_postagem', {
      id: postagem.id,
      usuario: postagem.usuario,
      usuario_id: postagem.usuario_id, // Adicionado para identificação
      conteudo: postagem.conteudo,
      tipo: postagem.tipo,
      criado_em: postagem.criado_em
    })
    
  } catch (error) {
    console.error('[SOCKET] ❌ Erro ao emitir nova_postagem:', error)
  }
}

/**
 * ============================================================================
 * EMITIR: Nova Curtida (Broadcast + Notificação Privada)
 * ============================================================================
 */
async function emitirNovaCurtida(io, curtida) {
  try {
    const { postagemId, usuarioId, autorPostagemId, nomeUsuario } = curtida
    
    console.log(`\n[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`[SOCKET] ❤️  NOVA CURTIDA`)
    console.log(`[SOCKET] Postagem ID: ${postagemId}`)
    console.log(`[SOCKET] Quem curtiu: ${nomeUsuario} (ID: ${usuarioId})`)
    console.log(`[SOCKET] Autor da postagem ID: ${autorPostagemId}`)
    
    // VALIDAÇÃO CRÍTICA: Só notifica se autor ≠ quem curtiu
    if (autorPostagemId && autorPostagemId !== usuarioId) {
      console.log(`[SOCKET] ✅ Autor é diferente! Enviando notificação...`)
      
      // 1. Salva notificação no banco de dados COM postagem_id
      await db.query(`
        INSERT INTO notificacoes (usuario_id, remetente_id, postagem_id, tipo, mensagem)
        VALUES (?, ?, ?, 'curtida', ?)
      `, [autorPostagemId, usuarioId, postagemId, `${nomeUsuario} curtiu sua postagem`])
      
      // 2. Envia notificação APENAS para o autor (sala privada)
      const salaAutor = `user_${autorPostagemId}`
      io.to(salaAutor).emit('notificacao', {
        tipo: 'curtida',
        mensagem: `${nomeUsuario} curtiu sua postagem`,
        postagemId,
        remetente: nomeUsuario,
        remetenteId: usuarioId,
        timestamp: new Date().toISOString()
      })
      
      console.log(`[SOCKET] 🔔 Notificação enviada para sala: ${salaAutor}`)
      
    } else {
      console.log(`[SOCKET] ⏭️  Autor curtou própria postagem - SEM notificação`)
    }
    
    console.log(`[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    // O broadcast é feito em postagens.js com totalCurtidas e acao
    
  } catch (error) {
    console.error('[SOCKET] ❌ Erro ao emitir nova_curtida:', error)
  }
}

/**
 * ============================================================================
 * EMITIR: Novo Comentário (Broadcast + Notificação Privada)
 * ============================================================================
 */
async function emitirNovoComentario(io, comentario) {
  try {
    const { comentarioId, postagemId, usuarioId, autorPostagemId, nomeUsuario, username, conteudo } = comentario
    
    console.log(`\n[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`[SOCKET] 💬 NOVO COMENTÁRIO`)
    console.log(`[SOCKET] Comentário ID: ${comentarioId}`)
    console.log(`[SOCKET] Postagem ID: ${postagemId}`)
    console.log(`[SOCKET] Quem comentou: ${nomeUsuario} (ID: ${usuarioId})`)
    console.log(`[SOCKET] Username: @${username || 'sem username'}`)
    console.log(`[SOCKET] Autor da postagem ID: ${autorPostagemId}`)
    console.log(`[SOCKET] Comentário: ${conteudo.substring(0, 50)}...`)
    
    // VALIDAÇÃO CRÍTICA: Só notifica se autor ≠ quem comentou
    if (autorPostagemId && autorPostagemId !== usuarioId) {
      console.log(`[SOCKET] ✅ Autor é diferente! Enviando notificação...`)
      
      // 1. Salva notificação no banco de dados COM postagem_id
      await db.query(`
        INSERT INTO notificacoes (usuario_id, remetente_id, postagem_id, tipo, mensagem)
        VALUES (?, ?, ?, 'comentario', ?)
      `, [autorPostagemId, usuarioId, postagemId, `${nomeUsuario} comentou em sua postagem`])
      
      // 2. Envia notificação APENAS para o autor (sala privada)
      const salaAutor = `user_${autorPostagemId}`
      io.to(salaAutor).emit('notificacao', {
        tipo: 'comentario',
        mensagem: `${nomeUsuario} comentou em sua postagem`,
        postagemId,
        remetente: nomeUsuario,
        remetenteId: usuarioId,
        comentario: conteudo,
        timestamp: new Date().toISOString()
      })
      
      console.log(`[SOCKET] 🔔 Notificação enviada para sala: ${salaAutor}`)
      
    } else {
      console.log(`[SOCKET] ⏭️  Autor comentou própria postagem - SEM notificação`)
    }
    
    console.log(`[SOCKET] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    // 3. Broadcast para TODOS (atualiza lista de comentários no feed)
    io.emit('novo_comentario', {
      id: comentarioId, // ID do comentário
      postagemId,
      usuarioId,
      nomeUsuario,
      username,
      conteudo,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[SOCKET] ❌ Erro ao emitir novo_comentario:', error)
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = setupSocket
module.exports.emitirNovaPostagem = emitirNovaPostagem
module.exports.emitirNovaCurtida = emitirNovaCurtida
module.exports.emitirNovoComentario = emitirNovoComentario
