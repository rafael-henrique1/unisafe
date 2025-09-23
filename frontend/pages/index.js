import Head from 'next/head'
import Link from 'next/link'

/**
 * Página inicial do UniSafe
 * Landing page da plataforma de segurança comunitária colaborativa
 * para bairros, condomínios e comunidades em geral
 */
export default function Home() {
  return (
    <>
      <Head>
        <title>UniSafe - Segurança Comunitária Colaborativa</title>
        <meta name="description" content="Plataforma colaborativa de segurança para bairros, condomínios e comunidades. Junte-se e ajude a tornar sua região mais segura!" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-700">UniSafe</h1>
              </div>
              <nav className="flex space-x-4">
                <Link href="/login" className="btn-primary">
                  Entrar
                </Link>
                <Link href="/cadastro" className="btn-secondary">
                  Cadastrar
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Segurança <span className="text-primary-600">Comunitária</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Uma plataforma onde vizinhos e moradores podem compartilhar informações de segurança,
              reportar incidentes e manter toda a comunidade informada sobre a situação do bairro.
              <strong> Juntos somos mais seguros!</strong>
            </p>
            
            {/* Call to Action */}
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/cadastro" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10 transition-colors">
                  Junte-se à Comunidade
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link href="/feed" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-colors">
                  Ver Alertas da Região
                </Link>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <div className="text-primary-500 text-3xl mb-4">�</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Alertas em Tempo Real</h3>
                  <p className="text-gray-500">Receba e compartilhe alertas sobre incidentes, assaltos, suspeitos e situações de risco no seu bairro.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <div className="text-primary-500 text-3xl mb-4">🤝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Rede de Vizinhos</h3>
                  <p className="text-gray-500">Conecte-se com vizinhos e moradores da região para criar uma rede de apoio e vigilância colaborativa.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <div className="text-primary-500 text-3xl mb-4">📱</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Fácil de Usar</h3>
                  <p className="text-gray-500">Interface intuitiva para reportar rapidamente situações suspeitas ou emergências no seu smartphone.</p>
                </div>
              </div>
            </div>

            {/* Seção adicional de benefícios */}
            <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Por que usar o UniSafe?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="flex items-start space-x-3">
                    <div className="text-green-500 text-xl">✅</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Prevenção</h4>
                      <p className="text-gray-600">Informação compartilhada previne crimes e protege a comunidade</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-green-500 text-xl">✅</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Resposta Rápida</h4>
                      <p className="text-gray-600">Alertas em tempo real para ação imediata quando necessário</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-green-500 text-xl">✅</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">União Comunitária</h4>
                      <p className="text-gray-600">Fortalece os laços entre vizinhos e moradores</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-green-500 text-xl">✅</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Gratuito</h4>
                      <p className="text-gray-600">100% gratuito para toda a comunidade</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-500">
                © 2024 UniSafe. Todos os direitos reservados. 
                Plataforma de segurança colaborativa para comunidades, bairros e condomínios.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Juntos somos mais seguros. Use com responsabilidade.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
