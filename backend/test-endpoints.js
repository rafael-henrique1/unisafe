/**
 * Script de Teste dos Endpoints da API UniSafe
 * 
 * Este script realiza testes automatizados em todos os endpoints críticos:
 * - Cadastro de usuário
 * - Login
 * - Criação de postagem
 * - Curtir postagem
 * - Comentar postagem
 */

const axios = require('axios')

const API_URL = 'http://localhost:5000/api'
let token = ''
let usuarioId = ''
let postagemId = ''

// Dados de teste
const usuarioTeste = {
  nome: 'Maria Silva Teste',
  email: `teste_${Date.now()}@unisafe.com`,
  senha: 'Teste@123456',
  telefone: '(11) 98765-4321'
}

console.log('\n╔═══════════════════════════════════════════════════════╗')
console.log('║     🧪 INICIANDO TESTES DOS ENDPOINTS - UNISAFE      ║')
console.log('╚═══════════════════════════════════════════════════════╝\n')

// Função auxiliar para exibir resultados
function exibirResultado(titulo, sucesso, dados = null, erro = null) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`${sucesso ? '✅' : '❌'} ${titulo}`)
  console.log('═'.repeat(60))
  
  if (sucesso && dados) {
    console.log('📦 Resposta:', JSON.stringify(dados, null, 2))
  }
  
  if (erro) {
    console.log('❌ Erro:', erro.response?.data || erro.message)
    console.log('   Status:', erro.response?.status)
  }
}

// 1️⃣ TESTE: Cadastro de Usuário
async function testarCadastro() {
  try {
    console.log('\n🔵 TESTE 1: Cadastro de novo usuário')
    console.log('   Email:', usuarioTeste.email)
    
    const response = await axios.post(`${API_URL}/auth/cadastro`, usuarioTeste)
    
    if (response.data.success && response.data.data.token) {
      token = response.data.data.token
      usuarioId = response.data.data.usuario.id
      
      exibirResultado('CADASTRO DE USUÁRIO', true, {
        userId: usuarioId,
        nome: response.data.data.usuario.nome,
        email: response.data.data.usuario.email,
        tokenRecebido: token ? 'Sim ✓' : 'Não ✗'
      })
      return true
    } else {
      exibirResultado('CADASTRO DE USUÁRIO', false, null, new Error('Token não recebido'))
      return false
    }
  } catch (error) {
    exibirResultado('CADASTRO DE USUÁRIO', false, null, error)
    return false
  }
}

// 2️⃣ TESTE: Login de Usuário
async function testarLogin() {
  try {
    console.log('\n🔵 TESTE 2: Login com credenciais')
    console.log('   Email:', usuarioTeste.email)
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: usuarioTeste.email,
      senha: usuarioTeste.senha
    })
    
    if (response.data.success && response.data.data.token) {
      const novoToken = response.data.data.token
      
      exibirResultado('LOGIN DE USUÁRIO', true, {
        userId: response.data.data.usuario.id,
        nome: response.data.data.usuario.nome,
        tokenRecebido: novoToken ? 'Sim ✓' : 'Não ✗',
        tokenDiferente: novoToken !== token ? 'Sim (novo gerado)' : 'Não (mesmo token)'
      })
      return true
    } else {
      exibirResultado('LOGIN DE USUÁRIO', false, null, new Error('Token não recebido'))
      return false
    }
  } catch (error) {
    exibirResultado('LOGIN DE USUÁRIO', false, null, error)
    return false
  }
}

// 3️⃣ TESTE: Criar Postagem
async function testarCriarPostagem() {
  try {
    console.log('\n🔵 TESTE 3: Criar nova postagem')
    
    const postagem = {
      conteudo: 'Teste de postagem criada pelo script automatizado. Verificando integração com MySQL no Railway.',
      tipo: 'informacao'
    }
    
    const response = await axios.post(`${API_URL}/postagens`, postagem, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data.success && response.data.data.id) {
      postagemId = response.data.data.id
      
      exibirResultado('CRIAÇÃO DE POSTAGEM', true, {
        postagemId: postagemId,
        tipo: response.data.data.categoria,
        usuario: response.data.data.usuario,
        conteudo: response.data.data.conteudo.substring(0, 50) + '...'
      })
      return true
    } else {
      exibirResultado('CRIAÇÃO DE POSTAGEM', false, null, new Error('ID da postagem não recebido'))
      return false
    }
  } catch (error) {
    exibirResultado('CRIAÇÃO DE POSTAGEM', false, null, error)
    return false
  }
}

// 4️⃣ TESTE: Listar Postagens
async function testarListarPostagens() {
  try {
    console.log('\n🔵 TESTE 4: Listar todas as postagens')
    
    const response = await axios.get(`${API_URL}/postagens`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data.success && Array.isArray(response.data.data)) {
      exibirResultado('LISTAGEM DE POSTAGENS', true, {
        totalPostagens: response.data.data.length,
        primeiraPostagem: response.data.data[0] ? {
          id: response.data.data[0].id,
          usuario: response.data.data[0].usuario,
          curtidas: response.data.data[0].curtidas,
          comentarios: response.data.data[0].comentarios
        } : null
      })
      return true
    } else {
      exibirResultado('LISTAGEM DE POSTAGENS', false, null, new Error('Array de postagens não recebido'))
      return false
    }
  } catch (error) {
    exibirResultado('LISTAGEM DE POSTAGENS', false, null, error)
    return false
  }
}

