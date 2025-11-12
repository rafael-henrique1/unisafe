import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import API_URL from '../../config/api'

/**
 * Página de Sucesso do Login via Google OAuth
 * 
 * Esta página captura o token JWT retornado pela autenticação Google,
 * armazena no localStorage e redireciona o usuário para o feed
 */
export default function LoginSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Obtém o token da URL (query parameter)
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const error = urlParams.get('error')

    if (error) {
      // Se houver erro, redireciona para login com mensagem
      console.error('Erro na autenticação Google:', error)
      router.push(`/login?error=${error}`)
      return
    }

    if (token) {
      console.log('✅ Token recebido, processando login...')
      
      // Salva o token no localStorage
      localStorage.setItem('unisafe_token', token)
      
      // Busca dados completos do usuário
      fetchUserData(token)
    } else {
      // Se não houver token, redireciona para login
      console.error('Token não encontrado')
      router.push('/login')
    }
  }, [router])

  /**
   * Busca os dados do usuário autenticado
   * @param {string} token - Token JWT do usuário
   */
  const fetchUserData = async (token) => {
    try {
      // Decodifica o token JWT para pegar o ID do usuário
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        throw new Error('Token JWT inválido')
      }
      
      // Decodifica o payload (segunda parte do token)
      const payload = JSON.parse(atob(tokenParts[1]))
      const userId = payload.id
      
      console.log('🔍 Buscando dados do usuário ID:', userId)

      // Busca dados completos do usuário pelo ID
      const response = await fetch(`${API_URL}/api/usuarios/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        
        console.log('✅ Dados do usuário recebidos:', result)
        
        // Salva dados do usuário no localStorage
        if (result.success && result.data) {
          localStorage.setItem('unisafe_user', JSON.stringify(result.data))
          console.log('✅ Usuário salvo no localStorage')
        } else if (result.data) {
          // Caso o backend não retorne com .success
          localStorage.setItem('unisafe_user', JSON.stringify(result.data))
          console.log('✅ Usuário salvo no localStorage')
        }
      } else {
        console.error('❌ Erro ao buscar dados:', response.status)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error)
    } finally {
      // Redireciona para o feed após 800ms
      setTimeout(() => {
        console.log('🔄 Redirecionando para /feed')
        router.push('/feed')
      }, 800)
    }
  }

  return (
    <>
      <Head>
        <title>Autenticando... - UniSafe</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="mb-4">
            <svg 
              className="animate-spin h-12 w-12 text-primary-600 mx-auto" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Autenticando...
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto concluímos seu login com Google
          </p>
        </div>
      </div>
    </>
  )
}
