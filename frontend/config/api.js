// frontend/config/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const endpoints = {
  base: API_URL,
  login: `${API_URL}/api/auth/login`,
  cadastro: `${API_URL}/api/auth/cadastro`,
  usuarios: `${API_URL}/api/usuarios`,
  postagens: `${API_URL}/api/postagens`,
  postar: `${API_URL}/api/postagens`,
  curtir: (id) => `${API_URL}/api/postagens/${id}/curtir`,
  comentarios: (id) => `${API_URL}/api/postagens/${id}/comentarios`,
  perfil: `${API_URL}/api/auth/perfil`,
  notificacoes: `${API_URL}/api/notificacoes`,
};

export default API_URL;
