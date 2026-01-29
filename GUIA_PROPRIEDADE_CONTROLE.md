# 📋 Guia de Propriedade e Controle do App Fazenda Digital

**Versão:** 4.2  
**Data:** 28 de Janeiro de 2026  
**Objetivo:** Garantir que você tenha controle total e permanente sobre o seu aplicativo, independentemente de qualquer terceiro.

---

## 1. PROPRIEDADE DO CÓDIGO-FONTE

### 1.1 Repositório GitHub (Seu Ativo Mais Importante)

O código-fonte completo do Fazenda Digital está armazenado em um repositório GitHub **privado** sob seu controle.

**Localização:**
```
https://github.com/[seu-usuario]/fazenda-digital-app
```

**O que está lá:**
- ✅ Código completo do app (React Native + Expo)
- ✅ Backend (Node.js + Express)
- ✅ Banco de dados (PostgreSQL + Drizzle ORM)
- ✅ Configurações de deploy
- ✅ Histórico completo de versões (git log)

**Por que é importante:**
- Você é o único proprietário
- Pode clonar em qualquer lugar
- Não depende de ninguém
- Pode contratar outro desenvolvedor quando quiser

### 1.2 Como Acessar e Fazer Backup

**Clonar o repositório:**
```bash
gh repo clone [seu-usuario]/fazenda-digital-app
cd fazenda-digital-app
```

**Fazer backup local:**
```bash
# Clonar com histórico completo
git clone --mirror https://github.com/[seu-usuario]/fazenda-digital-app.git
```

**Transferir para outro servidor (se necessário):**
```bash
# Você pode mover o repositório para GitLab, Gitea, ou qualquer outro serviço
# Sem perder nada do histórico
```

---

## 2. BANCO DE DADOS (PostgreSQL)

### 2.1 Acesso Direto

Você tem acesso total ao banco de dados PostgreSQL:

**Informações de Conexão:**
```
Host: [seu-servidor]
Port: 5432
Database: fazenda_digital
User: [seu-usuario]
Password: [sua-senha]
```

**Ferramentas para gerenciar:**
- **DBeaver** (gratuito, GUI)
- **pgAdmin** (web, gratuito)
- **psql** (linha de comando)

### 2.2 O Que Você Pode Fazer

✅ **Visualizar dados:**
```sql
SELECT * FROM users;
SELECT * FROM animals;
SELECT * FROM sales;
SELECT * FROM costs;
```

✅ **Fazer backups:**
```bash
pg_dump -h localhost -U usuario fazenda_digital > backup.sql
```

✅ **Restaurar backups:**
```bash
psql -h localhost -U usuario fazenda_digital < backup.sql
```

✅ **Exportar relatórios:**
```sql
-- Exemplo: Relatório de vendas por mês
SELECT 
  DATE_TRUNC('month', sale_date) as mes,
  COUNT(*) as total_vendas,
  SUM(total_value) as faturamento
FROM sales
GROUP BY DATE_TRUNC('month', sale_date);
```

✅ **Customizar estrutura:**
```sql
-- Adicionar novo campo
ALTER TABLE animals ADD COLUMN microchip_id VARCHAR(50);

-- Criar nova tabela
CREATE TABLE custom_reports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  data JSONB
);
```

### 2.3 Segurança do Banco

**Fazer backups regularmente:**
```bash
# Script de backup automático (cron job)
0 2 * * * pg_dump -h localhost -U usuario fazenda_digital > /backups/$(date +\%Y\%m\%d).sql
```

**Manter cópia offline:**
- Armazene backups em HD externo
- Ou em serviço de cloud (AWS S3, Google Drive, etc.)

---

## 3. PAINEL ADMINISTRATIVO (Dashboard do Dono)

### 3.1 Acessar o Painel

O painel administrativo está integrado no backend:

**URL:**
```
https://[seu-servidor]:3000/admin
```

**Credenciais:**
```
Email: admin@fazendadigital.com
Senha: [sua-senha-admin]
```

### 3.2 Funcionalidades Disponíveis

#### 📊 Dashboard Principal
- Total de usuários cadastrados
- Receita total (se usar modelo de assinatura)
- Atividade dos últimos 30 dias
- Gráficos de crescimento

#### 👥 Gerenciar Usuários
```
- Ver lista de todos os usuários
- Visualizar detalhes de cada usuário
- Ativar/desativar conta
- Ver histórico de login
- Exportar lista de usuários
```

