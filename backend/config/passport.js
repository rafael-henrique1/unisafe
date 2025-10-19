/**
 * Configuração do Passport.js para Google OAuth 2.0
 * 
 * Este arquivo configura a estratégia de autenticação via Google
 * permitindo que usuários façam login ou cadastro usando Gmail
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const db = require('./database');
const { JWT_SECRET } = require('./env');

/**
 * Estratégia de autenticação Google OAuth 2.0
 * Permite login/cadastro automático com conta Google
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extrai informações do perfil Google
        const email = profile.emails[0].value;
        const nome = profile.displayName;
        const foto = profile.photos?.[0]?.value || null;

        console.log(`🔐 Tentativa de login Google: ${email}`);

        // Obtém o pool de conexões
        const pool = await db.getPool();

        // Verifica se usuário já existe no banco
        const [rows] = await pool.execute(
          'SELECT * FROM usuarios WHERE email = ?',
          [email]
        );

        let usuario;

        if (rows.length > 0) {
          // Usuário já existe - faz login
          usuario = rows[0];
          console.log(`✅ Usuário existente autenticado: ${usuario.nome}`);
        } else {
          // Usuário novo - cadastra automaticamente
          const [result] = await pool.execute(
            'INSERT INTO usuarios (nome, email, foto_perfil, criado_em) VALUES (?, ?, ?, NOW())',
            [nome, email, foto]
          );
          
          usuario = {
            id: result.insertId,
            nome,
            email,
            foto_perfil: foto
          };

          console.log(`✅ Novo usuário cadastrado via Google: ${usuario.nome}`);
        }

        // Gera token JWT interno (7 dias de validade)
        const token = jwt.sign(
          { id: usuario.id, email: usuario.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Retorna usuário e token
        return done(null, { usuario, token });
      } catch (err) {
        console.error('❌ Erro na autenticação Google:', err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
