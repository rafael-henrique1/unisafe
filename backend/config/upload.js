/**
 * Configuração de Upload de Imagens com Multer
 * 
 * Este arquivo configura o multer para upload de imagens nas postagens.
 * As imagens são salvas na pasta /uploads com nomes únicos.
 */

const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Garante que a pasta uploads existe
const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
  console.log('📁 Pasta uploads criada')
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Gera nome único: timestamp + random + extensão original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, 'post-' + uniqueSuffix + ext)
  }
})

// Filtro de arquivo (apenas imagens)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'))
  }
}

// Configuração do multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: fileFilter
})

module.exports = upload
