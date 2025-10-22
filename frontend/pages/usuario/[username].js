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
import API_URL from '../../config/api'

export default function PerfilPublico() {
  const router = useRouter()
  const { username } = router.query

  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [avatarError, setAvatarError] = useState(false)

  /**
   * Carrega o perfil público do usuário
   */
  useEffect(() => {
    if (username) {
      carregarPerfilPublico()
    }
  }, [username])

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
   * Formata a data de membro desde
   */
  const formatarDataMembro = (data) => {
    if (!data) return ''
    return new Date(data).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long'
    })
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
            <div className="mb-6">
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

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {usuario?.estatisticas?.total_postagens || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Postagens</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {usuario?.estatisticas?.total_curtidas || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Curtidas</div>
              </div>
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
      </main>
    </div>
  )
}
