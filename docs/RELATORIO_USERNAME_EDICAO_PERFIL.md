# Relatório: Implementação de Edição de Username no Perfil

**Data:** 2025
**Desenvolvedor:** GitHub Copilot
**Solicitante:** Gerente de Projeto UniSafe

---

## 📋 Objetivo

Permitir que usuários que já foram cadastrados antes da implementação do sistema de username possam criar ou editar seus nomes de usuário através da página de perfil, garantindo que todas as contas tenham usernames para funcionalidades futuras.

---

## 🎯 Requisitos Cumpridos

### ✅ Funcionalidades Implementadas

1. **Campo de Username no Perfil**
   - Campo editável na página de perfil
   - Validação em tempo real (igual ao cadastro)
   - Verificação de disponibilidade com feedback visual
   - Obrigatório para contas sem username
   - Opcional para contas que já possuem username

2. **Validação Frontend**
   - Auto-conversão para lowercase
   - Remoção de caracteres inválidos durante digitação
   - Verificação de disponibilidade no `onBlur`
   - Feedback visual (bordas coloridas, ícones)
   - Mensagens de erro/sucesso
   - Loading spinner durante verificação

3. **Validação Backend**
   - Validação de formato (3-30 caracteres, a-z0-9._)
   - Verificação de duplicidade (case-insensitive)
   - Exclusão do próprio usuário na verificação
   - Sanitização e conversão para lowercase antes de salvar

---

## 🔧 Alterações Técnicas

### 📄 Frontend: `frontend/pages/perfil.js`

#### 1. **Estados Adicionados**
```javascript
const [usernameOriginal, setUsernameOriginal] = useState('')
const [verificandoUsername, setVerificandoUsername] = useState(false)
const [usernameJaEmUso, setUsernameJaEmUso] = useState(false)

// Adicionado ao formData
username: usuario?.username || ''
```

#### 2. **Funções de Validação**
- `verificarUsernameDisponivel()`: Verifica disponibilidade via API
- `handleUsernameBlur()`: Valida ao perder foco (previne requisições desnecessárias)
- `handleUsernameChange()`: Auto-formata e limpa caracteres inválidos

#### 3. **Atualização da Função `carregarPerfil`**
```javascript
setFormData({
  nome: dados.nome || '',
  username: dados.username || '', // NOVO
  bio: dados.bio || '',
  avatar_url: dados.avatar_url || '',
  telefone: dados.telefone || ''
})
setUsernameOriginal(dados.username || '') // NOVO
```

#### 4. **Atualização da Função `salvarPerfil`**
- Incluído `username` no objeto enviado ao backend
- Username é enviado apenas se for diferente do original

#### 5. **Campo de Input Adicionado**
Localização: Entre campo "Nome" e campo "Bio"

**Características:**
- Prefixo visual `@` para indicar username
- Borda verde quando disponível
- Borda vermelha quando em uso
- Spinner durante verificação
- Ícones de check/erro
- Mensagens de feedback
- Obrigatório (`required`) se usuário não tiver username
- Help text diferenciado para novos usuários

---

### 📄 Backend: `backend/routes/usuarios.js`

#### 1. **Validação Adicionada na Rota PUT `/api/usuarios/:id`**
```javascript
body('username')
  .optional()
  .trim()
  .isLength({ min: 3, max: 30 })
  .withMessage('Nome de usuário deve ter entre 3 e 30 caracteres')
  .matches(/^[a-z0-9._]+$/)
  .withMessage('Nome de usuário pode conter apenas letras minúsculas, números, pontos e sublinhados')
```

#### 2. **Verificação de Duplicidade**
```javascript
if (username !== undefined) {
  const usernameExistente = await db.query(
    'SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?) AND id != ?',
    [username.trim().toLowerCase(), id]
  )

  if (usernameExistente.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Nome de usuário já está em uso'
    })
  }
}
```

#### 3. **Processamento do Username**
```javascript
if (username !== undefined) {
  campos.push('username = ?')
  valores.push(username.trim().toLowerCase())
}
```

#### 4. **Resposta Atualizada**
- Query SELECT agora inclui o campo `username`

---

## 🎨 Interface do Usuário

### Feedback Visual

| Estado | Borda | Ícone | Mensagem |
|--------|-------|-------|----------|
| **Digitando** | Cinza | - | Help text (regras) |
| **Verificando** | Cinza | Spinner | - |
| **Disponível** | Verde | ✓ | "Nome de usuário disponível!" |
| **Em Uso** | Vermelha | ✗ | "Este nome de usuário já está em uso" |
| **Inválido** | Vermelha | ✗ | Mensagem de erro específica |
| **Sem Mudança** | Cinza | - | Help text (regras) |

### Mensagem de Help Text

**Para usuários SEM username:**
> Obrigatório para novos recursos. Use apenas letras minúsculas, números, pontos e underscores (3-30 caracteres)

**Para usuários COM username:**
> Use apenas letras minúsculas, números, pontos e underscores (3-30 caracteres)

---

## 🔒 Regras de Validação

### Formato
- ✅ Mínimo: 3 caracteres
- ✅ Máximo: 30 caracteres
- ✅ Permitido: `a-z`, `0-9`, `.`, `_`
- ✅ Case-insensitive (armazenado em lowercase)

### Unicidade
- ✅ Não pode duplicar username existente
- ✅ Comparação case-insensitive
- ✅ Exclui o próprio usuário da verificação

### Obrigatoriedade
- ✅ Obrigatório para contas SEM username
- ✅ Opcional para contas COM username
- ✅ Campo marcado com `*` vermelho quando obrigatório

