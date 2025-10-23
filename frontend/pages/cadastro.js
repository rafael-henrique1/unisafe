import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { endpoints } from '../config/api'

/**
 * Página de Cadastro do UniSafe
 * Permite que novos usuários da comunidade criem conta na plataforma
 * de segurança colaborativa para bairros e comunidades
 */
export default function Cadastro() {
  // Estados para controlar o formulário de cadastro da comunidade
  const [formData, setFormData] = useState({
    nome: '',        // Nome completo do usuário
    username: '',    // Nome de usuário (@username)
    email: '',       // Email pessoal (não institucional)
    senha: '',       // Senha do usuário
    confirmarSenha: '', // Confirmação da senha
    telefone: ''     // Telefone para contato (opcional)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [emailJaCadastrado, setEmailJaCadastrado] = useState(false)
  const [verificandoEmail, setVerificandoEmail] = useState(false)
  const [usernameJaEmUso, setUsernameJaEmUso] = useState(false)
  const [usernameInvalido, setUsernameInvalido] = useState(false)
  const [mensagemUsername, setMensagemUsername] = useState('')
  const [verificandoUsername, setVerificandoUsername] = useState(false)
  
  const router = useRouter()

  /**
   * Formata o telefone no padrão (11) 99999-9999
   * @param {string} value - Valor do telefone
   * @returns {string} - Telefone formatado
   */
  const formatarTelefone = (value) => {
    // Remove tudo que não é dígito
    const apenasNumeros = value.replace(/\D/g, '')
    
    // Aplica a máscara conforme o usuário digita
    if (apenasNumeros.length <= 2) {
      return apenasNumeros
    } else if (apenasNumeros.length <= 6) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`
    } else if (apenasNumeros.length <= 10) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`
    } else {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`
    }
  }

  /**
   * Manipula mudanças nos campos do formulário
   * @param {Event} e - Evento de mudança do input
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Aplica máscara de telefone
    if (name === 'telefone') {
      setFormData({
        ...formData,
        [name]: formatarTelefone(value)
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
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
   * Verifica se o email já está cadastrado no sistema
   * @param {string} email - Email a ser verificado
   */
  const verificarEmailExistente = async (email) => {
    // Validação básica antes de verificar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email) || !validarDominioEmail(email)) {
      setEmailJaCadastrado(false)
      return
    }

    setVerificandoEmail(true)
    setEmailJaCadastrado(false)
    
    try {
      const response = await fetch(`${endpoints.usuarios}/verificar-email?email=${encodeURIComponent(email)}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.existe) {
          setEmailJaCadastrado(true)
          setError('Este email já está cadastrado. Use outro email ou faça login.')
        } else {
          setEmailJaCadastrado(false)
          // Limpa erro de email se estava definido
          if (error.includes('email já está cadastrado')) {
            setError('')
          }
        }
      }
    } catch (err) {
      console.error('Erro ao verificar email:', err)
      // Não mostra erro ao usuário para não atrapalhar a experiência
    } finally {
      setVerificandoEmail(false)
    }
  }

  /**
   * Manipula quando o usuário sai do campo de email (onBlur)
   */
  const handleEmailBlur = () => {
    if (formData.email) {
      verificarEmailExistente(formData.email)
    }
  }

  /**
   * Verifica se o username já está em uso
   * @param {string} username - Username a ser verificado
   */
  const verificarUsernameDisponivel = async (username) => {
    // Limpa username para validação
    const usernameClean = username.trim().toLowerCase()
    
    // Validações básicas
    if (!usernameClean || usernameClean.length < 3) {
      setUsernameJaEmUso(false)
      setUsernameInvalido(false)
      setMensagemUsername('')
      return
    }

    setVerificandoUsername(true)
    setUsernameJaEmUso(false)
    setUsernameInvalido(false)
    setMensagemUsername('')
    
    try {
      const response = await fetch(`${endpoints.usuarios}/verificar-username?username=${encodeURIComponent(usernameClean)}`)
      
      if (response.ok) {
        const result = await response.json()
        
        if (!result.valido) {
          setUsernameInvalido(true)
          setMensagemUsername(result.mensagem || 'Nome de usuário inválido')
        } else if (result.existe) {
          setUsernameJaEmUso(true)
          setMensagemUsername('Este nome de usuário já está em uso')
        } else {
          // Username disponível
          setMensagemUsername('✓ Nome de usuário disponível')
        }
      }
    } catch (err) {
      console.error('Erro ao verificar username:', err)
    } finally {
      setVerificandoUsername(false)
    }
  }

  /**
   * Manipula quando o usuário sai do campo de username
   */
  const handleUsernameBlur = () => {
    if (formData.username) {
      verificarUsernameDisponivel(formData.username)
    }
  }

  /**
   * Valida formato do username enquanto digita
   */
  const handleUsernameChange = (e) => {
    let value = e.target.value.toLowerCase() // Converte para minúsculas
    
    // Remove espaços e caracteres não permitidos enquanto digita
    value = value.replace(/[^a-z0-9._]/g, '')
    
    // Limita a 30 caracteres
    if (value.length > 30) {
      value = value.substring(0, 30)
    }
    
    setFormData({
      ...formData,
      username: value
    })
    
    // Limpa mensagens se o campo estiver vazio
    if (!value) {
      setUsernameJaEmUso(false)
      setUsernameInvalido(false)
      setMensagemUsername('')
    }
  }

  /**
   * Valida os dados do formulário antes do envio
   * Implementa validações robustas para segurança da comunidade
   * @returns {boolean} - True se válido, false caso contrário
   */
  const validateForm = () => {
    // Validação de email já cadastrado
    if (emailJaCadastrado) {
      setError('Este email já está cadastrado. Use outro email ou faça login.')
      return false
    }

    // Validação de username já em uso
    if (usernameJaEmUso) {
      setError('Este nome de usuário já está em uso. Escolha outro.')
      return false
    }

    // Validação de username inválido
    if (usernameInvalido) {
      setError('Nome de usuário inválido. ' + mensagemUsername)
      return false
    }

    // Validação de username (formato e tamanho)
    if (!formData.username || formData.username.length < 3) {
      setError('Nome de usuário deve ter pelo menos 3 caracteres')
      return false
    }

    if (formData.username.length > 30) {
      setError('Nome de usuário deve ter no máximo 30 caracteres')
      return false
    }

    const usernameRegex = /^[a-z0-9._]+$/
    if (!usernameRegex.test(formData.username)) {
      setError('Nome de usuário pode conter apenas letras minúsculas, números, pontos e sublinhados')
      return false
    }

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

    // Validação de domínio de email (apenas domínios permitidos)
    if (!validarDominioEmail(formData.email)) {
      setError('Apenas emails @gmail.com, @hotmail.com, @outlook.com ou @eaportal.org são permitidos')
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
      const response = await fetch(endpoints.cadastro, {
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

      <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-accent-100 relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl w-full">
            {/* Header com logo e título */}
            <div className="text-center mb-8">
              <Link href="/">
                <div className="inline-flex items-center gap-3 cursor-pointer group">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-300 group-hover:scale-105">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    UniSafe
                  </h2>
                </div>
              </Link>
              
              <h3 className="mt-6 text-3xl font-bold text-neutral-800">
                Faça parte da mudança
              </h3>
              <p className="mt-3 text-neutral-600 text-lg">
                Junte-se a milhares de pessoas tornando suas comunidades mais seguras
              </p>
              
              <div className="mt-4">
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-2 group">
                  <span>Já tem uma conta?</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>

            {/* Card do formulário com shadow e backdrop blur */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-strong p-8 md:p-10 border border-white">
              {/* Indicador de progresso visual */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-medium text-neutral-600 mb-2">
                  <span>Informações Pessoais</span>
                  <span>Segurança</span>
                  <span>Finalizar</span>
                </div>
                <div className="relative h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-gradient-primary rounded-full transition-all duration-500" style={{ width: '33%' }}></div>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Mensagens de erro e sucesso */}
                {error && (
                  <div className="bg-danger-50 border-l-4 border-danger-500 text-danger-800 px-4 py-3 rounded-lg flex items-start gap-3 animate-pulse">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    <span className="flex-1 text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="bg-accent-50 border-l-4 border-accent-500 text-accent-800 px-4 py-3 rounded-lg flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="flex-1 text-sm font-medium">{success}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Campo de nome completo */}
                  <div className="md:col-span-2">
                    <label htmlFor="nome" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Nome completo *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="nome"
                        name="nome"
                        type="text"
                        required
                        value={formData.nome}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-neutral-800 placeholder-neutral-400"
                        placeholder="João Silva Santos"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                      </svg>
                      Digite seu nome e sobrenome completos
                    </p>
                  </div>

                  {/* Campo de nome de usuário */}
                  <div className="md:col-span-2">
                    <label htmlFor="username" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Nome de usuário *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-neutral-500 font-medium">@</span>
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleUsernameChange}
                        onBlur={handleUsernameBlur}
                        className={`w-full pl-8 pr-10 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none text-neutral-800 placeholder-neutral-400 ${
                          usernameJaEmUso || usernameInvalido 
                            ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-100' 
                            : mensagemUsername.includes('✓') 
                            ? 'border-accent-400 focus:border-accent-500 focus:ring-accent-100' 
                            : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
                        }`}
                        placeholder="seu_usuario"
                        maxLength={30}
                      />
                      {verificandoUsername && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    {mensagemUsername && (
                      <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${
                        usernameJaEmUso || usernameInvalido ? 'text-danger-600' :
                        mensagemUsername.includes('✓') ? 'text-accent-600' : 'text-neutral-500'
                      }`}>
                        {mensagemUsername.includes('✓') ? '✓' : '⚠️'} {mensagemUsername}
                      </p>
                    )}
                    {!mensagemUsername && (
                      <p className="mt-1.5 text-xs text-neutral-500">
                        3-30 caracteres. Apenas letras, números, pontos e sublinhados
                      </p>
                    )}
                  </div>

                  {/* Campo de email pessoal */}
                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Email pessoal *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                        className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none text-neutral-800 placeholder-neutral-400 ${
                          emailJaCadastrado 
                            ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-100' 
                            : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
                        }`}
                        placeholder="seu.email@gmail.com"
                      />
                      {verificandoEmail && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    {emailJaCadastrado && (
                      <p className="mt-1.5 text-xs text-danger-600 font-medium flex items-center gap-1">
                        ⚠️ Este email já está cadastrado
                      </p>
                    )}
                    {!emailJaCadastrado && !verificandoEmail && (
                      <p className="mt-1.5 text-xs text-neutral-500">
                        Aceitos: @gmail.com, @hotmail.com, @outlook.com, @eaportal.org
                      </p>
                    )}
                  </div>

                  {/* Campo de telefone */}
                  <div className="md:col-span-2">
                    <label htmlFor="telefone" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Telefone <span className="text-neutral-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        id="telefone"
                        name="telefone"
                        type="tel"
                        value={formData.telefone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-neutral-800 placeholder-neutral-400"
                        placeholder="(11) 99999-9999"
                        maxLength="15"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-500">
                      Para contato em situações de emergência
                    </p>
                  </div>

                  {/* Campo de senha */}
                  <div className="md:col-span-1">
                    <label htmlFor="senha" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Senha *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="senha"
                        name="senha"
                        type={mostrarSenha ? "text" : "password"}
                        required
                        value={formData.senha}
                        onChange={handleChange}
                        className="w-full pl-10 pr-10 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-neutral-800 placeholder-neutral-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {mostrarSenha ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-500">
                      Min. 8 caracteres: 1 maiúscula, 1 minúscula, 1 número
                    </p>
                  </div>

                  {/* Campo de confirmar senha */}
                  <div className="md:col-span-1">
                    <label htmlFor="confirmarSenha" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Confirmar senha *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        id="confirmarSenha"
                        name="confirmarSenha"
                        type="password"
                        required
                        value={formData.confirmarSenha}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-neutral-800 placeholder-neutral-400"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* Termos de uso */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                  <div className="flex items-start gap-3">
                    <input
                      id="termos"
                      name="termos"
                      type="checkbox"
                      required
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded cursor-pointer"
                    />
                    <label htmlFor="termos" className="text-sm text-neutral-700 cursor-pointer">
                      Li e concordo com os{' '}
                      <a href="#" className="text-primary-600 hover:text-primary-700 font-medium underline">
                        termos de uso
                      </a>{' '}
                      e{' '}
                      <a href="#" className="text-primary-600 hover:text-primary-700 font-medium underline">
                        política de privacidade
                      </a>{' '}
                      do UniSafe. Esta plataforma é destinada à colaboração comunitária e compartilhamento responsável de informações de segurança.
                    </label>
                  </div>
                </div>

                {/* Botão de submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Criando sua conta...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar minha conta</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Divisor "ou" */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-neutral-500 font-medium">ou continue com</span>
                  </div>
                </div>

                {/* Botão Google OAuth */}
                <button
                  type="button"
                  onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border-2 border-neutral-200 rounded-xl bg-white text-neutral-700 font-medium hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-soft"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </button>

                {/* Link para voltar */}
                <div className="text-center pt-2">
                  <Link href="/" className="text-sm text-neutral-600 hover:text-primary-600 font-medium inline-flex items-center gap-2 group transition-colors">
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Voltar para página inicial</span>
                  </Link>
                </div>
              </form>
            </div>

            {/* Footer com estatísticas */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-6 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">+1.200 usuários</span>
                </div>
                <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <span className="font-medium">+500 alertas compartilhados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
