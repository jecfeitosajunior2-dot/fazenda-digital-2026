# 🚀 Guia Completo: Publicar Fazenda Digital no Vercel

## Pré-requisitos

- ✅ Conta GitHub (grátis em https://github.com)
- ✅ Conta Vercel (grátis em https://vercel.com)
- ✅ Seu código do projeto

---

## Passo 1: Criar Repositório GitHub

### 1.1 Acesse GitHub
1. Vá para https://github.com/new
2. Faça login com sua conta

### 1.2 Criar Novo Repositório
1. **Repository name:** `fazenda-digital-app`
2. **Description:** `Gestão Pecuária Inteligente - App Mobile e Web`
3. **Visibility:** Selecione **Private** (privado)
4. Clique em **Create repository**

### 1.3 Fazer Push do Código

Abra o terminal no seu PC e execute:

```bash
# Navegue até a pasta do projeto
cd /caminho/para/fazenda-digital-app

# Inicialize git (se ainda não estiver)
git init

# Adicione o repositório remoto
git remote add origin https://github.com/SEU_USUARIO/fazenda-digital-app.git

# Adicione todos os arquivos
git add .

# Faça o commit
git commit -m "Initial commit: Sistema de produção com backend PostgreSQL"

# Faça o push
git branch -M main
git push -u origin main
```

**Importante:** Quando pedir autenticação, use seu GitHub token (não a senha).

---

## Passo 2: Conectar Vercel ao GitHub

### 2.1 Acesse Vercel
1. Vá para https://vercel.com
2. Clique em **Sign Up** (ou **Log In** se já tiver conta)
3. Selecione **Continue with GitHub**
4. Autorize o Vercel a acessar sua conta GitHub

### 2.2 Criar Novo Projeto
1. Clique em **Add New...** → **Project**
2. Selecione **Import Git Repository**
3. Procure por `fazenda-digital-app`
4. Clique em **Import**

---

## Passo 3: Configurar Variáveis de Ambiente

### 3.1 Variáveis Necessárias

Na tela de configuração do Vercel, adicione estas variáveis:

```
DATABASE_URL=sua_url_do_banco_de_dados
NODE_ENV=production
```

**Como obter DATABASE_URL:**
1. Acesse seu painel do TiDB Cloud (ou seu banco PostgreSQL)
2. Copie a string de conexão
3. Cole em `DATABASE_URL`

### 3.2 Salvar Variáveis
Clique em **Deploy** para salvar as variáveis e iniciar o deploy.

---

## Passo 4: Aguardar Deploy

O Vercel vai:
1. ✅ Clonar seu repositório
2. ✅ Instalar dependências (`pnpm install`)
3. ✅ Fazer build (`pnpm build`)
4. ✅ Publicar online

**Tempo estimado:** 5-10 minutos

Você receberá um e-mail quando estiver pronto.

---

## Passo 5: Acessar Seu App

Após o deploy, você terá uma URL como:

```
https://fazenda-digital-app-seu-usuario.vercel.app
```

**Pronto! Seu app está online!** 🎉

---

## Troubleshooting

### Erro: "Build failed"

**Solução:**
1. Verifique se `DATABASE_URL` está correto
2. Verifique se o banco de dados está acessível
3. Clique em **Redeploy** para tentar novamente

### Erro: "Cannot find module"

**Solução:**
1. Certifique-se de que `pnpm-lock.yaml` foi feito push
2. Verifique se todos os arquivos foram commitados

### App carrega mas mostra erro branco

**Solução:**
1. Abra o console do navegador (F12)
2. Procure por mensagens de erro
3. Verifique se as variáveis de ambiente estão corretas

---

## Próximas Etapas

### Adicionar Domínio Personalizado (Opcional)

1. Acesse seu projeto no Vercel
2. Vá para **Settings** → **Domains**
3. Adicione seu domínio (ex: `fazendadigital.com.br`)
4. Siga as instruções para configurar DNS

**Custo:** ~R$ 40/ano para domínio

### Ativar HTTPS (Automático)

O Vercel ativa HTTPS automaticamente. Seu app será seguro por padrão.

### Monitorar Performance

No painel do Vercel, você pode:
- ✅ Ver logs de deployment
- ✅ Monitorar performance
- ✅ Gerenciar variáveis de ambiente
- ✅ Configurar webhooks

---

## Dúvidas?

Se tiver problemas durante o deploy, verifique:

1. **GitHub Token:** Certifique-se de que tem permissão para fazer push
2. **Variáveis de Ambiente:** Todas as variáveis foram adicionadas?
3. **Banco de Dados:** O banco está online e acessível?
4. **Build:** Rode `pnpm build` localmente para testar

---

**Você está pronto para publicar! 🚀**
