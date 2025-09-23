-- =====================================================
-- Script de Dados de Exemplo - UniSafe
-- =====================================================
-- 
-- Este script insere dados de exemplo para testar
-- a plataforma UniSafe em desenvolvimento.
--
-- ATENÇÃO: Use apenas em ambiente de desenvolvimento!
-- =====================================================

USE unisafe_db;

-- Limpa dados existentes (cuidado em produção!)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notificacoes;
TRUNCATE TABLE curtidas;
TRUNCATE TABLE comentarios;
TRUNCATE TABLE postagens;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- USUÁRIOS DE EXEMPLO
-- =====================================================

-- Senhas para todos os usuários: 123456 (criptografada)
-- Hash gerado com bcrypt salt 12: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e

INSERT INTO usuarios (nome, email, senha, telefone, verificado, criado_em) VALUES
-- Administrador do sistema
('Rafael Silva Admin', 'admin@unisafe.dev', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e', '(11) 99999-0000', true, '2024-01-15 10:00:00'),

-- Usuários da comunidade
('Ana Costa Silva', 'ana.costa@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e', '(11) 98765-4321', true, '2024-02-01 14:30:00'),

('Bruno Santos Oliveira', 'bruno.santos@hotmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e', '(11) 97654-3210', true, '2024-02-05 09:15:00'),

('Carla Oliveira Mendes', 'carla.oliveira@yahoo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e', '(11) 96543-2109', true, '2024-02-10 16:45:00'),

('Diego Lima Torres', 'diego.lima@outlook.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e', '(11) 95432-1098', true, '2024-02-12 11:20:00'),

('Elena Rodriguez Santos', 'elena.rodriguez@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e', '(11) 94321-0987', true, '2024-02-15 13:10:00'),

('Felipe Torres Costa', 'felipe.torres@uol.com.br', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e', '(11) 93210-9876', false, '2024-02-18 08:00:00'),

('Gabriela Mendes Lima', 'gabriela.mendes@terra.com.br', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHuPzaJ6Wv1.D6e', '(11) 92109-8765', true, '2024-02-20 15:30:00');

-- =====================================================
-- POSTAGENS DE EXEMPLO
-- =====================================================

INSERT INTO postagens (usuario_id, conteudo, tipo, criado_em) VALUES

-- Postagens do admin
(1, 'Bem-vindos ao UniSafe! 🎉 Esta é nossa plataforma colaborativa de segurança para a comunidade. Vizinhos ajudando vizinhos a manter nosso bairro mais seguro para todos!', 'informacao', '2024-02-01 10:00:00'),

(1, '📢 LEMBRETE IMPORTANTE: Sempre tranquem carros, motos e bicicletas ao deixá-los na rua. Temos notado um aumento nos casos de furto de veículos na região. Usem travas de qualidade e, se possível, deixem em locais movimentados.', 'aviso', '2024-02-02 14:30:00'),

-- Postagens de membros da comunidade
(2, '⚠️ ATENÇÃO: Obras na Rua das Flores esquina com Av. Central. O trânsito está desviado e a iluminação está comprometida. Cuidado ao passar pela região à noite!', 'alerta', '2024-02-03 08:15:00'),

(3, 'Pessoal, cuidado ao caminhar pela praça após às 18h. A iluminação está com problemas em alguns pontos. Já reportei para a prefeitura, mas até lá, andem em grupos quando possível. 💡', 'aviso', '2024-02-04 17:45:00'),

(4, 'Encontrei uma carteira na padaria da esquina. Se alguém perdeu, estou com o Sr. João do estabelecimento. Tem documentos e cartões dentro. 📄', 'informacao', '2024-02-05 13:20:00'),

(5, '🚨 EMERGÊNCIA RESOLVIDA: Vazamento de gás na Rua dos Coqueiros já foi solucionado. Bombeiros confirmaram que a área está segura. Obrigada a todos que ajudaram no isolamento!', 'emergencia', '2024-02-06 11:30:00'),

(6, 'Pessoal do condomínio Residencial Flores, atenção! Relataram tentativa de invasão no bloco C ontem à noite. Portaria reforçou segurança. Fiquem atentos a pessoas estranhas. �', 'alerta', '2024-02-07 09:00:00'),

(7, 'Que alegria! A ronda noturna da PM foi reforçada no nosso bairro. Vi duas viaturas patrulhando hoje. Me sinto mais seguro saindo à noite. Obrigado às autoridades! 👮‍♂️', 'informacao', '2024-02-08 21:30:00'),

(8, '📍 Cuidado na esquina da farmácia! O piso está molhado devido à chuva e está muito escorregadio. Quase escorreguei agora pouco. Pedestres, andem devagar!', 'alerta', '2024-02-09 16:15:00'),

(2, 'Organizando um grupo para caminhada noturna às 20h. Quem tem interesse em participar? Vamos pela Rua Principal até a praça e voltamos. União faz a força! 🚶‍♀️🚶‍♂️', 'informacao', '2024-02-10 19:45:00'),

(3, '⚠️ CUIDADO: Tentativa de assalto próximo ao mercado central ontem à noite (22:30h). A pessoa conseguiu escapar, mas fiquem atentos. Polícia foi informada e vai reforçar rondas.', 'alerta', '2024-02-11 07:30:00'),

(5, 'Pessoal, perdi minha bolsa no ponto de ônibus da Av. Brasil. Se alguém encontrar, meu nome é Elena Rodriguez. Podem me contactar pelo app. Obrigada! 👜', 'informacao', '2024-02-12 14:20:00'),

(1, '📊 ATUALIZAÇÃO SEMANAL: Esta semana nossa comunidade registrou 3 achados e perdidos resolvidos, 1 emergência solucionada e 5 melhorias de segurança reportadas. Parabéns pela união, vizinhos!', 'informacao', '2024-02-13 10:00:00');

-- =====================================================
-- CURTIDAS DE EXEMPLO
-- =====================================================

INSERT INTO curtidas (postagem_id, usuario_id, criado_em) VALUES
-- Postagem de boas-vindas recebe muitas curtidas
(1, 2, '2024-02-01 10:30:00'),
(1, 3, '2024-02-01 11:00:00'),
(1, 4, '2024-02-01 11:15:00'),
(1, 5, '2024-02-01 12:00:00'),
(1, 6, '2024-02-01 14:30:00'),
(1, 7, '2024-02-01 15:00:00'),
(1, 8, '2024-02-01 16:45:00'),

-- Outras postagens também recebem curtidas
(2, 3, '2024-02-02 15:00:00'),
(2, 4, '2024-02-02 15:30:00'),
(2, 5, '2024-02-02 16:00:00'),
(2, 8, '2024-02-02 17:00:00'),

(3, 1, '2024-02-03 08:30:00'),
(3, 4, '2024-02-03 09:00:00'),
(3, 6, '2024-02-03 10:00:00'),

(4, 2, '2024-02-04 18:00:00'),
(4, 5, '2024-02-04 18:30:00'),

(5, 1, '2024-02-06 11:45:00'),
(5, 2, '2024-02-06 12:00:00'),
(5, 3, '2024-02-06 12:15:00'),
(5, 4, '2024-02-06 12:30:00'),
(5, 6, '2024-02-06 13:00:00'),
(5, 7, '2024-02-06 13:30:00'),
(5, 8, '2024-02-06 14:00:00');

-- =====================================================
-- COMENTÁRIOS DE EXEMPLO
-- =====================================================

INSERT INTO comentarios (postagem_id, usuario_id, conteudo, criado_em) VALUES
-- Comentários na postagem de boas-vindas
(1, 2, 'Que iniciativa incrível! Já estava sentindo falta de algo assim no campus.', '2024-02-01 11:30:00'),
(1, 4, 'Parabéns pela criação da plataforma! Vai ajudar muito a comunidade.', '2024-02-01 12:30:00'),
(1, 6, 'Finalmente uma forma organizada de compartilhar informações de segurança. Adorei!', '2024-02-01 15:30:00'),

-- Comentários sobre furtos de bicicletas
(2, 3, 'Aconteceu com um amigo meu semana passada. Levaram a bike dele que estava só com aqueles cadeados finos.', '2024-02-02 15:15:00'),
(2, 7, 'Recomendo os cadeados tipo U-Lock. São mais caros mas muito mais seguros que corrente.', '2024-02-02 16:30:00'),
(2, 8, 'Onde posso comprar esses cadeados melhores? Alguém tem indicação de loja?', '2024-02-02 17:15:00'),

-- Comentários sobre obra na entrada
(3, 1, 'Obrigado pela informação! Vou avisar na página oficial da universidade também.', '2024-02-03 08:45:00'),
(3, 5, 'Que bom que avisaram! Ia chegar atrasada na aula sem saber da obra.', '2024-02-03 09:30:00'),

-- Comentários sobre iluminação
(4, 2, 'Também notei isso ontem! Principalmente perto do bloco C.', '2024-02-04 18:15:00'),
(4, 6, 'Vou evitar passar por lá sozinha à noite. Obrigada pelo aviso!', '2024-02-04 19:00:00'),

-- Comentários sobre carteira perdida
(5, 3, 'Espero que o dono apareça! Que legal você ter levado para a coordenação.', '2024-02-05 14:00:00'),

-- Comentários sobre emergência no refeitório
(6, 2, 'Nossa! Que susto. Ainda bem que isolaram rápido a área.', '2024-02-06 12:00:00'),
(6, 4, 'Bombeiros foram super rápidos! Vi eles chegando. Situação já resolvida?', '2024-02-06 13:15:00'),
(6, 7, 'Estava no refeitório auxiliar na hora. Fiquei sabendo pelo barulho das sirenes.', '2024-02-06 14:30:00'),

-- Comentários sobre grupo noturno
(10, 4, 'Ótima ideia! Também saio no mesmo horário. Como organizamos isso?', '2024-02-10 20:00:00'),
(10, 6, 'Me interessei! Passo pelo Centro também. Podemos criar um grupo no WhatsApp?', '2024-02-10 20:30:00'),

-- Comentários sobre tentativa de assalto
(11, 1, 'Informação muito importante! Vou reforçar as orientações de segurança nos comunicados.', '2024-02-11 08:00:00'),
(11, 5, 'Que susto! Ainda bem que a pessoa conseguiu escapar. Vou evitar passar sozinha por ali.', '2024-02-11 08:30:00'),
(11, 8, 'Devemos pedir para instalarem mais câmeras nessa região também.', '2024-02-11 09:00:00');

-- =====================================================
-- NOTIFICAÇÕES DE EXEMPLO
-- =====================================================

INSERT INTO notificacoes (usuario_id, tipo, titulo, conteudo, criado_em) VALUES
(2, 'comentario', 'Novo comentário na sua postagem', 'Alguém comentou na sua postagem sobre obra na entrada principal.', '2024-02-03 08:50:00'),
(3, 'curtida', 'Sua postagem recebeu curtidas', 'Sua postagem sobre iluminação do estacionamento recebeu 2 novas curtidas.', '2024-02-04 19:30:00'),
(1, 'sistema', 'Relatório semanal disponível', 'O relatório de atividades da semana está disponível para visualização.', '2024-02-13 10:30:00');

-- =====================================================
-- CONSULTAS DE VERIFICAÇÃO
-- =====================================================

-- Mostra estatísticas dos dados inseridos
SELECT 'Dados de exemplo inseridos com sucesso!' as status;

SELECT 
    (SELECT COUNT(*) FROM usuarios) as total_usuarios,
    (SELECT COUNT(*) FROM postagens) as total_postagens,
    (SELECT COUNT(*) FROM curtidas) as total_curtidas,
    (SELECT COUNT(*) FROM comentarios) as total_comentarios,
    (SELECT COUNT(*) FROM notificacoes) as total_notificacoes;

-- Mostra distribuição de tipos de postagens
SELECT tipo, COUNT(*) as quantidade 
FROM postagens 
GROUP BY tipo 
ORDER BY quantidade DESC;

-- Mostra usuários mais ativos (com mais postagens)
SELECT u.nome, u.curso, COUNT(p.id) as total_postagens
FROM usuarios u
LEFT JOIN postagens p ON u.id = p.usuario_id
GROUP BY u.id, u.nome, u.curso
ORDER BY total_postagens DESC;

SELECT '✅ Banco de dados populado com dados de exemplo!' as resultado;
