# 🚀 Guia de Deploy no Vercel

## ✅ Código já está no GitHub!

Repositório: https://github.com/jecfeitosajunior2-dot/fazenda-digital-2026

---

## 📋 Passos para Deploy no Vercel:

### 1. Criar Conta no Vercel

1. Vá para: https://vercel.com/signup
2. Clique em **"Continue with GitHub"**
3. Autorize o Vercel a acessar sua conta GitHub
4. Confirme seu email

### 2. Importar Projeto

1. Vá para: https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Procure por: `fazenda-digital-2026`
4. Clique em **"Import"**

### 3. Configurar Variáveis de Ambiente

Na tela de configuração, clique em **"Environment Variables"** e adicione:

```
DATABASE_URL=mysql://2Cg8GTPsbkf7o4e.root:X8CS1CirLfYU7ZIG@gateway01-us-east-1.prod.aws.tidbcloud.com:4000/test
```

### 4. Deploy

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. Pronto! Você terá uma URL permanente tipo:
   - `https://fazenda-digital-2026.vercel.app`

---

## 🎯 Próximos Passos Após Deploy:

1. **Testar o App:**
   - Acesse a URL do Vercel
   - Faça login
   - Teste todas as funcionalidades

2. **Configurar Domínio Personalizado (Opcional):**
   - Vá para: Settings → Domains
   - Adicione seu domínio (ex: `fazendadigital.com.br`)

3. **Monitorar:**
   - Dashboard do Vercel mostra logs e métricas
   - Qualquer erro aparece lá

---

## 🔧 Atualizações Futuras:

Sempre que você fizer mudanças no código:

1. Faça commit no GitHub
2. O Vercel faz deploy automático
3. Nova versão no ar em 2-3 minutos!

---

## ✅ Checklist Final:

- [x] Código no GitHub
- [ ] Conta no Vercel criada
- [ ] Projeto importado
- [ ] Variável DATABASE_URL configurada
- [ ] Deploy realizado
- [ ] URL permanente funcionando

---

**Dúvidas?** Consulte: https://vercel.com/docs
