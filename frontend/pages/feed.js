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

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary-700 cursor-pointer">UniSafe</h1>
              </Link>
              <nav className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {nomeUsuario ? `Olá, ${nomeUsuario}!` : 'Bem-vindo!'}
                </span>
                
                {/* Sino de notificações */}
                <button
                  onClick={toggleNotificacoes}
                  className="relative text-primary-600 hover:text-primary-800"
                  title="Notificações"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Badge com número de notificações não lidas */}
                  {notificacoesNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
                    </span>
                  )}
                </button>
                
                <Link 
                  href="/perfil"
                  className="text-primary-600 hover:text-primary-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Perfil
                </Link>
                <button 
                  onClick={() => {
                    localStorage.removeItem('unisafe_token')
                    localStorage.removeItem('unisafe_user')
                    window.location.href = '/login'
                  }}
                  className="text-primary-600 hover:text-primary-800"
                >
                  Sair
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* ============================================================================
            PAINEL DE NOTIFICAÇÕES (Dropdown)
            ============================================================================ */}
        {mostrarNotificacoes && (
          <div className="fixed top-20 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Cabeçalho do painel */}
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-primary-50">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notificações ({notificacoesNaoLidas})
              </h3>
              <div className="flex gap-2">
                {notificacoesNaoLidas > 0 && (
                  <button
                    onClick={marcarTodasLidas}
                    className="text-xs text-primary-600 hover:text-primary-800 hover:underline"
                  >
                    Marcar todas lidas
                  </button>
                )}
                <button
                  onClick={() => setMostrarNotificacoes(false)}
                  className="text-gray-500 hover:text-gray-700"
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
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm">Nenhuma notificação</p>
                  <p className="text-xs mt-1">Você está em dia! 🎉</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
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
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Resultado da busca:</p>
                <div
                  onClick={() => router.push(`/usuario/${usuarioBuscado.username}`)}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200 hover:border-primary-300"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      {usuarioBuscado.avatar_url ? (
                        <img
                          src={usuarioBuscado.avatar_url}
                          alt={usuarioBuscado.nome}
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextElementSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 font-bold text-xl flex items-center justify-center"
                        style={{ display: usuarioBuscado.avatar_url ? 'none' : 'flex' }}
                      >
                        {usuarioBuscado.nome?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>

                    {/* Informações do usuário */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{usuarioBuscado.nome}</h3>
                      <p className="text-sm text-primary-600">@{usuarioBuscado.username}</p>
                      {usuarioBuscado.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{usuarioBuscado.bio}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>{usuarioBuscado.estatisticas?.total_postagens || 0} posts</span>
                        <span>{usuarioBuscado.estatisticas?.total_amigos || 0} amigos</span>
                      </div>
                    </div>

                    {/* Ícone de seta */}
                    <div className="text-gray-400">
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{/* Formulário para nova postagem */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Compartilhar informação de segurança
            </h2>
            
            <form onSubmit={handleSubmitPost}>
              {/* Seletor de tipo de postagem */}
              <div className="mb-4">
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de postagem
                </label>
                <select
                  id="tipo"
                  value={tipoPostagem}
                  onChange={(e) => setTipoPostagem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="aviso">💡 Aviso Geral</option>
                  <option value="alerta">⚠️ Alerta</option>
                  <option value="emergencia">🚨 Emergência</option>
                  <option value="informacao">ℹ️ Informação</option>
                </select>
              </div>

              {/* Campo de texto da postagem */}
              <div className="mb-4">
                <textarea
                  value={novaPostagem}
                  onChange={(e) => setNovaPostagem(e.target.value)}
                  placeholder="O que está acontecendo? Compartilhe informações importantes sobre segurança..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Botão de enviar */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={enviandoPost || !novaPostagem.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  {enviandoPost ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>

          {/* Feed de postagens */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Feed da Comunidade</h2>
              <button
                onClick={carregarPostagens}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                🔄 Atualizar
              </button>
            </div>
            
            {/* Exibir erro se houver */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <span className="text-red-400 mr-2">⚠️</span>
                  <div>
                    <p className="text-red-800 font-medium">Erro ao carregar postagens</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                    <button
                      onClick={carregarPostagens}
                      className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {loading ? (
              // Loading state
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">Carregando postagens...</p>
              </div>
            ) : postagens.length === 0 && !error ? (
              // Estado vazio
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <div className="text-6xl mb-4">📢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ainda não há postagens
                </h3>
                <p className="text-gray-600 mb-6">
                  Seja o primeiro a compartilhar informações de segurança com a comunidade!
                </p>
                <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                  ✍️ Criar primeira postagem
                </button>
              </div>
            ) : (
              // Lista de postagens
              Array.isArray(postagens) ? postagens.map((postagem, index) => (
                <div 
                  key={postagem.id || index} 
                  ref={(el) => {
                    if (el) {
                      postsRefs.current[postagem.id] = el
                    }
                  }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header da postagem */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                        {postagem.usuario ? postagem.usuario.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">
                            {postagem.usuario || 'Usuário Anônimo'}
                          </p>
                          {postagem.username && (
                            <Link 
                              href={`/usuario/@${postagem.username}`}
                              className="text-sm text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              @{postagem.username}
                            </Link>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatarData(postagem.criado_em)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getTipoCor(postagem.tipo)}`}>
                        {postagem.tipo || 'aviso'}
                      </span>
                      {/* Botão de excluir (apenas para o autor da postagem) */}
                      {postagem.usuario === nomeUsuario && (
                        <button
                          onClick={() => excluirPostagem(postagem.id)}
                          className="text-red-500 hover:text-red-700 transition p-2 rounded-full hover:bg-red-50"
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        {postagem.titulo}
                      </h3>
                    </div>
                  )}

                  {/* Conteúdo da postagem */}
                  <div className="mb-4">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {postagem.conteudo || 'Conteúdo não disponível'}
                    </p>
                  </div>

                  {/* Localização (se houver) */}
                  {postagem.localizacao && (
                    <div className="mb-4 text-sm text-gray-600">
                      <span className="inline-flex items-center">
                        📍 {postagem.localizacao}
                      </span>
                    </div>
                  )}

                  {/* Ações da postagem */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <button 
                      className={`flex items-center space-x-1 transition-colors ${
                        postagem.usuarioCurtiu 
                          ? 'text-primary-600 hover:text-primary-700' 
                          : 'text-gray-500 hover:text-primary-600'
                      } ${curtindoPostagem[postagem.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => toggleCurtida(postagem.id)}
                      disabled={curtindoPostagem[postagem.id]}
                      title={postagem.usuarioCurtiu ? 'Remover curtida' : 'Curtir postagem'}
                    >
                      {curtindoPostagem[postagem.id] ? (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <span className={postagem.usuarioCurtiu ? '❤️' : '🤍'}></span>
                      )}
                      <span>{postagem.curtidas || 0} curtidas</span>
                    </button>
                    <button 
                      className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
                      onClick={() => toggleComentarios(postagem.id)}
                    >
                      <span>💬</span>
                      <span>{postagem.comentarios || 0} comentários</span>
                    </button>
                  </div>

                  {/* Seção de Comentários */}
                  {comentariosExpandidos[postagem.id] && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {/* Lista de comentários */}
                      <div className="space-y-3 mb-4">
                        {loadingComentarios[postagem.id] ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                            <span className="ml-2 text-gray-600">Carregando comentários...</span>
                          </div>
                        ) : comentarios[postagem.id] && comentarios[postagem.id].length > 0 ? (
                          comentarios[postagem.id].map((comentario) => (
                            <div key={comentario.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {comentario.usuario ? comentario.usuario.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex flex-col">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900 text-sm">
                                        {comentario.usuario || 'Usuário Anônimo'}
                                      </span>
                                      {comentario.username && (
                                        <Link 
                                          href={`/usuario/@${comentario.username}`}
                                          className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer"
                                        >
                                          @{comentario.username}
                                        </Link>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        · {comentario.data}
                                      </span>
                                    </div>
                                  </div>
                                  {/* Botão de excluir (apenas para o autor do comentário) */}
                                  {comentario.usuario === nomeUsuario && (
                                    <button
                                      onClick={() => excluirComentario(postagem.id, comentario.id)}
                                      className="text-red-500 hover:text-red-700 transition"
                                      title="Excluir comentário"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                <p className="text-gray-800 text-sm leading-relaxed">
                                  {comentario.conteudo}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">Ainda não há comentários.</p>
                            <p className="text-xs">Seja o primeiro a comentar!</p>
                          </div>
                        )}
                      </div>

                      {/* Formulário para novo comentário */}
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          U
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={novoComentario[postagem.id] || ''}
                            onChange={(e) => setNovoComentario(prev => ({ 
                              ...prev, 
                              [postagem.id]: e.target.value 
                            }))}
                            placeholder="Escreva um comentário..."
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            rows="2"
                            maxLength="500"
                            disabled={enviandoComentario[postagem.id]}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {(novoComentario[postagem.id] || '').length}/500
                            </span>
                            <button
                              onClick={() => adicionarComentario(postagem.id)}
                              disabled={
                                !novoComentario[postagem.id]?.trim() || 
                                enviandoComentario[postagem.id]
                              }
                              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              {enviandoComentario[postagem.id] ? (
                                <span className="flex items-center">
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Enviando...
                                </span>
                              ) : (
                                'Comentar'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )) : null
            )}
          </div>
        </main>

        {/* Botão flutuante para criar postagem */}
        <button 
          className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all duration-200 z-50"
          title="Criar nova postagem"
          onClick={() => {
            // TODO: Implementar modal ou redirecionamento para criar postagem
            alert('Funcionalidade de criar postagem será implementada em breve!');
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  )
}
