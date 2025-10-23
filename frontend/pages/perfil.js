/**
 * Página de Perfil do Usuário - UniSafe
 * 
 * Esta página permite ao usuário visualizar e editar suas informações pessoais.
 * Inclui funcionalidades para atualizar nome, bio, telefone, avatar e senha.
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { endpoints } from '../config/api'
import { io } from 'socket.io-client'
import API_URL from '../config/api'

export default function Perfil() {
  const router = useRouter()

  // Estados dos dados do usuário
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Ref para Socket.IO
  const socketRef = useRef(null)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    username: '',
    bio: '',
    avatar_url: '',
    telefone: ''
  })
  
  // Estados da alteração de senha
  const [senhaData, setSenhaData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  })
  
  // Estados de UI
  const [salvando, setSalvando] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)

  // Estados de validação de username
  const [usernameJaEmUso, setUsernameJaEmUso] = useState(false)
  const [usernameInvalido, setUsernameInvalido] = useState(false)
  const [mensagemUsername, setMensagemUsername] = useState('')
  const [verificandoUsername, setVerificandoUsername] = useState(false)
  const [usernameOriginal, setUsernameOriginal] = useState('') // Para comparar se mudou
  const [editandoUsername, setEditandoUsername] = useState(false) // Modo de edição do username

  // Estados de amizade
  const [amigos, setAmigos] = useState([])
  const [pedidosAmizade, setPedidosAmizade] = useState([])
  const [loadingAmigos, setLoadingAmigos] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('perfil') // 'perfil' | 'amigos' | 'pedidos'

  /**
   * Formata o telefone no padrão (11) 99999-9999
   * @param {string} value - Valor do telefone
   * @returns {string} - Telefone formatado
   */
  const formatarTelefone = (value) => {
    // Remove tudo que não é dígito
    const apenasNumeros = value.replace(/\D/g, '')
    
    // Aplica a máscara conforme o usuário digita
    if (apenasNumeros.length === 0) {
      return ''
    } else if (apenasNumeros.length <= 2) {
      return `(${apenasNumeros}`
    } else if (apenasNumeros.length <= 6) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`
    } else if (apenasNumeros.length <= 10) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`
    } else {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`
    }
  }

  /**
   * Carrega os dados do usuário ao montar o componente
   */
  useEffect(() => {
    carregarPerfil()
  }, [])

  /**
   * Socket.IO - Atualiza contadores em tempo real
   */
  useEffect(() => {
    const token = localStorage.getItem('unisafe_token')
    const userData = localStorage.getItem('unisafe_user')
    
    if (!token || !userData) return

    const user = JSON.parse(userData)
    const socket = io(API_URL, {
      auth: { token },
      reconnection: true
    })

    socketRef.current = socket

    // Atualiza contador quando uma postagem é excluída
    socket.on('postagem_excluida', (data) => {
      // Se foi o próprio usuário que excluiu, decrementa contador
      if (data.usuarioId === user.id) {
        setUsuario(prev => {
          if (!prev || !prev.estatisticas) return prev
          return {
            ...prev,
            estatisticas: {
              ...prev.estatisticas,
              total_postagens: Math.max(0, (prev.estatisticas.total_postagens || 0) - 1)
            }
          }
        })
      }
    })

    // Atualiza contador quando uma nova postagem é criada
    socket.on('nova_postagem', (postagem) => {
      // Se foi o próprio usuário que criou, incrementa contador
      if (postagem.usuario_id === user.id) {
        setUsuario(prev => {
          if (!prev || !prev.estatisticas) return prev
          return {
            ...prev,
            estatisticas: {
              ...prev.estatisticas,
              total_postagens: (prev.estatisticas.total_postagens || 0) + 1
            }
          }
        })
      }
    })

    // Escuta nova solicitação de amizade
    socket.on('nova_solicitacao_amizade', (data) => {
      setMensagem(`${data.remetente_nome} enviou uma solicitação de amizade!`)
      // Sempre recarrega os pedidos para atualizar o badge
      carregarPedidos()
    })

    // Escuta amizade aceita
    socket.on('amizade_aceita', (data) => {
      setMensagem(`${data.amigo_nome} aceitou sua solicitação de amizade!`)
      // Recarrega amigos e pedidos para atualizar badges
      carregarAmigos()
      carregarPedidos()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  /**
   * Carrega o perfil do usuário logado
   */
  const carregarPerfil = async () => {
    try {
      const token = localStorage.getItem('unisafe_token')
      const userData = localStorage.getItem('unisafe_user')
      
      if (!token || !userData) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userData)
      
      const response = await fetch(`${endpoints.usuarios}/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsuario(data.data)
        setUsernameOriginal(data.data.username || '') // Salva username original
        setFormData({
          nome: data.data.nome || '',
          username: data.data.username || '',
          bio: data.data.bio || '',
          avatar_url: data.data.avatar_url || '',
          telefone: formatarTelefone(data.data.telefone || '')
        })
      } else if (response.status === 401) {
        // Token inválido, redireciona para login
        localStorage.removeItem('unisafe_token')
        localStorage.removeItem('unisafe_user')
        router.push('/login')
      } else {
        setErro('Erro ao carregar perfil')
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      setErro('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Atualiza o perfil básico (nome, bio, telefone, avatar)
   */
  const salvarPerfil = async (e) => {
    e.preventDefault()
    setMensagem('')
    setErro('')
    setSalvando(true)

    try {
      const token = localStorage.getItem('unisafe_token')
      const userData = localStorage.getItem('unisafe_user')
      const user = JSON.parse(userData)

      const response = await fetch(`${endpoints.usuarios}/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setMensagem('Perfil atualizado com sucesso!')
        
        // Atualiza o estado do usuário com todos os dados retornados
        setUsuario(prev => ({ 
          ...prev, 
          nome: data.data.nome,
          username: data.data.username,
          bio: data.data.bio,
          avatar_url: data.data.avatar_url,
          telefone: data.data.telefone
        }))
        
        // Atualiza username original se mudou
        if (data.data.username) {
          setUsernameOriginal(data.data.username)
        }
        
        // Atualiza o formData com o telefone formatado
        setFormData(prev => ({
          ...prev,
          telefone: formatarTelefone(data.data.telefone || '')
        }))
        
        // Reset avatar error para tentar carregar nova imagem
        setAvatarError(false)
        
        // Atualiza os dados do usuário no localStorage
        const updatedUser = { ...user, nome: data.data.nome, username: data.data.username }
        localStorage.setItem('unisafe_user', JSON.stringify(updatedUser))
      } else {
        setErro(data.message || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      setErro('Erro ao salvar perfil')
    } finally {
      setSalvando(false)
    }
  }

  /**
   * Altera a senha do usuário
   */
  const alterarSenha = async (e) => {
    e.preventDefault()
    setMensagem('')
    setErro('')

    // Validações
    if (senhaData.novaSenha !== senhaData.confirmarSenha) {
      setErro('As senhas não coincidem')
      return
    }

    if (senhaData.novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setSalvandoSenha(true)

    try {
      const token = localStorage.getItem('unisafe_token')
      const userData = localStorage.getItem('unisafe_user')
      const user = JSON.parse(userData)

      const response = await fetch(`${endpoints.usuarios}/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senha: senhaData.novaSenha,
          senhaAtual: senhaData.senhaAtual
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMensagem('Senha alterada com sucesso!')
        setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
        setMostrarAlterarSenha(false)
      } else {
        setErro(data.message || 'Erro ao alterar senha')
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      setErro('Erro ao alterar senha')
    } finally {
      setSalvandoSenha(false)
    }
  }

  /**
   * Verifica se o username já está em uso
   */
  const verificarUsernameDisponivel = async (username) => {
    const usernameClean = username.trim().toLowerCase()
    
    // Se não mudou o username, não precisa verificar
    if (usernameClean === usernameOriginal.toLowerCase()) {
      setUsernameJaEmUso(false)
      setUsernameInvalido(false)
      setMensagemUsername('')
      return
    }
    
    if (!usernameClean || usernameClean.length < 3) {
      setUsernameJaEmUso(false)
      setUsernameInvalido(false)
      setMensagemUsername('')
      return
    }

    setVerificandoUsername(true)
    setUsernameJaEmUso(false)
    setUsernameInvalido(false)
    setMensagemUsername('')
    
    try {
      const response = await fetch(`${endpoints.usuarios}/verificar-username?username=${encodeURIComponent(usernameClean)}`)
      
      if (response.ok) {
        const result = await response.json()
        
        if (!result.valido) {
          setUsernameInvalido(true)
          setMensagemUsername(result.mensagem || 'Nome de usuário inválido')
        } else if (result.existe) {
          setUsernameJaEmUso(true)
          setMensagemUsername('Este nome de usuário já está em uso')
        } else {
          setMensagemUsername('✓ Nome de usuário disponível')
        }
      }
    } catch (err) {
      console.error('Erro ao verificar username:', err)
    } finally {
      setVerificandoUsername(false)
    }
  }

  /**
   * Manipula quando o usuário sai do campo de username
   */
  const handleUsernameBlur = () => {
    if (formData.username) {
      verificarUsernameDisponivel(formData.username)
    }
  }

  /**
   * Valida formato do username enquanto digita
   */
  const handleUsernameChange = (e) => {
    const value = e.target.value
    
    // Converte para minúsculas e remove caracteres não permitidos
    let usernameClean = value.toLowerCase().replace(/[^a-z0-9._]/g, '')
    
    // Limita a 30 caracteres
    if (usernameClean.length > 30) {
      usernameClean = usernameClean.substring(0, 30)
    }
    
    setFormData(prev => ({
      ...prev,
      username: usernameClean
    }))
    
    // Limpa mensagens se o campo estiver vazio
    if (!usernameClean) {
      setUsernameJaEmUso(false)
      setUsernameInvalido(false)
      setMensagemUsername('')
    }
  }

  /**
   * Cancela a edição do username
   */
  const cancelarEdicaoUsername = () => {
    setFormData(prev => ({
      ...prev,
      username: usernameOriginal
    }))
    setEditandoUsername(false)
    setUsernameJaEmUso(false)
    setUsernameInvalido(false)
    setMensagemUsername('')
  }

  /**
   * Salva apenas o username
   */
  const salvarUsername = async () => {
    if (!formData.username || formData.username.length < 3) {
      setErro('Username deve ter pelo menos 3 caracteres')
      return
    }

    if (usernameJaEmUso) {
      setErro('Este nome de usuário já está em uso')
      return
    }

    setMensagem('')
    setErro('')
    setSalvando(true)

    try {
      const token = localStorage.getItem('unisafe_token')
      const userData = localStorage.getItem('unisafe_user')
      const user = JSON.parse(userData)

      const response = await fetch(`${endpoints.usuarios}/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: formData.username })
      })

      const data = await response.json()

      if (response.ok) {
        setMensagem('Nome de usuário atualizado com sucesso!')
        
        // Atualiza o estado do usuário
        setUsuario(prev => ({ 
          ...prev, 
          username: data.data.username
        }))
        
        // Atualiza username original
        setUsernameOriginal(data.data.username)
        
        // Sai do modo de edição
        setEditandoUsername(false)
        
        // Atualiza os dados do usuário no localStorage
        const updatedUser = { ...user, username: data.data.username }
        localStorage.setItem('unisafe_user', JSON.stringify(updatedUser))
      } else {
        setErro(data.message || 'Erro ao atualizar username')
      }
    } catch (error) {
      console.error('Erro ao salvar username:', error)
      setErro('Erro ao salvar username')
    } finally {
      setSalvando(false)
    }
  }

  /**
   * Carrega lista de amigos do usuário
   */
  const carregarAmigos = async () => {
    setLoadingAmigos(true)
    try {
      const token = localStorage.getItem('unisafe_token')
      const userData = localStorage.getItem('unisafe_user')
      const user = JSON.parse(userData)

      const response = await fetch(endpoints.amigos.lista(user.id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAmigos(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar amigos:', error)
    } finally {
      setLoadingAmigos(false)
    }
  }

  /**
   * Carrega pedidos de amizade pendentes
   */
  const carregarPedidos = async () => {
    setLoadingAmigos(true)
    try {
      const token = localStorage.getItem('unisafe_token')

      const response = await fetch(endpoints.amigos.pedidos, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPedidosAmizade(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setLoadingAmigos(false)
    }
  }

  /**
   * Aceita uma solicitação de amizade
   */
  const aceitarAmizade = async (solicitacaoId) => {
    try {
      const token = localStorage.getItem('unisafe_token')

      const response = await fetch(endpoints.amigos.aceitar, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ solicitacao_id: solicitacaoId })
      })

      if (response.ok) {
        setMensagem('Amizade aceita!')
        carregarPedidos()
        carregarAmigos()
      } else {
        const data = await response.json()
        setErro(data.message || 'Erro ao aceitar amizade')
      }
    } catch (error) {
      console.error('Erro ao aceitar amizade:', error)
      setErro('Erro ao aceitar amizade')
    }
  }

  /**
   * Recusa uma solicitação de amizade
   */
  const recusarAmizade = async (solicitacaoId) => {
    try {
      const token = localStorage.getItem('unisafe_token')

      const response = await fetch(endpoints.amigos.recusar, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ solicitacao_id: solicitacaoId })
      })

      if (response.ok) {
        setMensagem('Solicitação recusada')
        carregarPedidos()
      } else {
        const data = await response.json()
        setErro(data.message || 'Erro ao recusar amizade')
      }
    } catch (error) {
      console.error('Erro ao recusar amizade:', error)
      setErro('Erro ao recusar amizade')
    }
  }

  /**
   * Remove um amigo
   */
  const removerAmigo = async (amigoId) => {
    if (!confirm('Tem certeza que deseja remover este amigo?')) return

    try {
      const token = localStorage.getItem('unisafe_token')

      const response = await fetch(endpoints.amigos.remover(amigoId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setMensagem('Amigo removido')
        carregarAmigos()
      } else {
        const data = await response.json()
        setErro(data.message || 'Erro ao remover amigo')
      }
    } catch (error) {
      console.error('Erro ao remover amigo:', error)
      setErro('Erro ao remover amigo')
    }
  }

  /**
   * useEffect para carregar pedidos e amigos ao montar o componente
   * (para mostrar os badges mesmo sem entrar nas abas)
   */
  useEffect(() => {
    carregarPedidos()
    carregarAmigos()
  }, [])

  /**
   * useEffect para carregar amigos e pedidos quando a aba mudar
   */
  useEffect(() => {
    if (abaAtiva === 'amigos') {
      carregarAmigos()
    } else if (abaAtiva === 'pedidos') {
      carregarPedidos()
    }
  }, [abaAtiva])

  /**
   * Formata a data de membro desde
   */
  const formatarDataMembro = (data) => {
    if (!data) return ''
    return new Date(data).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long'
    })
  }

  /**
   * Limpa mensagens após um tempo
   */
  useEffect(() => {
    if (mensagem || erro) {
      const timer = setTimeout(() => {
        setMensagem('')
        setErro('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [mensagem, erro])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-100">
      <Head>
        <title>Meu Perfil - UniSafe</title>
        <meta name="description" content="Gerencie suas informações pessoais no UniSafe" />
      </Head>

      {/* Header com gradiente */}
      <div className="bg-white/80 backdrop-blur-md shadow-soft border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/feed')}
              className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Voltar ao Feed</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Meu Perfil
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Abas de Navegação modernas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium border border-neutral-200 mb-8 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setAbaAtiva('perfil')}
              className={`flex-1 px-6 py-5 text-sm font-semibold transition-all relative ${
                abaAtiva === 'perfil'
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Meu Perfil</span>
              </div>
              {abaAtiva === 'perfil' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary"></div>
              )}
            </button>
            
            <button
              onClick={() => setAbaAtiva('amigos')}
              className={`flex-1 px-6 py-5 text-sm font-semibold transition-all relative ${
                abaAtiva === 'amigos'
                  ? 'text-accent-700 bg-accent-50'
                  : 'text-neutral-600 hover:text-accent-600 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Meus Amigos</span>
                <span className="px-2.5 py-0.5 bg-accent-500 text-white text-xs font-bold rounded-full shadow-sm">
                  {amigos.length}
                </span>
              </div>
              {abaAtiva === 'amigos' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-accent"></div>
              )}
            </button>
            
            <button
              onClick={() => setAbaAtiva('pedidos')}
              className={`flex-1 px-6 py-5 text-sm font-semibold transition-all relative ${
                abaAtiva === 'pedidos'
                  ? 'text-warning-700 bg-warning-50'
                  : 'text-neutral-600 hover:text-warning-600 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
                <span>Solicitações</span>
                {pedidosAmizade.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-danger-500 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                    {pedidosAmizade.length}
                  </span>
                )}
              </div>
              {abaAtiva === 'pedidos' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-warning-500 to-warning-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Mensagens */}
        {mensagem && (
          <div className="mb-6 bg-accent-50 border-l-4 border-accent-500 text-accent-800 px-5 py-4 rounded-xl flex items-start gap-3 shadow-soft animate-in">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span className="flex-1 text-sm font-medium">{mensagem}</span>
          </div>
        )}
        
        {erro && (
          <div className="mb-6 bg-danger-50 border-l-4 border-danger-500 text-danger-800 px-5 py-4 rounded-xl flex items-start gap-3 shadow-soft">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span className="flex-1 text-sm font-medium">{erro}</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        {abaAtiva === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Informações Gerais */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium border border-neutral-200 p-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto mb-4 relative group">
                  {usuario?.avatar_url && !avatarError ? (
                    <img
                      src={usuario.avatar_url}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover border-4 border-white shadow-medium ring-2 ring-primary-200 group-hover:ring-primary-400 transition-all"
                      onError={() => setAvatarError(true)}
                      onLoad={() => setAvatarError(false)}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-primary flex items-center justify-center text-white text-4xl font-bold shadow-medium ring-2 ring-primary-200 group-hover:ring-primary-400 transition-all">
                      {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {/* Badge de verificação (decorativo) */}
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft">
                    <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Info do usuário */}
                <h2 className="text-2xl font-bold text-neutral-800">{usuario?.nome}</h2>
                <p className="text-sm text-neutral-600">{usuario?.email}</p>
                {usuario?.username && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 rounded-lg mt-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <span className="text-primary-700 font-semibold text-sm">@{usuario.username}</span>
                  </div>
                )}
              </div>

              {/* Estatísticas com ícones */}
              <div className="space-y-3 pt-6 border-t border-neutral-200">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-4">Estatísticas</h3>
                
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Membro desde</span>
                  </div>
                  <span className="text-sm font-bold text-neutral-800">{formatarDataMembro(usuario?.membro_desde)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Postagens</span>
                  </div>
                  <span className="px-3 py-1 bg-accent-500 text-white text-sm font-bold rounded-lg shadow-sm">{usuario?.estatisticas?.total_postagens || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-danger-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Curtidas</span>
                  </div>
                  <span className="px-3 py-1 bg-danger-500 text-white text-sm font-bold rounded-lg shadow-sm">{usuario?.estatisticas?.total_curtidas || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Comentários</span>
                  </div>
                  <span className="px-3 py-1 bg-warning-500 text-white text-sm font-bold rounded-lg shadow-sm">{usuario?.estatisticas?.total_comentarios || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulários */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulário de Perfil */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-800">Informações Pessoais</h3>
              </div>
              
              <form onSubmit={salvarPerfil} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-neutral-800"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Nome de Usuário {!usuario?.username && <span className="text-danger-600">*</span>}
                  </label>
                  
                  {!editandoUsername ? (
                    // Modo de Visualização
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {usuario?.username ? (
                          <span className="text-gray-900 font-medium">@{usuario.username}</span>
                        ) : (
                          <span className="text-gray-400 italic">Nenhum username definido</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditandoUsername(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>{usuario?.username ? 'Editar' : 'Definir'}</span>
                      </button>
                    </div>
                  ) : (
                    // Modo de Edição
                    <div className="space-y-3">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                          @
                        </span>
                        <input
                          type="text"
                          required={!usuario?.username}
                          minLength={3}
                          maxLength={30}
                          value={formData.username}
                          onChange={handleUsernameChange}
                          onBlur={handleUsernameBlur}
                          autoFocus
                          className={`w-full pl-8 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            verificandoUsername 
                              ? 'border-gray-300' 
                              : usernameJaEmUso 
                                ? 'border-red-500' 
                                : formData.username && !usernameJaEmUso && formData.username !== usernameOriginal
                                  ? 'border-green-500'
                                  : 'border-gray-300'
                          }`}
                          placeholder="seunome123"
                          disabled={verificandoUsername}
                        />
                        {verificandoUsername && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                        {!verificandoUsername && usernameJaEmUso && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {!verificandoUsername && !usernameJaEmUso && formData.username && formData.username !== usernameOriginal && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {usernameJaEmUso && (
                        <p className="text-xs text-red-600">Este nome de usuário já está em uso</p>
                      )}
                      {!usernameJaEmUso && formData.username && formData.username !== usernameOriginal && (
                        <p className="text-xs text-green-600">Nome de usuário disponível!</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Use apenas letras minúsculas, números, pontos e underscores (3-30 caracteres)
                      </p>
                      
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={salvarUsername}
                          disabled={salvando || usernameJaEmUso || !formData.username || formData.username.length < 3}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{salvando ? 'Salvando...' : 'Salvar Username'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={cancelarEdicaoUsername}
                          disabled={salvando}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    maxLength={200}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Conte um pouco sobre você..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/200 caracteres</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: formatarTelefone(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                    maxLength="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato: (XX) XXXXX-XXXX</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Avatar
                  </label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, avatar_url: e.target.value }))
                      setAvatarError(false) // Reset avatar error when URL changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemplo.com/sua-foto.jpg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>

            {/* Seção de Alterar Senha */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Segurança</h3>
                <button
                  onClick={() => setMostrarAlterarSenha(!mostrarAlterarSenha)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {mostrarAlterarSenha ? 'Cancelar' : 'Alterar Senha'}
                </button>
              </div>

              {mostrarAlterarSenha && (
                <form onSubmit={alterarSenha} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha Atual *
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarSenhaAtual ? "text" : "password"}
                        required
                        value={senhaData.senhaAtual}
                        onChange={(e) => setSenhaData(prev => ({ ...prev, senhaAtual: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        aria-label={mostrarSenhaAtual ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {mostrarSenhaAtual ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha *
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarNovaSenha ? "text" : "password"}
                        required
                        minLength={6}
                        value={senhaData.novaSenha}
                        onChange={(e) => setSenhaData(prev => ({ ...prev, novaSenha: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite a nova senha (mín. 6 caracteres)"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        aria-label={mostrarNovaSenha ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {mostrarNovaSenha ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nova Senha *
                    </label>
                    <input
                      type="password"
                      required
                      value={senhaData.confirmarSenha}
                      onChange={(e) => setSenhaData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirme a nova senha"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={salvandoSenha}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {salvandoSenha ? 'Alterando...' : 'Alterar Senha'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Aba de Amigos */}
        {abaAtiva === 'amigos' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Meus Amigos</h2>
            
            {loadingAmigos ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando amigos...</p>
              </div>
            ) : amigos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-600 mb-2">Você ainda não tem amigos</p>
                <p className="text-sm text-gray-500">Explore o feed e adicione pessoas da sua comunidade</p>
              </div>
            ) : (
              <div className="space-y-4">
                {amigos.map((amigo) => (
                  <div key={amigo.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-4">
                      {amigo.foto_perfil ? (
                        <img
                          src={amigo.foto_perfil}
                          alt={amigo.nome}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {amigo.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{amigo.nome}</h3>
                        {amigo.username && (
                          <button
                            onClick={() => router.push(`/usuario/${amigo.username}`)}
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition"
                          >
                            @{amigo.username}
                          </button>
                        )}
                        {amigo.bio && (
                          <p className="text-sm text-gray-600 line-clamp-1 mt-1">{amigo.bio}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Amigos desde {new Date(amigo.amigos_desde).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removerAmigo(amigo.id)}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba de Solicitações */}
        {abaAtiva === 'pedidos' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Solicitações de Amizade</h2>
            
            {loadingAmigos ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando solicitações...</p>
              </div>
            ) : pedidosAmizade.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📬</div>
                <p className="text-gray-600 mb-2">Nenhuma solicitação pendente</p>
                <p className="text-sm text-gray-500">Você receberá notificações quando alguém te adicionar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pedidosAmizade.map((pedido) => (
                  <div key={pedido.solicitacao_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-4">
                      {pedido.foto_perfil ? (
                        <img
                          src={pedido.foto_perfil}
                          alt={pedido.nome}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {pedido.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{pedido.nome}</h3>
                        {pedido.username && (
                          <button
                            onClick={() => router.push(`/usuario/${pedido.username}`)}
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition"
                          >
                            @{pedido.username}
                          </button>
                        )}
                        {pedido.bio && (
                          <p className="text-sm text-gray-600 line-clamp-1 mt-1">{pedido.bio}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Enviado em {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => aceitarAmizade(pedido.solicitacao_id)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => recusarAmizade(pedido.solicitacao_id)}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