#### 💰 Gerenciar Pagamentos
```
- Ver status de assinatura
- Histórico de pagamentos
- Gerar faturas
- Processar reembolsos
- Configurar preços
```

#### 📈 Relatórios
```
- Relatório de uso do app
- Métricas de engajamento
- Dados de animais cadastrados
- Histórico de vendas
- Análise de custos
```

#### ⚙️ Configurações
```
- Customizar cores/logo
- Gerenciar integrações
- Configurar notificações
- Gerenciar permissões de usuários
```

### 3.3 Acessar o Painel Administrativo

**Via código:**
```typescript
// Arquivo: server/_core/admin-routes.ts
// Você pode modificar, adicionar ou remover funcionalidades
```

---

## 4. CUSTOMIZAÇÕES E MODIFICAÇÕES

### 4.1 Estrutura de Pastas (O Que Você Pode Mudar)

```
fazenda-digital-app/
├── app/                          # Telas do app mobile
│   ├── (tabs)/
│   │   ├── index.tsx            # Dashboard (CUSTOMIZE AQUI)
│   │   ├── rebanho.tsx          # Tela de rebanho
│   │   ├── vendas.tsx           # Tela de vendas
│   │   ├── custos.tsx           # Tela de custos
│   │   └── config.tsx           # Configurações
│   └── (auth)/                  # Telas de autenticação
├── components/                   # Componentes reutilizáveis
│   ├── charts.tsx               # Gráficos (CUSTOMIZE AQUI)
│   └── ...
├── server/                       # Backend (Node.js)
│   ├── _core/                   # Lógica principal
│   ├── routes/                  # Endpoints da API
│   └── db/                      # Banco de dados
├── theme.config.js              # Cores e tema (CUSTOMIZE AQUI)
├── app.config.ts                # Configurações do app (CUSTOMIZE AQUI)
└── package.json                 # Dependências
```

### 4.2 Customizações Comuns

#### 🎨 Mudar Cores
**Arquivo:** `theme.config.js`
```javascript
const themeColors = {
  primary: "#1B4332",           // Verde principal
  secondary: "#40916C",         // Verde secundário
  accent: "#D4A574",            // Dourado
  // Customize conforme sua marca
};
```

#### 📝 Mudar Nome/Logo
**Arquivo:** `app.config.ts`
```typescript
const env = {
  appName: "Fazenda Digital",    // Seu nome
  appSlug: "fazenda-digital",
  logoUrl: "https://...",        // URL da sua logo
};
```

#### 🔧 Adicionar Novos Campos
**Exemplo:** Adicionar campo "Microchip" aos animais

1. **Banco de dados:**
```sql
ALTER TABLE animals ADD COLUMN microchip_id VARCHAR(50);
```

2. **Tipo TypeScript:**
```typescript
// lib/types.ts
interface Animal {
  id: string;
  identificador: string;
  categoria: string;
  peso: number;
  microchip_id?: string;  // Novo campo
}
```

3. **Formulário:**
```typescript
// app/(tabs)/rebanho.tsx
<TextInput
  placeholder="Microchip ID"
  value={microchip_id}
  onChangeText={setMicrochip_id}
/>
```

#### 🚀 Adicionar Novas Telas
1. Criar arquivo em `app/(tabs)/nova-tela.tsx`
2. Adicionar rota em `app/(tabs)/_layout.tsx`
3. Adicionar ícone em `components/ui/icon-symbol.tsx`

---

## 5. DEPLOY E PUBLICAÇÃO

### 5.1 App Store (iOS)

**Documentação completa:** Ver `DEPLOY_GUIDE.md`

**Passos resumidos:**
1. Criar conta Apple Developer ($99/ano)
2. Gerar certificados de assinatura
3. Build do app: `eas build --platform ios`
4. Submeter na App Store
5. Aguardar aprovação (24-48h)

**Você controla:**
- ✅ Conta Apple Developer (seu email)
- ✅ Certificados (seu controle)
- ✅ Versões publicadas
- ✅ Atualizações
- ✅ Preços e distribuição

### 5.2 Google Play (Android)

**Passos resumidos:**
1. Criar conta Google Play Developer ($25, uma vez)
2. Gerar chave de assinatura
3. Build do app: `eas build --platform android`
4. Submeter na Google Play
5. Aprovação imediata (geralmente)

**Você controla:**
- ✅ Conta Google Play (seu email)
- ✅ Chaves de assinatura
- ✅ Versões publicadas
- ✅ Atualizações
- ✅ Preços e distribuição

### 5.3 Atualizações Futuras

Você pode atualizar o app quando quiser:

```bash
# 1. Fazer mudanças no código
# 2. Testar localmente
# 3. Fazer commit no GitHub
git add .
git commit -m "Feature: adicionar novo recurso"
git push

# 4. Build nova versão
eas build --platform ios --platform android

# 5. Submeter nas lojas
# (Automático ou manual, conforme configurado)
```

---

## 6. SEGURANÇA E CREDENCIAIS

### 6.1 Informações Críticas (Guardar em Local Seguro)

**Crie um arquivo `CREDENTIALS.txt` e guarde em:**
- ✅ Cofre de senhas (1Password, Bitwarden, LastPass)
- ✅ HD externo criptografado
- ✅ Não em email ou nuvem pública

**Conteúdo do arquivo:**
```
=== FAZENDA DIGITAL - CREDENCIAIS ===

GitHub:
- URL: https://github.com/[seu-usuario]/fazenda-digital-app
- Usuário: [seu-usuario]
- Token: [seu-token-pessoal]

Apple Developer:
- Email: [seu-email]
- Senha: [sua-senha]
- Team ID: [seu-team-id]

Google Play:
- Email: [seu-email]
- Senha: [sua-senha]

PostgreSQL:
- Host: [seu-servidor]
- User: [seu-usuario]
- Password: [sua-senha]
- Database: fazenda_digital

Admin Dashboard:
- Email: admin@fazendadigital.com
- Senha: [sua-senha-admin]
```

### 6.2 Dois Fatores (2FA)

Ative em:
- ✅ GitHub
- ✅ Apple Developer
- ✅ Google Play
- ✅ Email principal

---

## 7. CONTRATANDO DESENVOLVEDORES

### 7.1 Quando Precisar de Ajuda

Se precisar contratar outro desenvolvedor:

1. **Não compartilhe credenciais principais**
   - Crie usuário com permissões limitadas
   - Revogue acesso quando terminar

2. **Use GitHub para compartilhar código**
   ```bash
   # Dar acesso ao repositório
   # Settings → Collaborators → Add person
   ```

3. **Documentação é sua melhor amiga**
   - Mantenha README.md atualizado
   - Documente decisões técnicas
   - Deixe comentários no código

### 7.2 Transferência de Conhecimento

**Crie um documento com:**
- Como rodar o projeto localmente
- Como fazer deploy
- Estrutura de pastas
- Decisões técnicas importantes
- Contatos de suporte

---

## 8. PLANO DE CONTINUIDADE

### 8.1 E Se Algo Acontecer Comigo?

Deixe documentado para seus herdeiros/sucessores:

1. **Acesso ao GitHub**
   - Email com credenciais
   - Instruções de como clonar

2. **Acesso ao Banco de Dados**
   - Credenciais PostgreSQL
   - Como fazer backup

3. **Acesso às Lojas**
   - Apple Developer
   - Google Play

4. **Contatos Importantes**
   - Seu desenvolvedor
   - Seu provedor de hosting
   - Suporte técnico

---

## 9. CHECKLIST DE SEGURANÇA

- [ ] Repositório GitHub criado e privado
- [ ] Backup local do código feito
- [ ] Credenciais guardadas em local seguro
- [ ] 2FA ativado em GitHub, Apple, Google
- [ ] Backup do banco de dados feito
- [ ] Documentação atualizada
- [ ] Plano de continuidade criado
- [ ] Desenvolvedor (se houver) com acesso limitado

---

## 10. SUPORTE E PRÓXIMOS PASSOS

### Você Agora Tem:

✅ **Propriedade Total**
- Código-fonte completo
- Banco de dados sob seu controle
- Painel administrativo
- Direito de publicar nas lojas

✅ **Independência**
- Não depende de ninguém
- Pode customizar quando quiser
- Pode contratar/trocar desenvolvedores
- Pode mudar de plataforma

✅ **Controle Permanente**
- Mesmo que este chat desapareça
- Você tem tudo documentado
- Você tem acesso a tudo
- Você é o dono

### Próximos Passos:

1. **Baixar o projeto completo** do painel "Code"
2. **Fazer backup no seu GitHub** (ou outro serviço)
3. **Guardar credenciais** em local seguro
4. **Testar localmente** para garantir que tudo funciona
5. **Publicar na App Store e Google Play**

---

**Você está 100% protegido. O app é seu. Você tem controle total. Parabéns! 🎉**

---

*Documento criado em: 28 de Janeiro de 2026*  
*Versão do App: 4.2*  
*Próxima revisão: Quando publicar nas lojas*
