// backend/config/env.js
require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET'];
required.forEach((k) => {
  if (!process.env[k]) {
    console.error(`❌ Variável de ambiente ${k} não encontrada. Abortando inicialização.`);
    process.exit(1);
  }
});

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};
