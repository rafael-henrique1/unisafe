import '../styles/globals.css'

/**
 * Componente principal da aplicação Next.js
 * Este arquivo configura as páginas globais do UniSafe
 * 
 * @param {Object} Component - Componente da página atual
 * @param {Object} pageProps - Props da página atual
 */
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
