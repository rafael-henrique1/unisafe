/**
 * Página de Perfil Público - UniSafe
 * 
 * Esta página exibe o perfil público de um usuário (apenas visualização).
 * Acesso via /usuario/@username
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import API_URL, { endpoints } from '../../config/api'

export default function PerfilPublico() {
  const router = useRouter()
  const { username } = router.query

  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  
  // Estados de amizade
  const [statusAmizade, setStatusAmizade] = useState(null)
  const [loadingAmizade, setLoadingAmizade] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [mensagemTipo, setMensagemTipo] = useState('') // 'sucesso' ou 'erro'
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  
  // Estados de postagens
  const [postagens, setPostagens] = useState([])
  const [loadingPostagens, setLoadingPostagens] = useState(true)
  
  // Estados do modal de amigos
  const [mostrarModalAmigos, setMostrarModalAmigos] = useState(false)
  const [amigos, setAmigos] = useState([])
  const [loadingAmigos, setLoadingAmigos] = useState(false)

  /**
   * Carrega o perfil público do usuário
   */
  useEffect(() => {
    if (username) {
      // Carrega dados do usuário logado
      const userData = localStorage.getItem('unisafe_user')
      if (userData) {
        setUsuarioLogado(JSON.parse(userData))
      }
      
      carregarPerfilPublico()
    }
  }, [username])

  /**
   * Carrega status de amizade quando o perfil é carregado
   */
  useEffect(() => {
    if (usuario && usuarioLogado && usuario.id !== usuarioLogado.id) {
      verificarStatusAmizade()
    }
  }, [usuario, usuarioLogado])

  /**
   * Carrega as postagens do usuário quando o perfil é carregado
   */
  useEffect(() => {
    if (usuario) {
      carregarPostagensUsuario()
    }
  }, [usuario])

  const carregarPerfilPublico = async () => {
    try {
      setLoading(true)
      setErro('')
      
      // Remove @ se vier na URL
      const usernameClean = username.replace('@', '')
      
      const response = await fetch(`${API_URL}/api/usuarios/perfil/${usernameClean}`)

      if (response.ok) {
        const data = await response.json()
        setUsuario(data.data)
      } else if (response.status === 404) {
        setErro('Usuário não encontrado')
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
   * Verifica o status de amizade com o usuário do perfil
   */
  const verificarStatusAmizade = async () => {
    try {
      const token = localStorage.getItem('unisafe_token')
      if (!token) return

      const response = await fetch(endpoints.amigos.status(usuario.id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatusAmizade(data.data)
      }
    } catch (error) {
      console.error('Erro ao verificar status de amizade:', error)
    }
  }

  /**
   * Carrega as postagens do usuário
   */
  const carregarPostagensUsuario = async () => {
    try {
      setLoadingPostagens(true)
      
      console.log(`[PERFIL PÚBLICO] Carregando postagens do usuário ID: ${usuario.id}`)
      
      const response = await fetch(`${API_URL}/api/postagens/usuario/${usuario.id}`, {
        cache: 'no-cache', // Evita cache
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`[PERFIL PÚBLICO] ${data.data?.length || 0} postagens recebidas`)
        setPostagens(data.data || [])
      } else {
        console.error('[PERFIL PÚBLICO] Erro ao carregar postagens:', response.status)
        setPostagens([])
      }
    } catch (error) {
      console.error('[PERFIL PÚBLICO] Erro ao carregar postagens:', error)
      setPostagens([])
    } finally {
      setLoadingPostagens(false)
    }
  }

  /**
   * Carrega a lista de amigos do usuário
   */
  const carregarAmigos = async () => {
    if (!usuario?.id) return
    
    try {
      setLoadingAmigos(true)
      const token = localStorage.getItem('unisafe_token')
      
      const response = await fetch(`${API_URL}/api/amigos/lista/${usuario.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAmigos(data.data || [])
      } else {
        setAmigos([])
      }
    } catch (error) {
      console.error('Erro ao carregar amigos:', error)
      setAmigos([])
    } finally {
      setLoadingAmigos(false)
    }
  }

  /**
   * Abre o modal de amigos e carrega a lista
   */
  const abrirModalAmigos = () => {
    setMostrarModalAmigos(true)
    carregarAmigos()
  }

  /**
   * Envia solicitação de amizade
   */
  const enviarSolicitacao = async () => {
    try {
      setLoadingAmizade(true)
      const token = localStorage.getItem('unisafe_token')

      const response = await fetch(endpoints.amigos.enviar, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amigo_id: usuario.id })
      })

      if (response.ok) {
        mostrarMensagem('Solicitação de amizade enviada!', 'sucesso')
        verificarStatusAmizade() // Atualiza status
      } else {
        const data = await response.json()
        mostrarMensagem(data.message || 'Erro ao enviar solicitação', 'erro')
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error)
      mostrarMensagem('Erro ao enviar solicitação', 'erro')
    } finally {
      setLoadingAmizade(false)
    }
  }

  /**
   * Aceita solicitação de amizade
   */
  const aceitarSolicitacao = async () => {
    try {
      setLoadingAmizade(true)
      const token = localStorage.getItem('unisafe_token')

      const response = await fetch(endpoints.amigos.aceitar, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ solicitacao_id: statusAmizade.solicitacao_id })
      })

      if (response.ok) {
        mostrarMensagem('Amizade aceita!', 'sucesso')
        verificarStatusAmizade()
      } else {
        const data = await response.json()
        mostrarMensagem(data.message || 'Erro ao aceitar amizade', 'erro')
      }
    } catch (error) {
      console.error('Erro ao aceitar amizade:', error)
      mostrarMensagem('Erro ao aceitar amizade', 'erro')
    } finally {
      setLoadingAmizade(false)
    }
  }

  /**
   * Remove amizade
   */
  const removerAmizade = async () => {
    if (!confirm(`Tem certeza que deseja remover ${usuario.nome} dos seus amigos?`)) return

    try {
      setLoadingAmizade(true)
      const token = localStorage.getItem('unisafe_token')

      const response = await fetch(endpoints.amigos.remover(usuario.id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        mostrarMensagem('Amizade removida', 'sucesso')
        verificarStatusAmizade()
      } else {
        const data = await response.json()
        mostrarMensagem(data.message || 'Erro ao remover amizade', 'erro')
      }
    } catch (error) {
      console.error('Erro ao remover amizade:', error)
      mostrarMensagem('Erro ao remover amizade', 'erro')
    } finally {
      setLoadingAmizade(false)
    }
  }

  /**
   * Mostra mensagem temporária
   */
  const mostrarMensagem = (msg, tipo) => {
    setMensagem(msg)
    setMensagemTipo(tipo)
    setTimeout(() => {
      setMensagem('')
      setMensagemTipo('')
    }, 4000)
  }

  /**
   * Renderiza botão de amizade baseado no status
   */
  const renderizarBotaoAmizade = () => {
    if (!usuarioLogado) {
      return (
        <Link 
          href="/login"
          className="px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span>Login para Adicionar</span>
        </Link>
      )
    }

    if (!statusAmizade) return null

    // Próprio usuário
    if (statusAmizade.status === 'proprio_usuario') {
      return (
        <Link
          href="/perfil"
          className="px-6 py-3 bg-gradient-to-r from-neutral-600 to-neutral-700 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Editar Meu Perfil</span>
        </Link>
      )
    }

    // Não são amigos - pode enviar solicitação
    if (statusAmizade.status === 'nao_amigo') {
      return (
        <button
          onClick={enviarSolicitacao}
          disabled={loadingAmizade}
          className="px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>{loadingAmizade ? 'Enviando...' : 'Adicionar Amigo'}</span>
        </button>
      )
    }

    // Solicitação pendente enviada por você
    if (statusAmizade.status === 'pendente' && statusAmizade.enviada_por_mim) {
      return (
        <button
          disabled
          className="px-6 py-3 bg-gradient-to-r from-warning-400 to-warning-500 text-white rounded-xl cursor-not-allowed font-medium flex items-center space-x-2 shadow-md"
        >
          <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Solicitação Enviada</span>
        </button>
      )
    }

    // Solicitação pendente recebida - pode aceitar
    if (statusAmizade.status === 'pendente' && statusAmizade.pode_aceitar) {
      return (
        <button
          onClick={aceitarSolicitacao}
          disabled={loadingAmizade}
          className="px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{loadingAmizade ? 'Aceitando...' : 'Aceitar Solicitação'}</span>
        </button>
      )
    }

    // Já são amigos
    if (statusAmizade.status === 'aceito') {
      return (
        <button
          onClick={removerAmizade}
          disabled={loadingAmizade}
          className="px-6 py-3 bg-gradient-to-r from-danger-500 to-danger-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
          </svg>
          <span>{loadingAmizade ? 'Removendo...' : 'Remover Amigo'}</span>
        </button>
      )
    }

    return null
  }

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
   * Formata a data da postagem
   */
  const formatarDataPostagem = (data) => {
    if (!data) return 'Data inválida'
    
    // Garante que a data seja interpretada como UTC
    let dataUTC = data;
    if (!data.endsWith('Z') && !data.includes('+')) {
      dataUTC = data + 'Z';
    }
    
    const dataObj = new Date(dataUTC)
    
    // Verifica se a data é válida
    if (isNaN(dataObj.getTime())) return 'Data inválida'
    
    // Ajusta manualmente para horário de Brasília (UTC-3)
    // Subtrai 3 horas em milissegundos
    const dataBrasilia = new Date(dataObj.getTime() - (3 * 60 * 60 * 1000));
    
    // Formata a data
    return dataBrasilia.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' às ' + dataBrasilia.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Retorna cor do badge baseado no tipo
   */
  const getTipoCor = (tipo) => {
    switch (tipo) {
      case 'aviso':
        return 'bg-yellow-100 text-yellow-800'
      case 'denuncia':
        return 'bg-red-100 text-red-800'
      case 'ajuda':
        return 'bg-purple-100 text-purple-800'
      case 'discussao':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="mt-6 text-neutral-600 font-medium">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-accent-50">
        <Head>
          <title>Usuário não encontrado - UniSafe</title>
        </Head>

        {/* Header com botão voltar */}
        <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-primary-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Perfil</h1>
            </div>
          </div>
        </header>

        {/* Erro */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white/80 backdrop-blur-sm border-2 border-danger-200 rounded-2xl p-8 text-center shadow-medium">
            <div className="text-6xl mb-6">😕</div>
            <h2 className="text-3xl font-bold text-danger-700 mb-3">{erro}</h2>
            <p className="text-danger-600 mb-8 text-lg">
              O usuário @{username?.replace('@', '')} não foi encontrado.
            </p>
            <Link 
              href="/feed"
              className="inline-flex items-center px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Voltar ao Feed
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-accent-50">
      <Head>
        <title>@{usuario?.username} - UniSafe</title>
        <meta name="description" content={`Perfil de ${usuario?.nome} no UniSafe`} />
      </Head>

      {/* Header com botão voltar */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-primary-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Perfil Público</h1>
            </div>
            <Link 
              href="/feed"
              className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl font-medium transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Feed</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mensagens de feedback */}
      {mensagem && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className={`p-4 rounded-xl backdrop-blur-sm shadow-medium border-2 ${
            mensagemTipo === 'sucesso' 
              ? 'bg-accent-50/80 border-accent-300 text-accent-800' 
              : 'bg-danger-50/80 border-danger-300 text-danger-800'
          }`}>
            <div className="flex items-center">
              {mensagemTipo === 'sucesso' ? (
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-semibold">{mensagem}</span>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo do perfil */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium overflow-hidden border border-primary-100">
          {/* Banner e Avatar */}
          <div className="relative">
            {/* Banner colorido com gradiente */}
            <div className="h-40 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-4 right-4 flex space-x-2">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full animate-pulse"></div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full animate-pulse delay-75"></div>
              </div>
            </div>
            
            {/* Avatar com borda gradiente */}
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-full blur-md opacity-50"></div>
                {usuario?.avatar_url && !avatarError ? (
                  <img
                    src={usuario.avatar_url}
                    alt={usuario.nome}
                    className="relative w-32 h-32 rounded-full border-4 border-white shadow-strong object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-strong bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {usuario?.nome?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informações do usuário */}
          <div className="pt-20 px-8 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-neutral-900 mb-2">{usuario?.nome}</h2>
                <p className="text-xl bg-gradient-primary bg-clip-text text-transparent font-semibold mb-4">@{usuario?.username}</p>
                
                {usuario?.bio && (
                  <p className="text-neutral-700 mb-4 leading-relaxed">{usuario.bio}</p>
                )}

                <div className="flex items-center text-neutral-600 text-sm">
                  <div className="flex items-center px-3 py-1.5 bg-neutral-100 rounded-lg">
                    <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Membro desde {formatarDataMembro(usuario?.membro_desde)}</span>
                  </div>
                </div>
              </div>

              {/* Botão de Amizade */}
              <div className="ml-4">
                {renderizarBotaoAmizade()}
              </div>
            </div>

            {/* Estatísticas com ícones coloridos */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200">
              <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 hover:shadow-medium transition-all duration-200">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {usuario?.estatisticas?.total_postagens || 0}
                </div>
                <div className="text-sm text-neutral-700 font-medium mt-1">Postagens</div>
              </div>
              <button
                onClick={abrirModalAmigos}
                className="text-center p-4 bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl border border-accent-200 hover:shadow-medium transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-accent-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                  {usuario?.estatisticas?.total_amigos || 0}
                </div>
                <div className="text-sm text-neutral-700 font-medium mt-1">Amigos</div>
              </button>
              <div className="text-center p-4 bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl border border-warning-200 hover:shadow-medium transition-all duration-200">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-warning-600">
                  {usuario?.estatisticas?.total_comentarios || 0}
                </div>
                <div className="text-sm text-neutral-700 font-medium mt-1">Comentários</div>
              </div>
            </div>

            {/* Aviso de perfil público */}
            <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200 rounded-xl backdrop-blur-sm">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-primary-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-primary-800 font-semibold">Perfil Público</p>
                  <p className="text-sm text-primary-700 mt-1">
                    Você está visualizando o perfil público de <strong>@{usuario?.username}</strong>. 
                    Informações sensíveis como email e telefone não são exibidas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Postagens */}
        <div className="mt-8">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Postagens de @{usuario?.username}
            </h2>
          </div>

          {loadingPostagens ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium p-12 text-center border border-primary-100">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600 font-medium">Carregando postagens...</p>
            </div>
          ) : postagens.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium p-12 text-center border border-primary-100">
              <div className="text-7xl mb-4">📝</div>
              <p className="text-neutral-600 text-lg font-semibold mb-2">Nenhuma postagem ainda</p>
              <p className="text-sm text-neutral-500">
                @{usuario?.username} ainda não publicou nada no UniSafe
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {postagens.map((postagem) => (
                <div 
                  key={postagem.id} 
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-medium hover:shadow-strong p-6 transition-all duration-200 border-l-4 border border-neutral-100"
                  style={{
                    borderLeftColor: 
                      postagem.tipo === 'emergencia' ? '#ef4444' :
                      postagem.tipo === 'alerta' ? '#f59e0b' :
                      postagem.tipo === 'informacao' ? '#14b8a6' :
                      '#3b82f6'
                  }}
                >
                  {/* Header da postagem */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                        style={{
                          background: 
                            postagem.tipo === 'emergencia' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                            postagem.tipo === 'alerta' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                            postagem.tipo === 'informacao' ? 'linear-gradient(135deg, #14b8a6, #0d9488)' :
                            'linear-gradient(135deg, #3b82f6, #2563eb)'
                        }}
                      >
                        {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-neutral-900">
                            {usuario?.nome}
                          </p>
                          <Link 
                            href={`/usuario/@${usuario?.username}`}
                            className="text-sm bg-gradient-primary bg-clip-text text-transparent font-semibold hover:underline"
                          >
                            @{usuario?.username}
                          </Link>
                        </div>
                        <p className="text-sm text-neutral-500 font-medium">
                          {formatarDataPostagem(postagem.criado_em)}
                        </p>
                      </div>
                    </div>
                    <span 
                      className="px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-sm"
                      style={{
                        background: 
                          postagem.tipo === 'emergencia' ? 'linear-gradient(135deg, #fecaca, #fca5a5)' :
                          postagem.tipo === 'alerta' ? 'linear-gradient(135deg, #fde68a, #fcd34d)' :
                          postagem.tipo === 'informacao' ? 'linear-gradient(135deg, #99f6e4, #5eead4)' :
                          'linear-gradient(135deg, #bfdbfe, #93c5fd)',
                        color: 
                          postagem.tipo === 'emergencia' ? '#991b1b' :
                          postagem.tipo === 'alerta' ? '#92400e' :
                          postagem.tipo === 'informacao' ? '#134e4a' :
                          '#1e3a8a'
                      }}
                    >
                      {postagem.tipo || 'aviso'}
                    </span>
                  </div>

                  {/* Título da postagem (se houver) */}
                  {postagem.titulo && (
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-neutral-900">
                        {postagem.titulo}
                      </h3>
                    </div>
                  )}

                  {/* Conteúdo da postagem */}
                  <div className="mb-4">
                    <p className="text-neutral-800 leading-relaxed whitespace-pre-wrap">
                      {postagem.conteudo || 'Conteúdo não disponível'}
                    </p>
                  </div>

                  {/* Localização (se houver) */}
                  {postagem.localizacao && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium">
                        <svg className="w-4 h-4 mr-1.5 text-danger-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {postagem.localizacao}
                      </span>
                    </div>
                  )}

                  {/* Estatísticas da postagem */}
                  <div className="flex items-center space-x-6 text-sm pt-4 border-t border-neutral-200">
                    <div className="flex items-center space-x-2 text-danger-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{postagem.curtidas || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-primary-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{postagem.comentarios || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Amigos */}
      {mostrarModalAmigos && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setMostrarModalAmigos(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-strong max-w-2xl w-full max-h-[85vh] overflow-hidden border border-primary-200 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-accent-50">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Amigos de @{usuario?.username}
                </h2>
                <p className="text-sm text-neutral-600 mt-1 font-medium">
                  {amigos.length} {amigos.length === 1 ? 'amigo' : 'amigos'}
                </p>
              </div>
              <button
                onClick={() => setMostrarModalAmigos(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="overflow-y-auto max-h-[calc(85vh-100px)] bg-neutral-50">
              {loadingAmigos ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
                  <p className="text-neutral-600 font-medium">Carregando amigos...</p>
                </div>
              ) : amigos.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="text-7xl mb-4">👥</div>
                  <p className="text-neutral-600 text-lg font-semibold mb-2">Nenhum amigo ainda</p>
                  <p className="text-sm text-neutral-500">
                    @{usuario?.username} ainda não tem amigos no UniSafe
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {amigos.map((amigo) => (
                    <div 
                      key={amigo.id} 
                      className="p-5 hover:bg-white transition-all duration-200 flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {amigo.foto_perfil ? (
                          <img
                            src={amigo.foto_perfil}
                            alt={amigo.nome}
                            className="w-14 h-14 rounded-full object-cover border-2 border-primary-200 shadow-md group-hover:border-primary-400 transition-all"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.style.display = 'none'
                              e.target.nextElementSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white font-bold text-lg shadow-md ${
                            amigo.foto_perfil ? 'hidden' : ''
                          }`}
                        >
                          {amigo.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-900 text-lg">{amigo.nome}</h3>
                          {amigo.username && (
                            <button
                              onClick={() => {
                                setMostrarModalAmigos(false)
                                router.push(`/usuario/${amigo.username}`)
                              }}
                              className="text-sm bg-gradient-primary bg-clip-text text-transparent font-semibold hover:underline transition"
                            >
                              @{amigo.username}
                            </button>
                          )}
                          {amigo.bio && (
                            <p className="text-sm text-neutral-600 line-clamp-1 mt-1">{amigo.bio}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMostrarModalAmigos(false)
                          router.push(`/usuario/${amigo.username}`)
                        }}
                        className="ml-4 px-5 py-2.5 text-sm bg-gradient-primary text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                      >
                        Ver Perfil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
