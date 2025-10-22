// frontend/config/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const endpoints = {
  base: API_URL,
  login: `${API_URL}/api/auth/login`,
  cadastro: `${API_URL}/api/auth/cadastro`,
  usuarios: `${API_URL}/api/usuarios`,
  perfilPublico: (username) => `${API_URL}/api/usuarios/perfil/${username}`,
  postagens: `${API_URL}/api/postagens`,
  postar: `${API_URL}/api/postagens`,
  curtir: (id) => `${API_URL}/api/postagens/${id}/curtir`,
  comentarios: (id) => `${API_URL}/api/postagens/${id}/comentarios`,
  perfil: `${API_URL}/api/auth/perfil`,
  notificacoes: `${API_URL}/api/notificacoes`,
  
  // Endpoints de amizade
  amigos: {
    enviar: `${API_URL}/api/amigos/enviar`,
    aceitar: `${API_URL}/api/amigos/aceitar`,
    recusar: `${API_URL}/api/amigos/recusar`,
    lista: (id) => `${API_URL}/api/amigos/lista/${id}`,
    pedidos: `${API_URL}/api/amigos/pedidos`,
    remover: (id) => `${API_URL}/api/amigos/remover/${id}`,
    status: (id) => `${API_URL}/api/amigos/status/${id}`,
  }
};

export default API_URL;
