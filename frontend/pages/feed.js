import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

/**
 * Página do Feed de Postagens do UniSafe
 * Exibe as postagens de segurança da comunidade
 */
export default function Feed() {
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

  /**
   * Carrega as postagens do feed quando o componente monta
   */
  useEffect(() => {
    carregarPostagens()
  }, [])

  /**
   * Formatar data para exibição
   * @param {string} dataString - Data em formato ISO
   * @returns {string} - Data formatada
   */
  const formatarData = (dataString) => {
    if (!dataString) return 'Agora mesmo';
    
    const data = new Date(dataString);
    const agora = new Date();
    const diffMs = agora - data;
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 1) return 'Agora mesmo';
    if (diffMinutos < 60) return `${diffMinutos}min atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias < 7) return `${diffDias}d atrás`;
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Carrega comentários de uma postagem
   * @param {number} postagemId - ID da postagem
   */
  const carregarComentarios = async (postagemId) => {
    try {
      setLoadingComentarios(prev => ({ ...prev, [postagemId]: true }))
      
      const response = await fetch(`http://localhost:5000/api/postagens/${postagemId}/comentarios`)
      
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
      setEnviandoComentario(prev => ({ ...prev, [postagemId]: true }))

      const token = localStorage.getItem('unisafe_token')
      
      if (!token) {
        alert('Você precisa estar logado para comentar')
        return
      }
      
      const response = await fetch(`http://localhost:5000/api/postagens/${postagemId}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conteudo })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Adiciona o novo comentário à lista
        setComentarios(prev => ({
          ...prev,
          [postagemId]: [...(prev[postagemId] || []), data.data]
        }))

        // Limpa o campo de texto
        setNovoComentario(prev => ({ ...prev, [postagemId]: '' }))

        // Atualiza o contador de comentários na postagem
        setPostagens(prev => prev.map(p => 
          p.id === postagemId 
            ? { ...p, comentarios: (p.comentarios || 0) + 1 }
            : p
        ))
      } else {
        console.error('Erro ao adicionar comentário')
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
    } finally {
      setEnviandoComentario(prev => ({ ...prev, [postagemId]: false }))
    }
  }

  /**
   * Curte ou descurte uma postagem
   * @param {number} postagemId - ID da postagem
   */
  const toggleCurtida = async (postagemId) => {
    try {
      setCurtindoPostagem(prev => ({ ...prev, [postagemId]: true }))

      const token = localStorage.getItem('unisafe_token')
      if (!token) {
        alert('Você precisa estar logado para curtir postagens')
        return
      }

      const response = await fetch(`http://localhost:5000/api/postagens/${postagemId}/curtir`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Atualiza o estado da postagem
        setPostagens(prev => prev.map(p => {
          if (p.id === postagemId) {
            return {
              ...p,
              usuarioCurtiu: data.action === 'added',
              curtidas: data.action === 'added' 
                ? (p.curtidas || 0) + 1 
                : Math.max((p.curtidas || 0) - 1, 0)
            }
          }
          return p
        }))
      } else {
        console.error('Erro ao curtir postagem')
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
      
      const response = await fetch('http://localhost:5000/api/postagens')
      
      if (response.ok) {
        const result = await response.json()
        console.log('API Response:', result) // Debug
        
        if (result.success && Array.isArray(result.data)) {
          setPostagens(result.data)
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
      
      const response = await fetch('http://localhost:5000/api/postagens', {
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
                  {typeof window !== 'undefined' && localStorage.getItem('unisafe_user') ? 
                    `Olá, ${JSON.parse(localStorage.getItem('unisafe_user')).nome}!` : 
                    'Bem-vindo!'
                  }
                </span>
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

        {/* Conteúdo principal */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Formulário para nova postagem */}
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
                <div key={postagem.id || index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  {/* Header da postagem */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                        {postagem.usuario ? postagem.usuario.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {postagem.usuario || 'Usuário Anônimo'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatarData(postagem.data)}
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
                    <button className="flex items-center space-x-1 hover:text-primary-600 transition-colors">
                      <span>↗️</span>
                      <span>Compartilhar</span>
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
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {comentario.usuario || 'Usuário Anônimo'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {comentario.data}
                                  </span>
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
