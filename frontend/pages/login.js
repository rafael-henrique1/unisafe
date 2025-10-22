import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { endpoints } from '../config/api'

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
  const [mostrarSenha, setMostrarSenha] = useState(false)
  
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
   * Valida se o email é Gmail ou Hotmail
   * @param {string} email - Email a ser validado
   * @returns {boolean} - True se válido, false caso contrário
   */
  const validarDominioEmail = (email) => {
    const emailLower = email.toLowerCase()
    return emailLower.endsWith('@gmail.com') || emailLower.endsWith('@hotmail.com')
  }

  /**
   * Processa o envio do formulário de login
   * @param {Event} e - Evento de submit do formulário
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validação de domínio de email
    if (!validarDominioEmail(formData.email)) {
      setError('Apenas emails @gmail.com ou @hotmail.com são permitidos')
      setLoading(false)
      return
    }

    try {
      // Aqui será feita a chamada para a API de login
      const response = await fetch(endpoints.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.token) {
          // Salva o token no localStorage
          localStorage.setItem('unisafe_token', result.data.token)
          localStorage.setItem('unisafe_user', JSON.stringify(result.data.usuario))
          console.log('Login realizado com sucesso:', result)
          router.push('/feed') // Redireciona para o feed após login
        } else {
          setError('Erro na resposta do servidor')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.message || 'Email ou senha inválidos')
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
                <p className="mt-1 text-xs text-gray-500">
                  Apenas emails @gmail.com ou @hotmail.com
                </p>
              </div>

              {/* Campo de senha */}
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative mt-1">
                  <input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    required
                    value={formData.senha}
                    onChange={handleChange}
                    className="input-field pr-10"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? (
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

            {/* Divisor "ou" */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Botão Google OAuth */}
            <div>
              <button
                type="button"
                onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continuar com Google</span>
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
