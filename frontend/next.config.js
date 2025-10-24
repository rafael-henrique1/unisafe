/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configuração para permitir comunicação com o backend
  async rewrites() {
    // Se estiver em produção, não faz rewrite (usa a URL da API diretamente)
    if (process.env.NODE_ENV === 'production') {
      return []
    }
    // Em desenvolvimento, faz proxy para o backend local
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ]
  },
  // Permitir imagens de domínios externos (se necessário)
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
