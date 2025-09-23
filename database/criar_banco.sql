-- =====================================================
-- Script de Criação do Banco de Dados UniSafe
-- =====================================================
-- 
-- Este script cria a estrutura completa do banco de dados
-- para a plataforma UniSafe de segurança comunitária.
--
-- Para executar:
-- 1. Conecte-se ao MySQL como root ou admin
-- 2. Execute: mysql -u root -p < criar_banco.sql
-- =====================================================

-- Cria o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS unisafe_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Seleciona o banco criado
USE unisafe_db;

-- =====================================================
-- TABELA DE USUÁRIOS
-- =====================================================
-- Armazena informações dos usuários da plataforma

CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL COMMENT 'Nome completo do usuário',
    email VARCHAR(150) UNIQUE NOT NULL COMMENT 'Email pessoal único',
    senha VARCHAR(255) NOT NULL COMMENT 'Senha criptografada com bcrypt',
    telefone VARCHAR(20) NULL COMMENT 'Telefone opcional do usuário',
    avatar_url VARCHAR(500) NULL COMMENT 'URL do avatar do usuário (futuro)',
    ativo BOOLEAN DEFAULT true COMMENT 'Se a conta está ativa',
    verificado BOOLEAN DEFAULT false COMMENT 'Se o email foi verificado',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação da conta',
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última atualização',
    
    -- Índices para melhorar performance
    INDEX idx_email (email),
    INDEX idx_ativo (ativo),
    INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabela de usuários da plataforma UniSafe - Comunidade geral';

-- =====================================================
-- TABELA DE POSTAGENS
-- =====================================================
-- Armazena as postagens de segurança da comunidade

