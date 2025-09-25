import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

/**
 * Página de Cadastro do UniSafe
 * Permite que novos usuários da comunidade criem conta na plataforma
 * de segurança colaborativa para bairros e comunidades
 */
export default function Cadastro() {
  // Estados para controlar o formulário de cadastro da comunidade
  const [formData, setFormData] = useState({
    nome: '',        // Nome completo do usuário
    email: '',       // Email pessoal (não institucional)
    senha: '',       // Senha do usuário
    confirmarSenha: '', // Confirmação da senha
    telefone: ''     // Telefone para contato (opcional)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
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
   * Valida os dados do formulário antes do envio
   * Implementa validações robustas para segurança da comunidade
   * @returns {boolean} - True se válido, false caso contrário
   */
  const validateForm = () => {
    // Validação de confirmação de senha
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem')
      return false
    }

    // Validação robusta de senha (8+ chars, maiúscula, minúscula, número)
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    if (!senhaRegex.test(formData.senha)) {
      setError('A senha deve ter no mínimo 8 caracteres, incluindo: 1 letra maiúscula, 1 minúscula e 1 número')
      return false
    }

    // Validação de email comum (não institucional)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, insira um email válido')
      return false
    }

    // Validação de nome completo (pelo menos nome e sobrenome)
    if (formData.nome.trim().split(' ').length < 2) {
      setError('Por favor, insira seu nome completo (nome e sobrenome)')
      return false
    }

    // Validação de telefone (se preenchido)
    if (formData.telefone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.telefone)) {
      if (!/^\d{10,11}$/.test(formData.telefone.replace(/\D/g, ''))) {
        setError('Formato de telefone inválido. Use: (11) 99999-9999 ou apenas números')
        return false
      }
    }

    return true
  }

  /**
   * Processa o envio do formulário de cadastro
   * @param {Event} e - Evento de submit do formulário
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      // Aqui será feita a chamada para a API de cadastro
      const response = await fetch('http://localhost:5000/api/auth/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.token) {
          // Salva o token do usuário recém-criado
          localStorage.setItem('unisafe_token', result.data.token)
          localStorage.setItem('unisafe_user', JSON.stringify(result.data.usuario))
          setSuccess('Conta criada com sucesso! Redirecionando...')
          setTimeout(() => {
            router.push('/feed')
          }, 1500)
        } else {
          setSuccess('Conta criada com sucesso! Redirecionando para login...')
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.errors && errorData.errors.length > 0) {
          // Mostra o primeiro erro de validação específico
          setError(errorData.errors[0].msg)
        } else {
          setError(errorData.message || 'Erro ao criar conta')
        }
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
        <title>Cadastro - UniSafe</title>
        <meta name="description" content="Junte-se à comunidade UniSafe e ajude a tornar seu bairro mais seguro" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            {/* Logo e título */}
            <div className="text-center">
              <Link href="/">
                <h2 className="text-3xl font-bold text-primary-700 cursor-pointer">UniSafe</h2>
              </Link>
              <h3 className="mt-6 text-2xl font-bold text-gray-900">
                Junte-se à nossa comunidade
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Ajude a tornar seu bairro mais seguro para todos.{' '}
                <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Já tem uma conta? Faça login
                </Link>
              </p>
            </div>
          </div>

          {/* Formulário de cadastro */}
          <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Mensagem de sucesso */}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div className="space-y-4">
              {/* Campo de nome completo */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome completo *
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Seu nome completo (ex: João Silva Santos)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Digite seu nome e sobrenome completos
                </p>
              </div>

              {/* Campo de email pessoal */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email pessoal *
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
                  Use seu email pessoal para receber notificações da comunidade
                </p>
              </div>

              {/* Campo de telefone */}
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                  Telefone (opcional)
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="(11) 99999-9999"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Para contato em situações de emergência (opcional)
                </p>
              </div>

              {/* Campo de senha */}
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha *
                </label>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  value={formData.senha}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Crie uma senha segura"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mínimo 8 caracteres: 1 maiúscula, 1 minúscula, 1 número
                </p>
              </div>

              {/* Campo de confirmar senha */}
              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">
                  Confirmar senha *
                </label>
                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type="password"
                  required
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>

            {/* Termos de uso */}
            <div className="flex items-start">
              <input
                id="termos"
                name="termos"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="termos" className="ml-3 block text-sm text-gray-900">
                Li e concordo com os{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500 underline">
                  termos de uso
                </a>{' '}
                e{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500 underline">
                  política de privacidade
                </a>{' '}
                do UniSafe. Entendo que esta plataforma é para colaboração comunitária 
                e compartilhamento responsável de informações de segurança.
              </label>
            </div>

            {/* Botão de submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Criando sua conta...
                  </>
                ) : (
                  'Juntar-se à comunidade UniSafe'
                )}
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