---

## 🔄 Fluxo de Validação

### Frontend
1. Usuário digita → Auto-conversão lowercase e remoção de chars inválidos
2. Usuário sai do campo (`onBlur`) → Verifica formato básico
3. Se formato válido E diferente do original → Chama API `/verificar-username`
4. Aguarda resposta → Mostra spinner
5. Recebe resposta → Atualiza estado e UI

### Backend (PUT `/api/usuarios/:id`)
1. Recebe `username` no body
2. Valida formato com `express-validator`
3. Se username fornecido → Verifica duplicidade (excluindo próprio ID)
4. Se duplicado → Retorna erro 400
5. Se válido → Converte para lowercase e salva
6. Retorna dados atualizados (incluindo username)

---

## 🧪 Casos de Teste

### Cenários a Testar

#### ✅ Cenário 1: Usuário Novo (sem username)
- [ ] Campo aparece como obrigatório (asterisco vermelho)
- [ ] Não permite salvar perfil sem username
- [ ] Aceita username válido e disponível
- [ ] Rejeita username já em uso
- [ ] Rejeita username com formato inválido

#### ✅ Cenário 2: Usuário Existente (com username)
- [ ] Campo pré-preenchido com username atual
- [ ] Permite salvar sem alterar username
- [ ] Permite alterar para novo username válido
- [ ] Não verifica API se username não foi alterado
- [ ] Rejeita se tentar usar username de outro usuário

#### ✅ Cenário 3: Validação de Formato
- [ ] Aceita: `joao`, `maria123`, `pedro.silva`, `ana_costa`
- [ ] Rejeita: `Jo`, `J` (menos de 3 chars)
- [ ] Rejeita: `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` (mais de 30 chars)
- [ ] Rejeita: `João`, `maria@`, `pedro#silva` (chars inválidos)
- [ ] Auto-converte: `MARIA` → `maria`, `Pedro` → `pedro`

#### ✅ Cenário 4: Verificação de Duplicidade
- [ ] Aceita username único
- [ ] Rejeita username já cadastrado (case-insensitive)
- [ ] Permite manter próprio username sem erro

#### ✅ Cenário 5: Feedback Visual
- [ ] Spinner aparece durante verificação
- [ ] Borda verde para disponível
- [ ] Borda vermelha para em uso
- [ ] Ícone check verde para disponível
- [ ] Ícone X vermelho para em uso

---

## 📊 Estrutura de Dados

### Request (PUT `/api/usuarios/:id`)
```json
{
  "nome": "João Silva",
  "username": "joaosilva",
  "bio": "Desenvolvedor Full Stack",
  "avatar_url": "https://exemplo.com/avatar.jpg",
  "telefone": "(11) 99999-9999"
}
```

### Response (Sucesso)
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso!",
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@gmail.com",
    "username": "joaosilva",
    "bio": "Desenvolvedor Full Stack",
    "avatar_url": "https://exemplo.com/avatar.jpg",
    "telefone": "(11) 99999-9999"
  }
}
```

### Response (Erro - Username em Uso)
```json
{
  "success": false,
  "message": "Nome de usuário já está em uso"
}
```

---

## 🚀 Próximos Passos

### Testes Recomendados
1. ✅ Testar edição com conta antiga (sem username)
2. ✅ Testar edição com conta nova (com username)
3. ✅ Testar unicidade (tentar duplicar username)
4. ✅ Testar validação de formato
5. ✅ Testar conversão automática para lowercase

### Melhorias Futuras (Opcional)
- [ ] Implementar histórico de usernames (impedir reutilização)
- [ ] Adicionar cooldown para mudança de username (ex: 1x por mês)
- [ ] Mostrar username no header/navbar
- [ ] Implementar URL de perfil público: `/perfil/@username`
- [ ] Sistema de menções `@username` em comentários

---

## 📝 Notas Técnicas

### Consistência com Cadastro
- Mesma lógica de validação usada em `cadastro.js`
- Mesmos estados e funções adaptados para edição
- Mesma aparência visual (bordas, ícones, mensagens)

### Performance
- Verificação de API apenas no `onBlur` (não a cada tecla)
- Não verifica se username não foi alterado (compara com `usernameOriginal`)
- Debounce implícito através do evento `onBlur`

### Segurança
- Validação dupla (frontend + backend)
- Sanitização automática (lowercase, trim)
- Proteção contra duplicidade case-insensitive
- Usuário só pode editar próprio perfil (verificação via token JWT)

### Compatibilidade
- ✅ Contas antigas (sem username): campo obrigatório
- ✅ Contas novas (com username): campo editável
- ✅ Migração gradual: usuários adicionam quando editam perfil

---

## 🎓 Lições Aprendidas

1. **Reutilização de Código**: Funções de validação do cadastro foram adaptadas para o perfil, mantendo consistência
2. **UX**: Campo obrigatório apenas para quem não tem username evita frustração
3. **Validação Inteligente**: Comparar com `usernameOriginal` evita requisições desnecessárias
4. **Feedback Visual**: Cores e ícones claros melhoram a experiência do usuário

---

## ✅ Conclusão

O sistema de edição de username foi implementado com sucesso, permitindo que:

- Usuários antigos criem seus usernames
- Usuários novos editem seus usernames
- Validação robusta garanta unicidade
- Interface intuitiva guie o usuário

**Status:** ✅ Implementação Completa
**Pronto para:** Testes de Usuário
**Backward Compatible:** Sim
**Breaking Changes:** Não

---

*Desenvolvido com ❤️ para UniSafe - Plataforma de Denúncias Universitárias*
