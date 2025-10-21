/**
 * Rotas de Autenticação via Google OAuth 2.0
 * 
 * Este arquivo gerencia as rotas de login social com Google
 * permitindo autenticação rápida e segura via Gmail
 */

const express = require('express');
const passport = require('../config/passport');
const { FRONTEND_URL } = require('../config/env');

const router = express.Router();

/**
 * Rota GET /api/auth/google
 * Redireciona o usuário para a tela de login do Google
 * Solicita permissões de acesso ao perfil e email
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

/**
 * Rota GET /api/auth/google/callback
 * Callback de retorno da autenticação Google
 * Recebe o código de autorização, valida e gera JWT interno
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`
  }),
  (req, res) => {
    try {
      const { token, usuario } = req.user;

      console.log(`✅ Login Google bem-sucedido: ${usuario.email}`);

      // Redireciona para o frontend com token JWT na URL
      // O frontend captura o token e armazena no localStorage
      res.redirect(`${FRONTEND_URL}/login/success?token=${token}`);
    } catch (error) {
      console.error('❌ Erro no callback Google:', error);
      res.redirect(`${FRONTEND_URL}/login?error=callback_error`);
    }
  }
);

module.exports = router;
