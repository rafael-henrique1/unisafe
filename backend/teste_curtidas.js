// Script de teste rápido para validar a API de curtidas
console.log('🧪 TESTE RÁPIDO - API DE CURTIDAS');

async function testarAPI() {
  // Teste 1: Verificar se feed retorna campo usuarioCurtiu
  try {
    console.log('\n1. Testando GET /api/postagens (sem autenticação)');
    const response = await fetch('http://localhost:5000/api/postagens');
    if (response.ok) {
      const data = await response.json();
      const primeiraPostagem = data.data[0];
      console.log('✅ Feed funcionando');
      console.log('   - ID:', primeiraPostagem.id);
      console.log('   - Curtidas:', primeiraPostagem.curtidas);
      console.log('   - Usuario Curtiu:', primeiraPostagem.usuarioCurtiu);
      
      if (primeiraPostagem.hasOwnProperty('usuarioCurtiu')) {
        console.log('✅ Campo usuarioCurtiu presente');
      } else {
        console.log('❌ Campo usuarioCurtiu ausente');
      }
    } else {
      console.log('❌ Erro no feed:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

testarAPI();
