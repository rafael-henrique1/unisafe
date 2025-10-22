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
   * useEffect para carregar pedidos pendentes ao montar o componente
   * (para mostrar o badge mesmo sem entrar na aba)
   */
  useEffect(() => {
    carregarPedidos()
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
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Meu Perfil - UniSafe</title>
        <meta name="description" content="Gerencie suas informações pessoais no UniSafe" />
      </Head>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/feed')}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Voltar ao Feed</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Meu Perfil</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Abas de Navegação */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setAbaAtiva('perfil')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                abaAtiva === 'perfil'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 Meu Perfil
            </button>
            <button
              onClick={() => setAbaAtiva('amigos')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                abaAtiva === 'amigos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Meus Amigos
              {amigos.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                  {amigos.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setAbaAtiva('pedidos')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                abaAtiva === 'pedidos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📬 Solicitações
              {pedidosAmizade.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                  {pedidosAmizade.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mensagens */}
        {mensagem && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {mensagem}
          </div>
        )}
        
        {erro && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {erro}
          </div>
        )}

        {/* Conteúdo das Abas */}
        {abaAtiva === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Informações Gerais */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4">
                  {usuario?.avatar_url && !avatarError ? (
                    <img
                      src={usuario.avatar_url}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover border-4 border-gray-200"
                      onError={() => setAvatarError(true)}
                      onLoad={() => setAvatarError(false)}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{usuario?.nome}</h2>
                <p className="text-gray-600">{usuario?.email}</p>
                {usuario?.username && (
                  <p className="text-blue-600 font-medium">@{usuario.username}</p>
                )}
              </div>

              {/* Estatísticas */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Membro desde:</span>
                  <span className="text-gray-900">{formatarDataMembro(usuario?.membro_desde)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Postagens:</span>
                  <span className="text-gray-900">{usuario?.estatisticas?.total_postagens || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Curtidas:</span>
                  <span className="text-gray-900">{usuario?.estatisticas?.total_curtidas || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comentários:</span>
                  <span className="text-gray-900">{usuario?.estatisticas?.total_comentarios || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulários */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulário de Perfil */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
              
              <form onSubmit={salvarPerfil} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de Usuário {!usuario?.username && <span className="text-red-600">*</span>}
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
                        {amigo.bio && (
                          <p className="text-sm text-gray-600 line-clamp-1">{amigo.bio}</p>
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
                  <div key={pedido.solicitacao_id} className="flex items-center justify-between p-4 border rounded-lg">
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
                        {pedido.bio && (
                          <p className="text-sm text-gray-600 line-clamp-1">{pedido.bio}</p>
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
