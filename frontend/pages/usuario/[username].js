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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Fazer Login para Adicionar
        </Link>
      )
    }

    if (!statusAmizade) return null

    // Próprio usuário
    if (statusAmizade.status === 'proprio_usuario') {
      return (
        <Link
          href="/perfil"
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center space-x-2"
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
          className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
    if (!data) return ''
    const dataObj = new Date(data)
    const agora = new Date()
    const diffMs = agora - dataObj
    const diffMins = Math.floor(diffMs / 60000)
    const diffHoras = Math.floor(diffMs / 3600000)
    const diffDias = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins} min atrás`
    if (diffHoras < 24) return `${diffHoras}h atrás`
    if (diffDias < 7) return `${diffDias}d atrás`
    
    return dataObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Usuário não encontrado - UniSafe</title>
        </Head>

        {/* Header com botão voltar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
            </div>
          </div>
        </header>

        {/* Erro */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">{erro}</h2>
            <p className="text-red-700 mb-6">
              O usuário @{username?.replace('@', '')} não foi encontrado.
            </p>
            <Link 
              href="/feed"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voltar ao Feed
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>@{usuario?.username} - UniSafe</title>
        <meta name="description" content={`Perfil de ${usuario?.nome} no UniSafe`} />
      </Head>

      {/* Header com botão voltar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Perfil Público</h1>
            </div>
            <Link 
              href="/feed"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Voltar ao Feed
            </Link>
          </div>
        </div>
      </header>

      {/* Mensagens de feedback */}
      {mensagem && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-4 rounded-lg ${
            mensagemTipo === 'sucesso' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {mensagemTipo === 'sucesso' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{mensagem}</span>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo do perfil */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Banner e Avatar */}
          <div className="relative">
            {/* Banner colorido */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            
            {/* Avatar */}
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                {usuario?.avatar_url && !avatarError ? (
                  <img
                    src={usuario.avatar_url}
                    alt={usuario.nome}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{usuario?.nome}</h2>
                <p className="text-xl text-blue-600 font-medium mb-4">@{usuario?.username}</p>
                
                {usuario?.bio && (
                  <p className="text-gray-700 mb-4">{usuario.bio}</p>
                )}

                <div className="flex items-center text-gray-600 text-sm">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Membro desde {formatarDataMembro(usuario?.membro_desde)}
                </div>
              </div>

              {/* Botão de Amizade */}
              <div className="ml-4">
                {renderizarBotaoAmizade()}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {usuario?.estatisticas?.total_postagens || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Postagens</div>
              </div>
              <button
                onClick={abrirModalAmigos}
                className="text-center hover:bg-gray-50 rounded-lg transition cursor-pointer"
              >
                <div className="text-3xl font-bold text-purple-600">
                  {usuario?.estatisticas?.total_amigos || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Amigos</div>
              </button>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {usuario?.estatisticas?.total_comentarios || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Comentários</div>
              </div>
            </div>

            {/* Aviso de perfil público */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Perfil Público</p>
                  <p className="text-sm text-blue-700 mt-1">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Postagens de @{usuario?.username}
          </h2>

          {loadingPostagens ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando postagens...</p>
            </div>
          ) : postagens.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 text-lg mb-2">Nenhuma postagem ainda</p>
              <p className="text-sm text-gray-500">
                @{usuario?.username} ainda não publicou nada no UniSafe
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {postagens.map((postagem) => (
                <div 
                  key={postagem.id} 
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header da postagem */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">
                            {usuario?.nome}
                          </p>
                          <Link 
                            href={`/usuario/@${usuario?.username}`}
                            className="text-sm text-blue-600 font-medium hover:text-blue-800 hover:underline"
                          >
                            @{usuario?.username}
                          </Link>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatarDataPostagem(postagem.criado_em)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getTipoCor(postagem.tipo)}`}>
                      {postagem.tipo || 'aviso'}
                    </span>
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

                  {/* Estatísticas da postagem */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <span>❤️</span>
                      <span>{postagem.curtidas || 0} curtidas</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>💬</span>
                      <span>{postagem.comentarios || 0} comentários</span>
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
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setMostrarModalAmigos(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Amigos de @{usuario?.username}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {amigos.length} {amigos.length === 1 ? 'amigo' : 'amigos'}
                </p>
              </div>
              <button
                onClick={() => setMostrarModalAmigos(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="overflow-y-auto max-h-[calc(80vh-100px)]">
              {loadingAmigos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Carregando amigos...</p>
                </div>
              ) : amigos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-600 text-lg mb-2">Nenhum amigo ainda</p>
                  <p className="text-sm text-gray-500">
                    @{usuario?.username} ainda não tem amigos no UniSafe
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {amigos.map((amigo) => (
                    <div 
                      key={amigo.id} 
                      className="p-4 hover:bg-gray-50 transition flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {amigo.foto_perfil ? (
                          <img
                            src={amigo.foto_perfil}
                            alt={amigo.nome}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.style.display = 'none'
                              e.target.nextElementSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ${
                            amigo.foto_perfil ? 'hidden' : ''
                          }`}
                        >
                          {amigo.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{amigo.nome}</h3>
                          {amigo.username && (
                            <button
                              onClick={() => {
                                setMostrarModalAmigos(false)
                                router.push(`/usuario/${amigo.username}`)
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition"
                            >
                              @{amigo.username}
                            </button>
                          )}
                          {amigo.bio && (
                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">{amigo.bio}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMostrarModalAmigos(false)
                          router.push(`/usuario/${amigo.username}`)
                        }}
                        className="ml-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
