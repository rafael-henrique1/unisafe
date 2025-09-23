import { Html, Head, Main, NextScript } from 'next/document'

/**
 * Documento HTML principal do Next.js
 * Define a estrutura básica de todas as páginas do UniSafe
 */
export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* Meta tags globais */}
        <meta charSet="utf-8" />
        <meta name="description" content="UniSafe - Plataforma de Segurança Comunitária" />
        <meta name="author" content="UniSafe Team" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
