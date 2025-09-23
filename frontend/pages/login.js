import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

/**
 * Página de Login do UniSafe
 * Permite que usuários da comunidade façam autenticação na plataforma
 * de segurança colaborativa para bairros e comunidades
 */
export default function Login() {
  // Estados para controlar o formulário
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  /**
   * Manipula mudanças nos campos do formulário
   * @param {Event} e - Evento de mudança do input
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  /**
   * Processa o envio do formulário de login
   * @param {Event} e - Evento de submit do formulário
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Aqui será feita a chamada para a API de login
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        // Armazena o token de autenticação (será implementado com localStorage/cookies)
        console.log('Login realizado com sucesso:', data)
        router.push('/feed') // Redireciona para o feed após login
      } else {
        setError('Email ou senha inválidos')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login - UniSafe</title>
        <meta name="description" content="Faça login na plataforma UniSafe" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-md w-full space-y-8">
          <div>
            {/* Logo e título */}
            <div className="text-center">
              <Link href="/">
                <h2 className="text-3xl font-bold text-primary-700 cursor-pointer">UniSafe</h2>
              </Link>
              <h3 className="mt-6 text-2xl font-bold text-gray-900">
                Entre na sua conta
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Novo na comunidade?{' '}
                <Link href="/cadastro" className="font-medium text-primary-600 hover:text-primary-500">
                  Cadastre-se e ajude a tornar seu bairro mais seguro
                </Link>
              </p>
            </div>
          </div>

          {/* Formulário de login */}
          <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Campo de email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="seu.email@gmail.com"
                />
              </div>

              {/* Campo de senha */}
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  value={formData.senha}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Sua senha"
                />
              </div>
            </div>

            {/* Lembrar de mim e esqueci a senha */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="lembrar"
                  name="lembrar"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="lembrar" className="ml-2 block text-sm text-gray-900">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            {/* Botão de submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>

            {/* Link para voltar */}
            <div className="text-center">
              <Link href="/" className="text-sm text-primary-600 hover:text-primary-500">
                ← Voltar para página inicial
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