CREATE TABLE IF NOT EXISTS postagens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL COMMENT 'ID do usuário que criou a postagem',
    conteudo TEXT NOT NULL COMMENT 'Conteúdo da postagem',
    tipo ENUM('aviso', 'alerta', 'emergencia', 'informacao') NOT NULL DEFAULT 'aviso' 
        COMMENT 'Tipo da postagem: aviso, alerta, emergencia, informacao',
    localizacao VARCHAR(255) NULL COMMENT 'Localização do incidente (futuro)',
    imagem_url VARCHAR(500) NULL COMMENT 'URL da imagem anexada (futuro)',
    coordenadas_lat DECIMAL(10,8) NULL COMMENT 'Latitude para geolocalização (futuro)',
    coordenadas_lng DECIMAL(11,8) NULL COMMENT 'Longitude para geolocalização (futuro)',
    ativo BOOLEAN DEFAULT true COMMENT 'Se a postagem está ativa/visível',
    fixada BOOLEAN DEFAULT false COMMENT 'Se a postagem está fixada (futuro)',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última atualização',
    
    -- Chaves estrangeiras
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índices para melhorar performance
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_tipo (tipo),
    INDEX idx_criado_em (criado_em),
    INDEX idx_ativo (ativo),
    INDEX idx_tipo_data (tipo, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabela de postagens de segurança';

-- =====================================================
-- TABELA DE CURTIDAS
-- =====================================================
-- Armazena as curtidas nas postagens

CREATE TABLE IF NOT EXISTS curtidas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    postagem_id INT NOT NULL COMMENT 'ID da postagem curtida',
    usuario_id INT NOT NULL COMMENT 'ID do usuário que curtiu',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data da curtida',
    
    -- Chaves estrangeiras
    FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Evita curtidas duplicadas
    UNIQUE KEY unique_curtida (postagem_id, usuario_id),
    
    -- Índices para melhorar performance
    INDEX idx_postagem_id (postagem_id),
    INDEX idx_usuario_id (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabela de curtidas nas postagens';

-- =====================================================
-- TABELA DE COMENTÁRIOS
-- =====================================================
-- Armazena comentários nas postagens

CREATE TABLE IF NOT EXISTS comentarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    postagem_id INT NOT NULL COMMENT 'ID da postagem comentada',
    usuario_id INT NOT NULL COMMENT 'ID do usuário que comentou',
    conteudo TEXT NOT NULL COMMENT 'Conteúdo do comentário',
    ativo BOOLEAN DEFAULT true COMMENT 'Se o comentário está ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data do comentário',
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última atualização',
    
    -- Chaves estrangeiras
    FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índices para melhorar performance
    INDEX idx_postagem_id (postagem_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_criado_em (criado_em),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabela de comentários nas postagens';

-- =====================================================
-- TABELA DE SESSÕES
-- =====================================================
-- Armazena sessões de usuários (para futuras implementações)

CREATE TABLE IF NOT EXISTS sessoes (
    id VARCHAR(128) PRIMARY KEY COMMENT 'ID único da sessão',
    usuario_id INT NOT NULL COMMENT 'ID do usuário da sessão',
    dados JSON COMMENT 'Dados da sessão em formato JSON',
    ip_address VARCHAR(45) NULL COMMENT 'Endereço IP da sessão',
    user_agent TEXT NULL COMMENT 'User Agent do navegador',
    expires TIMESTAMP NOT NULL COMMENT 'Data de expiração da sessão',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação da sessão',
    
    -- Chaves estrangeiras
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índices para melhorar performance
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabela de sessões de usuários';

-- =====================================================
-- TABELA DE NOTIFICAÇÕES (Futuro)
-- =====================================================
-- Armazena notificações para os usuários

CREATE TABLE IF NOT EXISTS notificacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL COMMENT 'ID do usuário que recebe a notificação',
    tipo ENUM('curtida', 'comentario', 'postagem', 'sistema') NOT NULL COMMENT 'Tipo da notificação',
    titulo VARCHAR(255) NOT NULL COMMENT 'Título da notificação',
    conteudo TEXT NULL COMMENT 'Conteúdo da notificação',
    lida BOOLEAN DEFAULT false COMMENT 'Se a notificação foi lida',
    url VARCHAR(500) NULL COMMENT 'URL de redirecionamento (opcional)',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data da notificação',
    
    -- Chaves estrangeiras
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índices para melhorar performance
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_lida (lida),
    INDEX idx_tipo (tipo),
    INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabela de notificações para usuários';

-- =====================================================
-- INSERÇÃO DE DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Usuário administrador de exemplo (senha: admin123)
INSERT IGNORE INTO usuarios (nome, email, senha, verificado) VALUES 
('Administrador UniSafe', 'admin@unisafe.dev', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e', true);

-- Postagens de exemplo
INSERT IGNORE INTO postagens (usuario_id, conteudo, tipo) VALUES 
(1, 'Bem-vindos ao UniSafe! Esta é uma plataforma para compartilharmos informações de segurança da nossa comunidade. Juntos somos mais seguros!', 'informacao'),
(1, 'Lembrete: sempre tranquem suas bicicletas e veículos. Vários casos de furto foram reportados recentemente na região.', 'aviso'),
(1, '⚠️ Atenção: obras na rua principal. Utilizem rotas alternativas durante esta semana para maior segurança.', 'alerta');

-- =====================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- =====================================================

-- View com estatísticas de usuários
CREATE OR REPLACE VIEW estatisticas_usuarios AS
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN verificado = true THEN 1 END) as usuarios_verificados,
    COUNT(CASE WHEN ativo = true THEN 1 END) as usuarios_ativos,
    COUNT(CASE WHEN criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as novos_usuarios_30_dias
FROM usuarios;

-- View com estatísticas de postagens
CREATE OR REPLACE VIEW estatisticas_postagens AS
SELECT 
    COUNT(*) as total_postagens,
    COUNT(CASE WHEN tipo = 'emergencia' THEN 1 END) as emergencias,
    COUNT(CASE WHEN tipo = 'alerta' THEN 1 END) as alertas,
    COUNT(CASE WHEN tipo = 'aviso' THEN 1 END) as avisos,
    COUNT(CASE WHEN tipo = 'informacao' THEN 1 END) as informacoes,
    COUNT(CASE WHEN criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as postagens_semana
FROM postagens 
WHERE ativo = true;

-- =====================================================
-- TRIGGERS PARA AUDITORIA (Opcional)
-- =====================================================

-- Trigger para log de exclusão de usuários
DELIMITER //
CREATE TRIGGER IF NOT EXISTS log_delete_usuario
AFTER DELETE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO logs_auditoria (tabela, acao, registro_id, dados_antigos, criado_em) 
    VALUES ('usuarios', 'DELETE', OLD.id, JSON_OBJECT('nome', OLD.nome, 'email', OLD.email), NOW());
END //
DELIMITER ;

-- =====================================================
-- CONCLUSÃO
-- =====================================================

-- Mostra o status final
SELECT 'Banco UniSafe criado com sucesso!' as status;

-- Mostra as tabelas criadas
SHOW TABLES;

-- Mostra estatísticas iniciais
SELECT * FROM estatisticas_usuarios;
SELECT * FROM estatisticas_postagens;
