# Database Directory

Esta pasta contém o banco de dados SQLite do projeto UniSafe.

## Estrutura

- `unisafe.db` - Arquivo do banco SQLite (criado automaticamente)
- `.gitkeep` - Arquivo para manter a pasta no repositório

## Como funciona

O banco de dados é criado automaticamente quando o servidor backend é executado pela primeira vez. O arquivo `config/database.js` contém toda a lógica de:

- Criação do banco SQLite
- Criação das tabelas necessárias
- Configuração de foreign keys
- Métodos para executar queries

## Tabelas criadas automaticamente

1. **usuarios** - Dados dos usuários da plataforma
2. **postagens** - Posts de segurança da comunidade  
3. **curtidas** - Sistema de curtidas dos posts
4. **comentarios** - Comentários nas postagens

## Desenvolvimento

Durante o desenvolvimento, o arquivo `unisafe.db` é ignorado pelo git (ver `.gitignore`) para evitar conflitos entre diferentes ambientes de desenvolvimento.
