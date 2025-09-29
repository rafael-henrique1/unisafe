/**
 * Página de Perfil do Usuário - UniSafe
 * 
 * Esta página permite ao usuário visualizar e editar suas informações pessoais.
 * Inclui funcionalidades para atualizar nome, bio, telefone, avatar e senha.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Perfil() {
  const router = useRouter()

  // Estados dos dados do usuário
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
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

  /**
   * Carrega os dados do usuário ao montar o componente
   */
  useEffect(() => {
    carregarPerfil()
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
      
      const response = await fetch(`http://localhost:5000/api/usuarios/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsuario(data.data)
        setFormData({
          nome: data.data.nome || '',
          bio: data.data.bio || '',
          avatar_url: data.data.avatar_url || '',
          telefone: data.data.telefone || ''
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

      const response = await fetch(`http://localhost:5000/api/usuarios/${user.id}`, {
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
          bio: data.data.bio,
          avatar_url: data.data.avatar_url,
          telefone: data.data.telefone
        }))
        
        // Reset avatar error para tentar carregar nova imagem
        setAvatarError(false)
        
        // Atualiza os dados do usuário no localStorage
        const updatedUser = { ...user, nome: data.data.nome }
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

      const response = await fetch(`http://localhost:5000/api/usuarios/${user.id}`, {
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
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(XX) XXXXX-XXXX"
                  />
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
                    <input
                      type="password"
                      required
                      value={senhaData.senhaAtual}
                      onChange={(e) => setSenhaData(prev => ({ ...prev, senhaAtual: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite sua senha atual"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={senhaData.novaSenha}
                      onChange={(e) => setSenhaData(prev => ({ ...prev, novaSenha: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite a nova senha (mín. 6 caracteres)"
                    />
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
      </div>
    </div>
  )
}
