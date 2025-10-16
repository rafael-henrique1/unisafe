# 🔒 UniSafe - Plataforma de Segurança Comunitária Colaborativa

Uma plataforma web colaborativa para compartilhamento de informações de segurança em comunidades, bairros, condomínios e vizinhanças.

## 📋 Sobre o Projeto

O **UniSafe** é uma plataforma que permite a qualquer comunidade:
- � Compartilhar alertas e avisos de segurança em tempo real
- � Reportar emergências e incidentes do bairro
- 👥 Colaborar com vizinhos para manter a região segura
- 📱 Acessar informações importantes sobre segurança local
- 🤝 Fortalecer os laços comunitários através da segurança colaborativa

**Missão:** Conectar vizinhos e moradores para criar comunidades mais seguras através da informação compartilhada e colaboração mútua.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React para desenvolvimento web
- **React 18** - Biblioteca para interfaces de usuário
- **Tailwind CSS** - Framework CSS para estilização
- **Axios** - Cliente HTTP para comunicação com API

### Backend
- **Node.js** - Runtime JavaScript no servidor
- **Express.js** - Framework web para Node.js
- **MySQL 8** - Banco de dados relacional (Railway)
- **JWT** - Autenticação via JSON Web Tokens
- **bcrypt** - Criptografia de senhas

### Segurança
- **Helmet** - Headers de segurança
- **CORS** - Controle de origem de recursos
- **Express Validator** - Validação de dados

## 📁 Estrutura do Projeto

```
UniSafe/
├── frontend/          # Aplicação Next.js
│   ├── pages/         # Páginas da aplicação
│   ├── styles/        # Arquivos de CSS
│   └── package.json   # Dependências do frontend
├── backend/           # API Express.js
│   ├── routes/        # Rotas da API
│   ├── config/        # Configurações (database, socket, env)
│   ├── database/      # Documentação do banco MySQL
│   └── server.js      # Servidor principal
└── README.md          # Documentação do projeto
```

## 🚀 Como Executar o Projeto

### Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **npm** ou **yarn**

### Passo 1: Instalar Dependências

1. Clone o repositório e instale as dependências:
```bash
# Instalar dependências do projeto
npm install

# Instalar dependências do backend
cd backend
npm install

```

### Passo 2: Configurar o Backend

1. Navegue para a pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações de banco
```

4. Execute o servidor:
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O backend estará rodando em `http://localhost:5000`

### Passo 3: Configurar o Frontend

1. Navegue para a pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Execute a aplicação:
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

O frontend estará rodando em `http://localhost:3000`

## 📝 Como Usar

### Páginas Principais

1. **Página Inicial** (`/`) - Landing page com informações do projeto
2. **Login** (`/login`) - Autenticação de usuários
3. **Cadastro** (`/cadastro`) - Registro de novos usuários
4. **Feed** (`/feed`) - Timeline com postagens da comunidade

### Funcionalidades

- ✅ **Autenticação segura** com senhas robustas e JWT
- ✅ **Tipos de postagem**: Aviso, Alerta, Emergência, Informação
- ✅ **Sistema de curtidas** nas postagens
- ✅ **Validação rigorosa** de senhas (8+ chars, maiúscula, minúscula, número)
- ✅ **Comentários** (estrutura preparada)
- ✅ **Responsivo** para dispositivos móveis
- ✅ **Comunidade geral** - qualquer pessoa pode participar

## 🔗 API Endpoints

