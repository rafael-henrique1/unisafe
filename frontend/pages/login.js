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
   * Valida se o email possui domínio permitido
   * @param {string} email - Email a ser validado
   * @returns {boolean} - True se válido, false caso contrário
   */
  const validarDominioEmail = (email) => {
    const emailLower = email.toLowerCase()
    const dominiosPermitidos = ['@gmail.com', '@hotmail.com', '@outlook.com', '@eaportal.org']
    return dominiosPermitidos.some(dominio => emailLower.endsWith(dominio))
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
      setError('Apenas emails @gmail.com, @hotmail.com, @outlook.com ou @eaportal.org são permitidos')
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

      <div className="min-h-screen flex">
        {/* Lado esquerdo - Ilustração e branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold">UniSafe</h1>
              </div>
              <h2 className="text-3xl font-bold mb-4">Segurança Colaborativa</h2>
              <p className="text-lg text-white text-opacity-90 mb-8 max-w-md">
                Conecte-se com sua comunidade e ajude a tornar seu bairro um lugar mais seguro para todos.
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-4 max-w-md">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-accent-400 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Alertas em Tempo Real</h3>
                  <p className="text-sm text-white text-opacity-80">Receba notificações instantâneas sobre eventos de segurança</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-accent-400 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Rede de Vizinhos</h3>
                  <p className="text-sm text-white text-opacity-80">Conecte-se com pessoas da sua comunidade</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-accent-400 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Compartilhe Informações</h3>
                  <p className="text-sm text-white text-opacity-80">Ajude outros com avisos e dicas de segurança</p>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white bg-opacity-5 rounded-full -mb-32 -ml-32"></div>
            <div className="absolute top-1/4 right-0 w-48 h-48 bg-white bg-opacity-5 rounded-full -mr-24"></div>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50">
          <div className="max-w-md w-full">
            {/* Header mobile */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/">
                <div className="inline-flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent cursor-pointer">UniSafe</h2>
                </div>
              </Link>
            </div>

            {/* Card do formulário */}
            <div className="bg-white rounded-2xl shadow-strong p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-neutral-800 mb-2">
                  Bem-vindo de volta!
                </h3>
                <p className="text-neutral-600">
                  Entre na sua conta para continuar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Mensagem de erro */}
                {error && (
                  <div className="bg-danger-50 border-l-4 border-danger-500 text-danger-700 px-4 py-3 rounded-r-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Campo de email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
                    placeholder="seu.email@gmail.com"
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Aceitos: @gmail.com, @hotmail.com, @outlook.com, @eaportal.org
                  </p>
                </div>

                {/* Campo de senha */}
                <div>
                  <label htmlFor="senha" className="block text-sm font-semibold text-neutral-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="senha"
                      name="senha"
                      type={mostrarSenha ? "text" : "password"}
                      required
                      value={formData.senha}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      {mostrarSenha ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Lembrar e esqueceu senha */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-neutral-700 group-hover:text-neutral-900">Lembrar de mim</span>
                  </label>
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>

                {/* Botão de submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-primary text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Entrando...
                    </span>
                  ) : 'Entrar'}
                </button>

                {/* Divisor */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-neutral-500">ou continue com</span>
                  </div>
                </div>

                {/* Botão Google */}
                <button
                  type="button"
                  onClick={() => window.location.href = endpoints.googleAuth}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-neutral-200 rounded-xl bg-white text-neutral-700 font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </button>

                {/* Link de cadastro */}
                <p className="text-center text-sm text-neutral-600 mt-6">
                  Novo na comunidade?{' '}
                  <Link href="/cadastro" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                    Criar uma conta
                  </Link>
                </p>

                {/* Link voltar */}
                <div className="text-center pt-4 border-t border-neutral-100">
                  <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Voltar para início
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