// 5️⃣ TESTE: Curtir Postagem
async function testarCurtirPostagem() {
  try {
    console.log('\n🔵 TESTE 5: Curtir postagem')
    console.log('   Postagem ID:', postagemId)
    
    const response = await axios.post(`${API_URL}/postagens/${postagemId}/curtir`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data.success) {
      exibirResultado('CURTIR POSTAGEM', true, {
        acao: response.data.action,
        mensagem: response.data.message
      })
      return true
    } else {
      exibirResultado('CURTIR POSTAGEM', false, null, new Error('Resposta sem sucesso'))
      return false
    }
  } catch (error) {
    exibirResultado('CURTIR POSTAGEM', false, null, error)
    return false
  }
}

// 6️⃣ TESTE: Descurtir Postagem
async function testarDescurtirPostagem() {
  try {
    console.log('\n🔵 TESTE 6: Descurtir postagem')
    console.log('   Postagem ID:', postagemId)
    
    const response = await axios.post(`${API_URL}/postagens/${postagemId}/curtir`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data.success && response.data.action === 'removed') {
      exibirResultado('DESCURTIR POSTAGEM', true, {
        acao: response.data.action,
        mensagem: response.data.message
      })
      return true
    } else {
      exibirResultado('DESCURTIR POSTAGEM', false, null, new Error('Curtida não foi removida'))
      return false
    }
  } catch (error) {
    exibirResultado('DESCURTIR POSTAGEM', false, null, error)
    return false
  }
}

// 7️⃣ TESTE: Comentar em Postagem
async function testarComentarPostagem() {
  try {
    console.log('\n🔵 TESTE 7: Adicionar comentário')
    console.log('   Postagem ID:', postagemId)
    
    const comentario = {
      conteudo: 'Este é um comentário de teste automático para validar a funcionalidade!'
    }
    
    const response = await axios.post(`${API_URL}/postagens/${postagemId}/comentarios`, comentario, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data.success && response.data.data.id) {
      exibirResultado('ADICIONAR COMENTÁRIO', true, {
        comentarioId: response.data.data.id,
        usuario: response.data.data.usuario,
        conteudo: response.data.data.conteudo
      })
      return true
    } else {
      exibirResultado('ADICIONAR COMENTÁRIO', false, null, new Error('ID do comentário não recebido'))
      return false
    }
  } catch (error) {
    exibirResultado('ADICIONAR COMENTÁRIO', false, null, error)
    return false
  }
}

// 8️⃣ TESTE: Listar Comentários
async function testarListarComentarios() {
  try {
    console.log('\n🔵 TESTE 8: Listar comentários da postagem')
    console.log('   Postagem ID:', postagemId)
    
    const response = await axios.get(`${API_URL}/postagens/${postagemId}/comentarios`)
    
    if (response.data.success && Array.isArray(response.data.data)) {
      exibirResultado('LISTAR COMENTÁRIOS', true, {
        totalComentarios: response.data.data.length,
        primeiroComentario: response.data.data[0] ? {
          id: response.data.data[0].id,
          usuario: response.data.data[0].usuario,
          conteudo: response.data.data[0].conteudo.substring(0, 40) + '...'
        } : null
      })
      return true
    } else {
      exibirResultado('LISTAR COMENTÁRIOS', false, null, new Error('Array de comentários não recebido'))
      return false
    }
  } catch (error) {
    exibirResultado('LISTAR COMENTÁRIOS', false, null, error)
    return false
  }
}

// Executar todos os testes em sequência
async function executarTodosTestes() {
  const resultados = {
    total: 8,
    sucesso: 0,
    falha: 0
  }

  const testes = [
    { nome: 'Cadastro', fn: testarCadastro },
    { nome: 'Login', fn: testarLogin },
    { nome: 'Criar Postagem', fn: testarCriarPostagem },
    { nome: 'Listar Postagens', fn: testarListarPostagens },
    { nome: 'Curtir Postagem', fn: testarCurtirPostagem },
    { nome: 'Descurtir Postagem', fn: testarDescurtirPostagem },
    { nome: 'Comentar Postagem', fn: testarComentarPostagem },
    { nome: 'Listar Comentários', fn: testarListarComentarios }
  ]

  for (const teste of testes) {
    const sucesso = await teste.fn()
    if (sucesso) {
      resultados.sucesso++
    } else {
      resultados.falha++
    }
    
    // Aguarda 500ms entre testes
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Resumo final
  console.log('\n\n╔═══════════════════════════════════════════════════════╗')
  console.log('║              📊 RESUMO DOS TESTES                      ║')
  console.log('╚═══════════════════════════════════════════════════════╝')
  console.log(`\n  Total de Testes:     ${resultados.total}`)
  console.log(`  ✅ Sucessos:          ${resultados.sucesso}`)
  console.log(`  ❌ Falhas:            ${resultados.falha}`)
  console.log(`  📈 Taxa de Sucesso:   ${((resultados.sucesso / resultados.total) * 100).toFixed(1)}%`)
  
  if (resultados.falha === 0) {
    console.log('\n  🎉 TODOS OS TESTES PASSARAM COM SUCESSO!')
    console.log('  ✅ Sistema 100% funcional com MySQL (Railway)\n')
  } else {
    console.log('\n  ⚠️  Alguns testes falharam. Verifique os logs acima.\n')
  }
}

// Inicia os testes
executarTodosTestes().catch(error => {
  console.error('\n❌ Erro fatal ao executar testes:', error.message)
  process.exit(1)
})