### Autenticação
- `POST /api/auth/cadastro` - Cadastrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/perfil` - Obter dados do usuário

### Postagens
- `GET /api/postagens` - Listar postagens (com paginação)
- `POST /api/postagens` - Criar postagem (requer autenticação)
- `GET /api/postagens/:id` - Obter postagem específica
- `POST /api/postagens/:id/curtir` - Curtir/descurtir postagem
- `DELETE /api/postagens/:id` - Excluir postagem (apenas autor)

### Comentários
- `GET /api/postagens/:id/comentarios` - Listar comentários
- `POST /api/postagens/:id/comentarios` - Adicionar comentário
- `DELETE /api/postagens/:id/comentarios/:comentarioId` - Excluir comentário

### Usuários
- `GET /api/usuarios` - Listar usuários (requer autenticação)
- `GET /api/usuarios/:id` - Obter perfil público
- `PUT /api/usuarios/:id` - Atualizar perfil (apenas próprio usuário)
- `DELETE /api/usuarios/:id` - Deletar conta

### WebSocket (Socket.IO)
- **Autenticação**: JWT no handshake
- **Eventos**:
  - `nova_postagem` - Broadcast de nova postagem para todos
  - `notificacao` - Notificação privada (curtida, comentário)
  - `novo_comentario` - Atualização de comentários em tempo real
  - `postagem_excluida` - Notificação de exclusão
  - `comentario_excluido` - Atualização de contador

## 🎨 Personalização

### Cores do Tema (Tailwind CSS)
```css
primary: {
  50: '#eff6ff',   /* Azul muito claro */
  500: '#3b82f6',  /* Azul médio */
  600: '#2563eb',  /* Azul escuro */
  700: '#1d4ed8'   /* Azul muito escuro */
}
```

### Componentes Reutilizáveis
```css
.btn-primary     /* Botão primário azul */
.btn-secondary   /* Botão secundário cinza */
.input-field     /* Campo de input padrão */
```

## 📊 Dados de Exemplo

O projeto inclui usuários e postagens de exemplo para facilitar testes. Você pode criar novos usuários através da página de cadastro.

**Para testes rápidos**, crie uma conta com:
- Email: seu_email@exemplo.com
- Senha: SuaSenhaSegura123 (mínimo 8 chars, 1 maiúscula, 1 minúscula, 1 número)

**Nota**: O banco de dados MySQL está vazio inicialmente. Todas as tabelas são criadas automaticamente na primeira execução.

## 🔧 Configurações de Desenvolvimento

### Variáveis de Ambiente (.env)
```bash
NODE_ENV=development
PORT=5000
JWT_SECRET=sua_chave_secreta_jwt_forte
DATABASE_URL=mysql://user:password@host:port/database
FRONTEND_URL=http://localhost:3000
```

**Nota**: O projeto utiliza MySQL 8 hospedado no Railway como banco de dados. Configure a variável `DATABASE_URL` no arquivo `.env` com suas credenciais. Consulte `backend/.env.example` para detalhes completos.

### Scripts Disponíveis

**Backend:**
- `npm run dev` - Executa com nodemon (auto-restart)
- `npm start` - Executa em produção

**Frontend:**
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run lint` - Verificar código

## 🚦 Status do Projeto

### ✅ Implementado
- [x] Estrutura básica do projeto
- [x] Autenticação (login/cadastro) com validação robusta
- [x] CRUD de postagens completo
- [x] Sistema de curtidas em tempo real
- [x] Sistema de comentários completo
- [x] Notificações em tempo real via Socket.IO
- [x] Interface responsiva com Tailwind CSS
- [x] Conexão com MySQL (Railway)
- [x] API RESTful completa com validações
- [x] Gerenciamento de perfil de usuário
- [x] Sistema de exclusão de postagens e comentários

### 🚧 Em Desenvolvimento
- [ ] Upload de imagens para postagens
- [ ] Geolocalização automática
- [ ] Filtros avançados por tipo/data
- [ ] Sistema de busca no feed
- [ ] Modo escuro (dark mode)

### 📋 Futuras Melhorias
- [ ] App móvel (React Native)
- [ ] Dashboard administrativo
- [ ] Relatórios e estatísticas
- [ ] Integração com redes sociais
- [ ] Sistema de moderação

## 👥 Contribuição

Este projeto foi desenvolvido para a comunidade universitária. Contribuições são bem-vindas!

1. Faça um fork do projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🔧 Troubleshooting

### Erro de Conexão com MySQL

**Problema**: O servidor backend não consegue conectar com o MySQL Railway.

**Solução**: 
1. Verifique se a variável `DATABASE_URL` está configurada corretamente no arquivo `backend/.env`
2. Confirme que as credenciais do Railway estão corretas (host, port, user, password, database)
3. Teste a conexão usando: `mysql -h HOST -P PORT -u USER -p`
4. Verifique se o firewall permite conexões com Railway
5. Confirme que o serviço MySQL está ativo no painel do Railway

**Causa**: Credenciais incorretas ou problemas de rede com o servidor Railway.

### Variáveis de Ambiente Ausentes

**Problema**: Servidor aborta inicialização com erro de variáveis não encontradas.

**Solução**:
1. Copie o arquivo `.env.example` para `.env` no backend
2. Configure as variáveis obrigatórias: `DATABASE_URL` e `JWT_SECRET`
3. Reinicie o servidor

**Exemplo:**
```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais
npm start
```

### Porta já em uso

Se a porta 5000 (backend) ou 3000 (frontend) estiver em uso:
- **Backend**: Altere a variável `PORT` no arquivo `.env`
- **Frontend**: O Next.js tentará automaticamente a próxima porta disponível

## �📞 Suporte

Para suporte e dúvidas:
- 📧 Email: suporte@unisafe.dev
- 🐛 Issues: [GitHub Issues](https://github.com/unisafe/unisafe/issues)
- 📖 Wiki: [Documentação Completa](https://github.com/unisafe/unisafe/wiki)

---

<p align="center">
  Feito com ❤️ para a segurança da comunidade universitária
</p>

<p align="center">
  🔒 <strong>UniSafe - Juntos Somos Mais Seguros</strong> 🔒
</p>
