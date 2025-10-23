import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { endpoints } from '../config/api'
import { io } from 'socket.io-client' // ← Import Socket.IO client
import API_URL from '../config/api' // ← URL da API para conexão Socket

/**
 * Página do Feed de Postagens do UniSafe
 * Exibe as postagens de segurança da comunidade
 * Integrado com Socket.IO para notificações em tempo real
 */
export default function Feed() {
  const router = useRouter()
  
  // Estados para controlar o feed
  const [postagens, setPostagens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [novaPostagem, setNovaPostagem] = useState('')
  const [tipoPostagem, setTipoPostagem] = useState('aviso')
  const [enviandoPost, setEnviandoPost] = useState(false)

  // Estados para controlar comentários
  const [comentariosExpandidos, setComentariosExpandidos] = useState({})
  const [comentarios, setComentarios] = useState({})
  const [loadingComentarios, setLoadingComentarios] = useState({})
  const [novoComentario, setNovoComentario] = useState({})
  const [enviandoComentario, setEnviandoComentario] = useState({})

  // Estados para controlar curtidas
  const [curtindoPostagem, setCurtindoPostagem] = useState({})

  // Estados para notificações em tempo real
  const [notificacoes, setNotificacoes] = useState([])
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0)
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false)
  
  // Estado para nome do usuário (evita erro de hidratação)
  const [nomeUsuario, setNomeUsuario] = useState('')
  
  // Estados para busca de usuários
  const [termoBusca, setTermoBusca] = useState('')
  const [usuarioBuscado, setUsuarioBuscado] = useState(null)
  const [buscandoUsuario, setBuscandoUsuario] = useState(false)
  const [erroNaBusca, setErroNaBusca] = useState('')
  
  // Estado para filtro de postagens
  const [filtroAtivo, setFiltroAtivo] = useState('todos') // 'todos', 'aviso', 'alerta', 'emergencia', 'informacao'
  
  // Ref para manter a instância do socket
  const socketRef = useRef(null)
  
  // Refs para detectar cliques fora dos posts expandidos
  const postsRefs = useRef({})

  /**
   * Carrega as postagens do feed quando o componente monta
   */
  useEffect(() => {
    // Carrega o nome do usuário
    const userData = localStorage.getItem('unisafe_user')
    if (userData) {
      setNomeUsuario(JSON.parse(userData).nome)
    }
    
    carregarPostagens()
  }, [])

  /**
   * ============================================================================
   * SOCKET.IO - Conexão e Eventos em Tempo Real
   * ============================================================================
   * Este useEffect gerencia a conexão WebSocket e todos os event listeners.
   * IMPORTANTE: Usa callbacks que NÃO dependem de closures de estado antigo.
   */
  useEffect(() => {
    const token = localStorage.getItem('unisafe_token')
    
    if (!token) {
      console.warn('[SOCKET] ⚠️ Nenhum token encontrado - Socket.IO não conectado')
      return
    }

    console.log(`[SOCKET] 🔌 Iniciando conexão com ${API_URL}`)
    
    // ========================================
    // Cria instância do Socket.IO
    // ========================================
    const socket = io(API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketRef.current = socket

    // ========================================
    // EVENTO: Conexão estabelecida
    // ========================================
    socket.on('connected', (data) => {
      console.log('[SOCKET] ✅ CONECTADO:', data)
      console.log('[SOCKET] 📍 User ID:', data.userId)
      console.log('[SOCKET] 👤 Nome:', data.userName)
    })

    // ========================================
    // EVENTO: Nova Postagem (Broadcast)
    // ========================================
    socket.on('nova_postagem', (postagem) => {
      console.log('[SOCKET] 📢 Nova postagem recebida:', postagem)
      
      // Usa callback funcional para evitar closure stale
      setPostagens(prevPostagens => {
        // Evita duplicatas
        const jaExiste = prevPostagens.some(p => p.id === postagem.id)
        if (jaExiste) return prevPostagens
        
        // Adiciona no topo do feed
        return [{
          id: postagem.id,
          usuario: postagem.usuario,
          usuario_id: postagem.usuario_id,
          conteudo: postagem.conteudo,
          tipo: postagem.tipo,
          data: 'Agora mesmo',
          curtidas: 0,
          comentarios: 0,
          usuarioCurtiu: false
        }, ...prevPostagens]
      })
    })

    // ========================================
    // EVENTO: Novo Comentário (Atualiza contador e lista)
    // ========================================
    socket.on('novo_comentario', (comentario) => {
      console.log('[SOCKET] 💬 Novo comentário recebido:', comentario)
      console.log('[COMENTARIO] ID da postagem no evento:', comentario.postagemId, 'Tipo:', typeof comentario.postagemId)
      
      // Incrementa contador de comentários
      setPostagens(prevPostagens => {
        console.log('[COMENTARIO] Total de postagens no estado:', prevPostagens.length)
        return prevPostagens.map(p => {
          console.log('[COMENTARIO] Comparando:', p.id, 'Tipo:', typeof p.id, 'com', comentario.postagemId)
          if (p.id == comentario.postagemId) { // Usar == para comparar valores independente do tipo
            console.log('[COMENTARIO] ✅ MATCH! Incrementando contador:', p.comentarios, '→', p.comentarios + 1)
            return { ...p, comentarios: p.comentarios + 1 }
          }
          return p
        })
      })

      // Adiciona à lista SE estiver expandida
      setComentarios(prevComentarios => {
        const comentariosDaPostagem = prevComentarios[comentario.postagemId]
        if (!comentariosDaPostagem) {
          console.log('[COMENTARIO] Lista não expandida, não adiciona à lista')
          return prevComentarios
        }
        
        console.log('[COMENTARIO] Adicionando à lista expandida com ID:', comentario.id)
        return {
          ...prevComentarios,
          [comentario.postagemId]: [
            ...comentariosDaPostagem,
            {
              id: comentario.id, // ID do comentário
              usuario: comentario.nomeUsuario,
              username: comentario.username,
              conteudo: comentario.conteudo,
              data: 'Agora mesmo'
            }
          ]
        }
      })
    })

    // ========================================
    // EVENTO: Comentário Excluído (Atualiza contador e remove da lista)
    // ========================================
    socket.on('comentario_excluido', (data) => {
      console.log('[SOCKET] 🗑️ Comentário excluído:', data)
      
      // Atualiza contador com valor EXATO do backend
      setPostagens(prevPostagens => 
        prevPostagens.map(p => {
          if (p.id == data.postagemId) {
            console.log('[COMENTARIO] Atualizando contador para:', data.totalComentarios)
            return { ...p, comentarios: data.totalComentarios }
          }
          return p
        })
      )

      // Remove da lista SE estiver expandida
      setComentarios(prevComentarios => {
        const comentariosDaPostagem = prevComentarios[data.postagemId]
        if (!comentariosDaPostagem) return prevComentarios
        
        return {
          ...prevComentarios,
          [data.postagemId]: comentariosDaPostagem.filter(c => c.id !== data.comentarioId)
        }
      })
    })

    // ========================================
    // EVENTO: Postagem Excluída (Remove da lista)
    // ========================================
    socket.on('postagem_excluida', (data) => {
      console.log('[SOCKET] 🗑️ Postagem excluída:', data)
      
      // Remove da lista de postagens
      setPostagens(prevPostagens => 
        prevPostagens.filter(p => p.id !== data.postagemId)
      )
    })

    // ========================================
    // EVENTO: Notificação Pessoal (APENAS para você)
    // ========================================
    socket.on('notificacao', (notificacao) => {
      console.log('[SOCKET] 🔔 NOTIFICAÇÃO RECEBIDA:', notificacao)
      
      // Adiciona à lista de notificações
      setNotificacoes(prev => [notificacao, ...prev])
      
      // Incrementa contador de não lidas
      setNotificacoesNaoLidas(prev => prev + 1)
      
      // Mostra toast/alerta
      exibirToast(notificacao)
    })

    // ========================================
    // EVENTO: Lista de notificações
    // ========================================
    socket.on('lista_notificacoes', (lista) => {
      console.log('[SOCKET] 📬 Lista de notificações:', lista.length)
      setNotificacoes(lista)
      setNotificacoesNaoLidas(lista.filter(n => !n.lida).length)
    })

    // ========================================
    // EVENTO: Total de não lidas
    // ========================================
    socket.on('total_nao_lidas', (total) => {
      console.log('[SOCKET] 📊 Total não lidas:', total)
      setNotificacoesNaoLidas(total)
    })

    // ========================================
    // EVENTO: Erro
    // ========================================
    socket.on('erro', (erro) => {
      console.error('[SOCKET] ❌ ERRO:', erro)
    })

    // ========================================
    // EVENTO: Reconexão
    // ========================================
    socket.on('reconnect', (attemptNumber) => {
      console.log(`[SOCKET] 🔄 Reconectado após ${attemptNumber} tentativas`)
    })

    // ========================================
    // CLEANUP: Remove listeners e desconecta ao desmontar
    // ========================================
    return () => {
      console.log('[SOCKET] 🧹 Limpando listeners e desconectando...')
      
      // Remove TODOS os event listeners para evitar memory leaks
      socket.off('connected')
      socket.off('nova_postagem')
      socket.off('novo_comentario')
      socket.off('comentario_excluido')
      socket.off('postagem_excluida')
      socket.off('notificacao')
      socket.off('lista_notificacoes')
      socket.off('total_nao_lidas')
      socket.off('erro')
      socket.off('reconnect')
      
      // Desconecta o socket
      socket.disconnect()
      socketRef.current = null
      
      console.log('[SOCKET] ✅ Cleanup concluído!')
    }
  }, []) // ✅ Sem dependências - executa apenas 1 vez

  /**
   * Exibe toast de notificação (simples com console.log)
   * TODO: Substituir por biblioteca de toast (react-hot-toast, sonner, etc)
   */
  const exibirToast = (notificacao) => {
    const emoji = notificacao.tipo === 'curtida' ? '❤️' : '💬'
    console.log(`🔔 ${emoji} ${notificacao.mensagem}`)
    
    // Opcional: Usar alert temporário (pode irritar usuário)
    // alert(`${emoji} ${notificacao.mensagem}`)
  }

  /**
   * Alterna visibilidade do painel de notificações
   */
  const toggleNotificacoes = () => {
    const novoEstado = !mostrarNotificacoes
    setMostrarNotificacoes(novoEstado)
    
    // Se abriu o painel, solicita lista atualizada
    if (novoEstado && socketRef.current) {
      socketRef.current.emit('solicitar_notificacoes')
    }
  }

  /**
   * UseEffect para detectar cliques fora dos posts expandidos
   * Fecha os comentários quando o usuário clica fora do post
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Para cada post expandido, verifica se o clique foi fora dele
      Object.keys(comentariosExpandidos).forEach((postagemId) => {
        if (comentariosExpandidos[postagemId] && postsRefs.current[postagemId]) {
          const postElement = postsRefs.current[postagemId]
          
          // Se o clique foi fora do post, fecha os comentários
          if (postElement && !postElement.contains(event.target)) {
            setComentariosExpandidos(prev => ({ ...prev, [postagemId]: false }))
          }
        }
      })
    }

    // Adiciona o event listener
    document.addEventListener('mousedown', handleClickOutside)
    
    // Remove o event listener ao desmontar
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [comentariosExpandidos]) // Reexecuta quando os comentários expandidos mudam

  /**
   * Marca uma notificação como lida e redireciona para a postagem
   */
  const marcarComoLida = async (notificacaoId) => {
    try {
      // Busca a notificação localmente
      const notificacao = notificacoes.find(n => n.id === notificacaoId)
      
      if (!notificacao) return
      
      // Se já está lida, não faz nada
      if (notificacao.lida) return
      
      // Emite evento Socket.IO para marcar como lida
      if (socketRef.current) {
        socketRef.current.emit('marcar_lida', notificacaoId)
        
        // Atualiza localmente
        setNotificacoes(prev => 
          prev.map(n => n.id === notificacaoId ? { ...n, lida: true } : n)
        )
        
        // Decrementa contador de não lidas
        setNotificacoesNaoLidas(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  /**
   * Marca TODAS as notificações como lidas
   */
  const marcarTodasLidas = () => {
    if (socketRef.current) {
      socketRef.current.emit('marcar_todas_lidas')
      
      // Atualiza localmente
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
      setNotificacoesNaoLidas(0)
    }
  }

  /**
   * Busca um usuário por username
   */
  const buscarUsuario = async (e) => {
    e.preventDefault()
    
    // Limpa resultados anteriores
    setUsuarioBuscado(null)
    setErroNaBusca('')
    
    // Validação
    if (!termoBusca.trim()) {
      setErroNaBusca('Digite um username para buscar')
      return
    }
    
    setBuscandoUsuario(true)
    
    try {
      const response = await fetch(`${endpoints.usuarios}/perfil/${termoBusca.trim()}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        setUsuarioBuscado(data.data)
        setErroNaBusca('')
      } else {
        setUsuarioBuscado(null)
        setErroNaBusca(data.message || 'Usuário não encontrado')
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      setUsuarioBuscado(null)
      setErroNaBusca('Erro ao buscar usuário. Tente novamente.')
    } finally {
      setBuscandoUsuario(false)
    }
  }

  /**
   * Limpa a busca de usuários
   */
  const limparBusca = () => {
    setTermoBusca('')
    setUsuarioBuscado(null)
    setErroNaBusca('')
  }

  /**
   * Exclui uma postagem
   * @param {number} postagemId - ID da postagem
   */
  const excluirPostagem = async (postagemId) => {
    if (!confirm('Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      console.log('[POSTAGEM] Excluindo postagem:', postagemId)

      const token = localStorage.getItem('unisafe_token')
      if (!token) {
        alert('Você precisa estar logado')
        return
      }

      const response = await fetch(`${endpoints.postagens}/${postagemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        console.log('[POSTAGEM] Postagem excluída com sucesso')
        
        // Remove localmente da lista
        setPostagens(prev => prev.filter(p => p.id !== postagemId))
      } else {
        const error = await response.json()
        alert(error.message || 'Erro ao excluir postagem')
        console.error('[POSTAGEM] Erro ao excluir - Status:', response.status)
      }
    } catch (error) {
      console.error('[POSTAGEM] Erro ao excluir postagem:', error)
      alert('Erro ao excluir postagem')
    }
  }

  /**
   * Formatar data para exibição (igual ao perfil público)
   * @param {string} dataString - Data em formato ISO
   * @returns {string} - Data formatada
   */
  const formatarData = (dataString) => {
    if (!dataString) return 'Data inválida';
    
    // Garante que a data seja interpretada como UTC
    let dataUTC = dataString;
    if (!dataString.endsWith('Z') && !dataString.includes('+')) {
      dataUTC = dataString + 'Z';
    }
    
    const data = new Date(dataUTC);
    
    // Verifica se a data é válida
    if (isNaN(data.getTime())) return 'Data inválida';
    
    // Ajusta manualmente para horário de Brasília (UTC-3)
    // Subtrai 3 horas em milissegundos
    const dataBrasilia = new Date(data.getTime() - (3 * 60 * 60 * 1000));
    
    // Formata a data
    return dataBrasilia.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' às ' + dataBrasilia.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Carrega comentários de uma postagem
   * @param {number} postagemId - ID da postagem
   */
  const carregarComentarios = async (postagemId) => {
    try {
      setLoadingComentarios(prev => ({ ...prev, [postagemId]: true }))
      
      const response = await fetch(endpoints.comentarios(postagemId))
      
      if (response.ok) {
        const data = await response.json()
        setComentarios(prev => ({ ...prev, [postagemId]: data.data }))
      } else {
        console.error('Erro ao carregar comentários')
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    } finally {
      setLoadingComentarios(prev => ({ ...prev, [postagemId]: false }))
    }
  }

  /**
   * Toggle expansão dos comentários
   * @param {number} postagemId - ID da postagem
   */
  const toggleComentarios = async (postagemId) => {
    const jaExpandido = comentariosExpandidos[postagemId]
    
    if (!jaExpandido) {
      // Se não está expandido, expande e carrega comentários
      setComentariosExpandidos(prev => ({ ...prev, [postagemId]: true }))
      await carregarComentarios(postagemId)
    } else {
      // Se já está expandido, apenas colapsa
      setComentariosExpandidos(prev => ({ ...prev, [postagemId]: false }))
    }
  }

  /**
   * Adiciona novo comentário
   * @param {number} postagemId - ID da postagem
   */
  const adicionarComentario = async (postagemId) => {
    const conteudo = novoComentario[postagemId]?.trim()
    
    if (!conteudo) {
      return
    }

    try {
      console.log('[COMENTARIO] Enviando comentário para postagem:', postagemId)
      setEnviandoComentario(prev => ({ ...prev, [postagemId]: true }))

      const token = localStorage.getItem('unisafe_token')
      
      if (!token) {
        alert('Você precisa estar logado para comentar')
        return
      }
      
      const response = await fetch(endpoints.comentarios(postagemId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conteudo })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[COMENTARIO] Resposta do backend:', data)
        
        // NÃO adiciona localmente - deixa o Socket.IO fazer isso
        // para evitar duplicação
        
        // Limpa o campo de texto
        setNovoComentario(prev => ({ ...prev, [postagemId]: '' }))

        // NÃO atualiza contador localmente - Socket.IO já faz
        
        console.log('[COMENTARIO] Comentário enviado, aguardando Socket.IO...')
      } else {
        console.error('[COMENTARIO] Erro ao adicionar - Status:', response.status)
      }
    } catch (error) {
      console.error('[COMENTARIO] Erro ao adicionar comentário:', error)
    } finally {
      setEnviandoComentario(prev => ({ ...prev, [postagemId]: false }))
    }
  }

  /**
   * Exclui um comentário
   * @param {number} postagemId - ID da postagem
   * @param {number} comentarioId - ID do comentário
   */
  const excluirComentario = async (postagemId, comentarioId) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
      return
    }

    try {
      console.log('[COMENTARIO] Excluindo comentário:', comentarioId)

      const token = localStorage.getItem('unisafe_token')
      if (!token) {
        alert('Você precisa estar logado')
        return
      }

      const response = await fetch(`${endpoints.comentarios(postagemId)}/${comentarioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[COMENTARIO] Resposta do backend:', data)
        
        // Remove localmente da lista
        setComentarios(prev => ({
          ...prev,
          [postagemId]: (prev[postagemId] || []).filter(c => c.id !== comentarioId)
        }))

        // Atualiza contador com o valor EXATO do backend
        setPostagens(prev => prev.map(p => 
          p.id === postagemId 
            ? { ...p, comentarios: data.totalComentarios }
            : p
        ))

        console.log('[COMENTARIO] Comentário excluído, contador atualizado para:', data.totalComentarios)
      } else {
        const error = await response.json()
        alert(error.message || 'Erro ao excluir comentário')
        console.error('[COMENTARIO] Erro ao excluir - Status:', response.status)
      }
    } catch (error) {
      console.error('[COMENTARIO] Erro ao excluir comentário:', error)
      alert('Erro ao excluir comentário')
    }
  }

  /**
   * Curte ou descurte uma postagem
   * @param {number} postagemId - ID da postagem
   */
  const toggleCurtida = async (postagemId) => {
    try {
      console.log('[CURTIR] Curtindo postagem:', postagemId)
      setCurtindoPostagem(prev => ({ ...prev, [postagemId]: true }))

      const token = localStorage.getItem('unisafe_token')
      if (!token) {
        alert('Você precisa estar logado para curtir postagens')
        return
      }

      const response = await fetch(endpoints.curtir(postagemId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[CURTIR] Resposta do backend:', data)
        console.log('[CURTIR] Total curtidas recebido:', data.totalCurtidas)
        console.log('[CURTIR] Ação recebida:', data.action)
        
        // Atualiza o estado da postagem usando o total do backend
        setPostagens(prev => prev.map(p => {
          if (p.id === postagemId) {
            const novoEstado = {
              ...p,
              usuarioCurtiu: data.action === 'added',
              curtidas: data.totalCurtidas !== undefined ? data.totalCurtidas : p.curtidas
            }
            console.log('[CURTIR] Estado anterior curtidas:', p.curtidas)
            console.log('[CURTIR] Novo estado curtidas:', novoEstado.curtidas)
            console.log('[CURTIR] Usuário curtiu?', novoEstado.usuarioCurtiu)
            return novoEstado
          }
          return p
        }))
      } else {
        console.error('Erro ao curtir postagem - Status:', response.status)
        if (response.status === 401) {
          alert('Sessão expirada. Por favor, faça login novamente.')
        }
      }
    } catch (error) {
      console.error('Erro ao curtir postagem:', error)
    } finally {
      setCurtindoPostagem(prev => ({ ...prev, [postagemId]: false }))
    }
  }

  /**
   * Busca as postagens da API
   */
  const carregarPostagens = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Pega o token do localStorage
      const token = localStorage.getItem('unisafe_token')
      
      const response = await fetch(endpoints.postagens, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('API Response:', result) // Debug
        
        if (result.success && Array.isArray(result.data)) {
          // Mapeia os dados para garantir compatibilidade
          const postagensFormatadas = result.data.map(p => ({
            ...p,
            curtidas: p.total_curtidas || p.curtidas || 0,
            comentarios: p.total_comentarios || p.comentarios || 0
          }))
          setPostagens(postagensFormatadas)
        } else {
          console.error('Formato de resposta inválido:', result)
          setError('Erro no formato dos dados')
          setPostagens([])
        }
      } else {
        console.error('Erro na resposta:', response.status)
        setError('Erro ao conectar com o servidor')
        setPostagens([])
      }
    } catch (error) {
      console.error('Erro ao carregar postagens:', error)
      setError('Erro de conexão. Verifique se o backend está rodando.')
      setPostagens([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Envia uma nova postagem
   * @param {Event} e - Evento de submit do formulário
   */
  const handleSubmitPost = async (e) => {
    e.preventDefault()
    if (!novaPostagem.trim()) return

    setEnviandoPost(true)
    try {
      // Pega o token do localStorage (se houver)
      const token = localStorage.getItem('unisafe_token')
      
      const response = await fetch(endpoints.postar, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          conteudo: novaPostagem,
          tipo: tipoPostagem
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setNovaPostagem('')
          setTipoPostagem('aviso')
          carregarPostagens() // Recarrega o feed
          // Feedback visual de sucesso
          alert('Postagem criada com sucesso!')
        } else {
          alert('Erro ao criar postagem: ' + result.message)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          alert('Você precisa fazer login para criar postagens')
          window.location.href = '/login'
        } else {
          alert('Erro ao criar postagem: ' + (errorData.message || 'Erro desconhecido'))
        }
      }
    } catch (error) {
      console.error('Erro ao enviar postagem:', error)
      alert('Erro de conexão. Verifique sua internet.')
    } finally {
      setEnviandoPost(false)
    }
  }

  /**
   * Filtra as postagens baseado no tipo selecionado
   * @returns {Array} - Postagens filtradas
   */
  const postagensFiltradasPorTipo = () => {
    if (filtroAtivo === 'todos') {
      return postagens
    }
    return postagens.filter(postagem => postagem.tipo === filtroAtivo)
  }

  /**
   * Retorna a cor da badge baseada no tipo da postagem
   * @param {string} tipo - Tipo da postagem
   * @returns {string} - Classes CSS para a cor
   */
  const getTipoCor = (tipo) => {
    switch (tipo) {
      case 'emergencia':
        return 'bg-red-200 text-red-900 border border-red-300 font-bold'
      case 'alerta':
        return 'bg-red-100 text-red-800 border border-red-200'
      case 'aviso':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'informacao':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'roubo':
        return 'bg-red-100 text-red-800 border border-red-200'
      case 'furto':
        return 'bg-orange-100 text-orange-800 border border-orange-200'
      case 'vandalismo':
        return 'bg-purple-100 text-purple-800 border border-purple-200'
      case 'suspeito':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  return (
    <>
      <Head>
        <title>Feed - UniSafe</title>
        <meta name="description" content="Feed de postagens de segurança do UniSafe" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-100">
        {/* Header com gradiente moderno */}
        <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-neutral-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo */}
              <Link href="/">
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-300 group-hover:scale-105">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    UniSafe
                  </h1>
                </div>
              </Link>
              
              {/* Navegação */}
              <nav className="flex items-center gap-4">
                {/* Saudação */}
                <span className="hidden md:flex text-sm text-neutral-700 items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {nomeUsuario ? nomeUsuario.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <span className="font-medium">
                    {nomeUsuario ? `Olá, ${nomeUsuario.split(' ')[0]}!` : 'Bem-vindo!'}
                  </span>
                </span>
                
                {/* Sino de notificações */}
                <button
                  onClick={toggleNotificacoes}
                  className="relative p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                  title="Notificações"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Badge com número de notificações não lidas */}
                  {notificacoesNaoLidas > 0 && (
                    <span className="absolute top-0 right-0 bg-gradient-to-br from-danger-500 to-danger-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-soft animate-pulse">
                      {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
                    </span>
                  )}
                </button>
                
                {/* Link Perfil */}
                <Link 
                  href="/perfil"
                  className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden sm:inline text-sm font-medium">Perfil</span>
                </Link>
                
                {/* Botão Sair */}
                <button 
                  onClick={() => {
                    localStorage.removeItem('unisafe_token')
                    localStorage.removeItem('unisafe_user')
                    window.location.href = '/login'
                  }}
                  className="p-2 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all flex items-center gap-2"
                  title="Sair"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline text-sm font-medium">Sair</span>
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* ============================================================================
            PAINEL DE NOTIFICAÇÕES (Dropdown)
            ============================================================================ */}
        {mostrarNotificacoes && (
          <div className="fixed top-20 right-4 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-strong border border-neutral-200 z-50 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Cabeçalho do painel */}
            <div className="px-5 py-4 border-b border-neutral-200 flex justify-between items-center bg-gradient-to-r from-primary-50 to-accent-50">
              <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm">Notificações</span>
                  {notificacoesNaoLidas > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-danger-500 text-white text-xs font-bold rounded-full">
                      {notificacoesNaoLidas}
                    </span>
                  )}
                </div>
              </h3>
              <div className="flex gap-2">
                {notificacoesNaoLidas > 0 && (
                  <button
                    onClick={marcarTodasLidas}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
                  >
                    Marcar todas lidas
                  </button>
                )}
                <button
                  onClick={() => setMostrarNotificacoes(false)}
                  className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg p-1 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Lista de notificações */}
            <div className="overflow-y-auto flex-1">
              {notificacoes.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-neutral-700">Nenhuma notificação</p>
                  <p className="text-xs mt-1 text-neutral-500">Você está em dia! 🎉</p>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {notificacoes.map((notif, index) => (
                    <li
                      key={notif.id || index}
                      onClick={() => marcarComoLida(notif.id)}
                      title={!notif.lida ? 'Clique para marcar como lida' : 'Já lida'}
                      className={`px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${
                        !notif.lida ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        {/* Ícone baseado no tipo */}
                        <div className={`mr-3 mt-1 ${
                          notif.tipo === 'curtida' ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {notif.tipo === 'curtida' ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                        </div>

                        {/* Conteúdo da notificação */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notif.lida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notif.mensagem}
                          </p>
                          {(notif.remetente_nome || notif.remetente) && (
                            <p className="text-xs text-gray-500 mt-1">
                              Por: {notif.remetente_nome || notif.remetente}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatarData(notif.criada_em || notif.timestamp)}
                          </p>
                        </div>

                        {/* Indicador de não lida */}
                        {!notif.lida && (
                          <div className="ml-2 mt-1">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ============================================================================
            BARRA DE BUSCA DE USUÁRIOS
            ============================================================================ */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={buscarUsuario} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Buscar usuário por username..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                />
                {termoBusca && (
                  <button
                    type="button"
                    onClick={limparBusca}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={buscandoUsuario || !termoBusca.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {buscandoUsuario ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Buscando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Buscar
                  </>
                )}
              </button>
            </form>

            {/* Resultado da busca */}
            {erroNaBusca && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Usuário não encontrado</p>
                  <p className="text-sm text-red-600 mt-1">{erroNaBusca}</p>
                </div>
              </div>
            )}

            {usuarioBuscado && (
              <div className="mt-4">
                <p className="text-xs text-neutral-600 mb-3 font-medium">Resultado da busca:</p>
                <div
                  onClick={() => router.push(`/usuario/${usuarioBuscado.username}`)}
                  className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-soft hover:shadow-medium transition-all cursor-pointer border border-neutral-200 hover:border-primary-300 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {usuarioBuscado.avatar_url ? (
                        <img
                          src={usuarioBuscado.avatar_url}
                          alt={usuarioBuscado.nome}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-neutral-200 group-hover:ring-primary-300 transition-all"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextElementSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className="w-14 h-14 rounded-full bg-gradient-accent text-white font-bold text-lg flex items-center justify-center ring-2 ring-neutral-200 group-hover:ring-accent-300 transition-all"
                        style={{ display: usuarioBuscado.avatar_url ? 'none' : 'flex' }}
                      >
                        {usuarioBuscado.nome?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>

                    {/* Informações do usuário */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutral-800 text-base truncate">{usuarioBuscado.nome}</h3>
                      <p className="text-sm text-primary-600 font-medium">@{usuarioBuscado.username}</p>
                      {usuarioBuscado.bio && (
                        <p className="text-xs text-neutral-600 mt-1 line-clamp-1">{usuarioBuscado.bio}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {usuarioBuscado.estatisticas?.total_postagens || 0} posts
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {usuarioBuscado.estatisticas?.total_amigos || 0} amigos
                        </span>
                      </div>
                    </div>

                    {/* Ícone de seta */}
                    <div className="text-neutral-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo principal */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Formulário para nova postagem */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium p-6 mb-8 border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-800 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span>Compartilhar informação de segurança</span>
            </h2>
            
            <form onSubmit={handleSubmitPost} className="space-y-4">
              {/* Seletor de tipo de postagem com badges coloridos */}
              <div>
                <label htmlFor="tipo" className="block text-sm font-semibold text-neutral-700 mb-3">
                  Tipo de postagem
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoPostagem('aviso')}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      tipoPostagem === 'aviso'
                        ? 'border-primary-500 bg-primary-50 shadow-soft'
                        : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💡</span>
                      <span className={`text-sm font-semibold ${tipoPostagem === 'aviso' ? 'text-primary-700' : 'text-neutral-700'}`}>
                        Aviso
                      </span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTipoPostagem('alerta')}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      tipoPostagem === 'alerta'
                        ? 'border-warning-500 bg-warning-50 shadow-soft'
                        : 'border-neutral-200 hover:border-warning-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      <span className={`text-sm font-semibold ${tipoPostagem === 'alerta' ? 'text-warning-700' : 'text-neutral-700'}`}>
                        Alerta
                      </span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTipoPostagem('emergencia')}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      tipoPostagem === 'emergencia'
                        ? 'border-danger-500 bg-danger-50 shadow-soft'
                        : 'border-neutral-200 hover:border-danger-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🚨</span>
                      <span className={`text-sm font-semibold ${tipoPostagem === 'emergencia' ? 'text-danger-700' : 'text-neutral-700'}`}>
                        Emergência
                      </span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTipoPostagem('informacao')}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      tipoPostagem === 'informacao'
                        ? 'border-accent-500 bg-accent-50 shadow-soft'
                        : 'border-neutral-200 hover:border-accent-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">ℹ️</span>
                      <span className={`text-sm font-semibold ${tipoPostagem === 'informacao' ? 'text-accent-700' : 'text-neutral-700'}`}>
                        Info
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Campo de texto da postagem */}
              <div>
                <textarea
                  value={novaPostagem}
                  onChange={(e) => setNovaPostagem(e.target.value)}
                  placeholder="O que está acontecendo? Compartilhe informações importantes sobre segurança..."
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none resize-none text-neutral-800 placeholder-neutral-400"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                  <span>Seja claro e objetivo na descrição</span>
                  <span>{novaPostagem.length} caracteres</span>
                </div>
              </div>

              {/* Botão de enviar */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={enviandoPost || !novaPostagem.trim()}
                  className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  {enviandoPost ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publicando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Publicar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Feed de postagens */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neutral-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <span>Feed da Comunidade</span>
              </h2>
              <button
                onClick={carregarPostagens}
                className="px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
            </div>

            {/* Filtros de postagens */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium border border-neutral-200 p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-neutral-700">Filtrar por:</span>
                
                {/* Botão Todos */}
                <button
                  onClick={() => setFiltroAtivo('todos')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filtroAtivo === 'todos'
                      ? 'bg-gradient-to-r from-neutral-600 to-neutral-700 text-white shadow-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  📋 Todos
                </button>

                {/* Botão Aviso */}
                <button
                  onClick={() => setFiltroAtivo('aviso')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filtroAtivo === 'aviso'
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                      : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                  }`}
                >
                  💡 Aviso
                </button>

                {/* Botão Alerta */}
                <button
                  onClick={() => setFiltroAtivo('alerta')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filtroAtivo === 'alerta'
                      ? 'bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-md'
                      : 'bg-warning-50 text-warning-700 hover:bg-warning-100 border border-warning-200'
                  }`}
                >
                  ⚠️ Alerta
                </button>

                {/* Botão Emergência */}
                <button
                  onClick={() => setFiltroAtivo('emergencia')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filtroAtivo === 'emergencia'
                      ? 'bg-gradient-to-r from-danger-500 to-danger-600 text-white shadow-md'
                      : 'bg-danger-50 text-danger-700 hover:bg-danger-100 border border-danger-200'
                  }`}
                >
                  🚨 Emergência
                </button>

                {/* Botão Informação */}
                <button
                  onClick={() => setFiltroAtivo('informacao')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filtroAtivo === 'informacao'
                      ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md'
                      : 'bg-accent-50 text-accent-700 hover:bg-accent-100 border border-accent-200'
                  }`}
                >
                  ℹ️ Info
                </button>

                {/* Contador de resultados */}
                {filtroAtivo !== 'todos' && (
                  <span className="ml-auto text-sm text-neutral-600 font-medium">
                    {postagensFiltradasPorTipo().length} {postagensFiltradasPorTipo().length === 1 ? 'postagem' : 'postagens'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Exibir erro se houver */}
            {error && (
              <div className="bg-danger-50 border-l-4 border-danger-500 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-danger-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-danger-800 font-semibold">Erro ao carregar postagens</p>
                    <p className="text-danger-600 text-sm mt-1">{error}</p>
                    <button
                      onClick={carregarPostagens}
                      className="mt-3 px-4 py-2 bg-danger-500 text-white text-sm font-medium rounded-lg hover:bg-danger-600 transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {loading ? (
              // Loading state com animação moderna
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="mt-4 text-neutral-600 font-medium">Carregando postagens...</p>
              </div>
            ) : postagens.length === 0 && !error ? (
              // Estado vazio com visual moderno
              <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium border border-neutral-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-2">
                  Ainda não há postagens
                </h3>
                <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                  Seja o primeiro a compartilhar informações de segurança com a comunidade!
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-xl shadow-soft hover:shadow-medium transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Criar primeira postagem
                </button>
              </div>
            ) : postagensFiltradasPorTipo().length === 0 && filtroAtivo !== 'todos' ? (
              // Mensagem quando filtro não retorna resultados
              <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium border border-neutral-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-2">
                  Nenhuma postagem encontrada
                </h3>
                <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                  Não há postagens do tipo "{filtroAtivo === 'emergencia' ? 'Emergência' : 
                                           filtroAtivo === 'alerta' ? 'Alerta' : 
                                           filtroAtivo === 'aviso' ? 'Aviso' : 'Informação'}" no momento.
                </p>
                <button
                  onClick={() => setFiltroAtivo('todos')}
                  className="px-6 py-3 bg-gradient-to-r from-neutral-600 to-neutral-700 text-white font-semibold rounded-xl shadow-soft hover:shadow-medium transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Ver todas as postagens
                </button>
              </div>
            ) : (
              // Lista de postagens com design moderno
              Array.isArray(postagensFiltradasPorTipo()) ? postagensFiltradasPorTipo().map((postagem, index) => (
                <div 
                  key={postagem.id || index} 
                  ref={(el) => {
                    if (el) {
                      postsRefs.current[postagem.id] = el
                    }
                  }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium hover:shadow-strong transition-all duration-300 border border-neutral-200 overflow-hidden group"
                >
                  {/* Barra lateral colorida baseada no tipo */}
                  <div className={`h-full w-1.5 absolute left-0 top-0 bottom-0 ${
                    postagem.tipo === 'emergencia' ? 'bg-gradient-to-b from-danger-500 to-danger-600' :
                    postagem.tipo === 'alerta' ? 'bg-gradient-to-b from-warning-500 to-warning-600' :
                    postagem.tipo === 'informacao' ? 'bg-gradient-to-b from-accent-500 to-accent-600' :
                    'bg-gradient-to-b from-primary-500 to-primary-600'
                  }`} />

                  <div className="p-6 pl-8">
                    {/* Header da postagem */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-soft ${
                          postagem.tipo === 'emergencia' ? 'bg-gradient-to-br from-danger-500 to-danger-600' :
                          postagem.tipo === 'alerta' ? 'bg-gradient-to-br from-warning-500 to-warning-600' :
                          postagem.tipo === 'informacao' ? 'bg-gradient-to-br from-accent-500 to-accent-600' :
                          'bg-gradient-to-br from-primary-500 to-primary-600'
                        }`}>
                          {postagem.usuario ? postagem.usuario.charAt(0).toUpperCase() : 'U'}
                        </div>
                        
                        {/* Info do usuário */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-neutral-800 truncate">
                              {postagem.usuario || 'Usuário Anônimo'}
                            </p>
                            {postagem.username && (
                              <Link 
                                href={`/usuario/@${postagem.username}`}
                                className="text-sm text-primary-600 font-medium hover:text-primary-700 hover:underline cursor-pointer transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                @{postagem.username}
                              </Link>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {formatarData(postagem.criado_em)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Badges e ações */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Badge de tipo */}
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm ${
                          postagem.tipo === 'emergencia' ? 'bg-danger-100 text-danger-700 border border-danger-200' :
                          postagem.tipo === 'alerta' ? 'bg-warning-100 text-warning-700 border border-warning-200' :
                          postagem.tipo === 'informacao' ? 'bg-accent-100 text-accent-700 border border-accent-200' :
                          'bg-primary-100 text-primary-700 border border-primary-200'
                        }`}>
                          {postagem.tipo === 'emergencia' ? '🚨 Emergência' :
                           postagem.tipo === 'alerta' ? '⚠️ Alerta' :
                           postagem.tipo === 'informacao' ? 'ℹ️ Info' :
                           '💡 Aviso'}
                        </span>
                        
                        {/* Botão de excluir (apenas para o autor) */}
                        {postagem.usuario === nomeUsuario && (
                          <button
                            onClick={() => excluirPostagem(postagem.id)}
                            className="p-2 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
                            title="Excluir postagem"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Título da postagem (se houver) */}
                    {postagem.titulo && (
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-neutral-800">
                          {postagem.titulo}
                        </h3>
                      </div>
                    )}

                    {/* Conteúdo da postagem */}
                    <div className="mb-4">
                      <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap text-sm">
                        {postagem.conteudo || 'Conteúdo não disponível'}
                      </p>
                    </div>

                    {/* Localização (se houver) */}
                    {postagem.localizacao && (
                      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg text-sm text-neutral-700">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{postagem.localizacao}</span>
                      </div>
                    )}

                  {/* Ações da postagem */}
                  <div className="flex items-center gap-6 pt-4 border-t border-neutral-100">
                    {/* Botão de curtida */}
                    <button 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        postagem.usuarioCurtiu 
                          ? 'text-danger-600 bg-danger-50 hover:bg-danger-100' 
                          : 'text-neutral-600 hover:text-danger-600 hover:bg-danger-50'
                      } ${curtindoPostagem[postagem.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => toggleCurtida(postagem.id)}
                      disabled={curtindoPostagem[postagem.id]}
                      title={postagem.usuarioCurtiu ? 'Remover curtida' : 'Curtir postagem'}
                    >
                      {curtindoPostagem[postagem.id] ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className={`w-5 h-5 ${postagem.usuarioCurtiu ? 'fill-current' : ''}`} fill={postagem.usuarioCurtiu ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                      <span>{postagem.curtidas || 0}</span>
                    </button>
                    
                    {/* Botão de comentários */}
                    <button 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all"
                      onClick={() => toggleComentarios(postagem.id)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{postagem.comentarios || 0}</span>
                    </button>
                  </div>

                  {/* Seção de Comentários */}
                  {comentariosExpandidos[postagem.id] && (
                    <div className="mt-5 pt-5 border-t border-neutral-200">
                      {/* Lista de comentários */}
                      <div className="space-y-3 mb-4">
                        {loadingComentarios[postagem.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="inline-flex items-center gap-3">
                              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        ) : comentarios[postagem.id] && comentarios[postagem.id].length > 0 ? (
                          comentarios[postagem.id].map((comentario) => (
                            <div key={comentario.id} className="flex gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
                              <div className="w-9 h-9 bg-gradient-accent rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                                {comentario.usuario ? comentario.usuario.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-neutral-800 text-sm truncate">
                                        {comentario.usuario || 'Usuário Anônimo'}
                                      </span>
                                      {comentario.username && (
                                        <Link 
                                          href={`/usuario/@${comentario.username}`}
                                          className="text-xs text-primary-600 font-medium hover:text-primary-700 hover:underline cursor-pointer transition-colors"
                                        >
                                          @{comentario.username}
                                        </Link>
                                      )}
                                      <span className="text-xs text-neutral-500">
                                        · {comentario.data}
                                      </span>
                                    </div>
                                  </div>
                                  {/* Botão de excluir (apenas para o autor do comentário) */}
                                  {comentario.usuario === nomeUsuario && (
                                    <button
                                      onClick={() => excluirComentario(postagem.id, comentario.id)}
                                      className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg p-1.5 transition-all flex-shrink-0"
                                      title="Excluir comentário"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                <p className="text-neutral-700 text-sm leading-relaxed">
                                  {comentario.conteudo}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-3 bg-neutral-100 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <p className="text-sm text-neutral-600 font-medium">Ainda não há comentários</p>
                            <p className="text-xs text-neutral-500 mt-1">Seja o primeiro a comentar!</p>
                          </div>
                        )}
                      </div>

                      {/* Formulário para novo comentário */}
                      <div className="flex gap-3 mt-4">
                        <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                          {nomeUsuario ? nomeUsuario.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={novoComentario[postagem.id] || ''}
                            onChange={(e) => setNovoComentario(prev => ({ 
                              ...prev, 
                              [postagem.id]: e.target.value 
                            }))}
                            placeholder="Escreva um comentário..."
                            className="w-full p-3 border-2 border-neutral-200 rounded-xl resize-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-neutral-800 placeholder-neutral-400"
                            rows="2"
                            maxLength="500"
                            disabled={enviandoComentario[postagem.id]}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-neutral-500 font-medium">
                              {(novoComentario[postagem.id] || '').length}/500
                            </span>
                            <button
                              onClick={() => adicionarComentario(postagem.id)}
                              disabled={
                                !novoComentario[postagem.id]?.trim() || 
                                enviandoComentario[postagem.id]
                              }
                              className="px-5 py-2 bg-gradient-primary text-white text-sm font-semibold rounded-lg hover:shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                              {enviandoComentario[postagem.id] ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Enviando...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                  <span>Comentar</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )) : null
            )}
          </div>
        </main>
      </div>
    </>
  )
}
