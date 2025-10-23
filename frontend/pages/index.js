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

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header com glassmorphism */}
        <header className="backdrop-blur-md bg-white/10 border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-5">
              <div className="flex items-center space-x-3">
                {/* Logo Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white">UniSafe</h1>
              </div>
              <nav className="flex space-x-3">
                <Link href="/login" className="px-6 py-2.5 text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium border border-white/20 hover:border-white/40">
                  Entrar
                </Link>
                <Link href="/cadastro" className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/50">
                  Cadastrar
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 mb-8">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></span>
              <span className="text-blue-300 text-sm font-medium">Protegendo comunidades em tempo real</span>
            </div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              Sua comunidade
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 text-transparent bg-clip-text">
                mais segura
              </span>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-300 leading-relaxed">
              Conecte-se com seus vizinhos, compartilhe alertas em tempo real e fortaleça a segurança do seu bairro.
              <strong className="text-white"> Juntos somos mais fortes.</strong>
            </p>
            
            {/* Call to Action */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/cadastro" className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-blue-600/60 hover:scale-105 w-full sm:w-auto">
                <span className="flex items-center justify-center">
                  Começar Agora
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link href="/feed" className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold text-lg border border-white/20 hover:border-white/40 w-full sm:w-auto">
                Ver Alertas da Região
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Alertas em Tempo Real</h3>
                <p className="text-slate-300 leading-relaxed">Receba notificações instantâneas sobre incidentes e situações de risco na sua região.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Rede de Vizinhos</h3>
                <p className="text-slate-300 leading-relaxed">Conecte-se com moradores próximos e fortaleça a vigilância colaborativa.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Fácil de Usar</h3>
                <p className="text-slate-300 leading-relaxed">Interface intuitiva para reportar situações suspeitas rapidamente de qualquer lugar.</p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-24">
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-10 md:p-12 border border-white/20 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"></div>
              
              <div className="relative">
                <div className="text-center mb-12">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Por que escolher o UniSafe?
                  </h3>
                  <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                    Uma plataforma completa para proteger o que é mais importante: sua comunidade
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg mb-1">Prevenção Ativa</h4>
                      <p className="text-slate-300">Informação compartilhada previne crimes e protege toda a comunidade</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg mb-1">Resposta Rápida</h4>
                      <p className="text-slate-300">Notificações instantâneas para ação imediata quando necessário</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg mb-1">União Comunitária</h4>
                      <p className="text-slate-300">Fortalece os laços entre vizinhos e cria redes de apoio mútuo</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg mb-1">100% Gratuito</h4>
                      <p className="text-slate-300">Plataforma totalmente gratuita para toda a comunidade</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="backdrop-blur-md bg-white/5 border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-white font-bold text-lg">UniSafe</span>
              </div>
              <p className="text-slate-400 mb-2">
                © 2024 UniSafe. Todos os direitos reservados.
              </p>
              <p className="text-slate-500 text-sm">
                Plataforma de segurança colaborativa para comunidades, bairros e condomínios.
              </p>
              <p className="text-blue-400 text-sm mt-3 font-medium">
                Juntos somos mais seguros. Use com responsabilidade.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
