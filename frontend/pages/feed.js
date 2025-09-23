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
  const [novaPostagem, setNovaPostagem] = useState('')
  const [tipoPostagem, setTipoPostagem] = useState('aviso')
  const [enviandoPost, setEnviandoPost] = useState(false)

  /**
   * Carrega as postagens do feed quando o componente monta
   */
  useEffect(() => {
    carregarPostagens()
  }, [])

  /**
   * Busca as postagens da API
   */
  const carregarPostagens = async () => {
    try {
      const response = await fetch('/api/postagens')
      if (response.ok) {
        const data = await response.json()
        setPostagens(data)
      }
    } catch (error) {
      console.error('Erro ao carregar postagens:', error)
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
      const response = await fetch('/api/postagens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conteudo: novaPostagem,
          tipo: tipoPostagem
        })
      })

      if (response.ok) {
        setNovaPostagem('')
        setTipoPostagem('aviso')
        carregarPostagens() // Recarrega o feed
      }
    } catch (error) {
      console.error('Erro ao enviar postagem:', error)
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
        return 'bg-red-100 text-red-800'
      case 'alerta':
        return 'bg-yellow-100 text-yellow-800'
      case 'aviso':
        return 'bg-blue-100 text-blue-800'
      case 'informacao':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
                <span className="text-gray-700">Bem-vindo!</span>
                <Link href="/login" className="text-primary-600 hover:text-primary-800">
                  Sair
                </Link>
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
            <h2 className="text-xl font-bold text-gray-900">Feed da Comunidade</h2>
            
            {loading ? (
              // Loading state
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">Carregando postagens...</p>
              </div>
            ) : postagens.length === 0 ? (
              // Estado vazio
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <div className="text-6xl mb-4">📢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ainda não há postagens
                </h3>
                <p className="text-gray-600">
                  Seja o primeiro a compartilhar informações de segurança com a comunidade!
                </p>
              </div>
            ) : (
              // Lista de postagens
              postagens.map((postagem, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
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
                          {postagem.data || 'Agora mesmo'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoCor(postagem.tipo)}`}>
                      {postagem.tipo || 'aviso'}
                    </span>
                  </div>

                  {/* Conteúdo da postagem */}
                  <div className="mb-4">
                    <p className="text-gray-800 leading-relaxed">
                      {postagem.conteudo || 'Conteúdo não disponível'}
                    </p>
                  </div>

                  {/* Ações da postagem */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <button className="flex items-center space-x-1 hover:text-primary-600">
                      <span>👍</span>
                      <span>{postagem.curtidas || 0} curtidas</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-primary-600">
                      <span>💬</span>
                      <span>{postagem.comentarios || 0} comentários</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-primary-600">
                      <span>↗️</span>
                      <span>Compartilhar</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  )
}
