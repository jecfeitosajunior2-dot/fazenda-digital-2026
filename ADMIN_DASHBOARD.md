# Dashboard Administrativo - Fazenda Digital

## Visão Geral

O **Dashboard Administrativo** é um painel web separado do aplicativo móvel, destinado ao proprietário/empresa que comercializa o Fazenda Digital. Ele permite gerenciar todos os clientes, assinaturas, pagamentos e métricas de uso do aplicativo.

---

## Arquitetura Recomendada

### Opção 1: Firebase Console + Extensões (Mais Simples)

Como você já tem a estrutura no Firebase, pode usar:

1. **Firebase Authentication** - Gerencia todos os usuários cadastrados
2. **Cloud Firestore** - Armazena dados dos clientes e fazendas
3. **Firebase Extensions** - Integração com Stripe para pagamentos
4. **Firebase Analytics** - Métricas de uso do app

**Vantagens:** Menor custo inicial, integração nativa com o app.

### Opção 2: Painel Web Customizado (Mais Controle)

Criar um painel web separado usando:

- **Frontend:** Next.js ou React Admin
- **Backend:** Firebase Functions ou Node.js
- **Database:** Firestore ou PostgreSQL
- **Pagamentos:** Stripe ou PagSeguro

---

## Estrutura de Dados no Firebase

### Coleção: `usuarios`
```javascript
{
  id: "user_123",
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "(11) 99999-9999",
  documento: "123.456.789-00",
  tipoDocumento: "CPF",
  dataCadastro: "2026-01-22T10:00:00Z",
  status: "ativo", // ativo, inativo, trial, suspenso
  plano: "premium", // free, basic, premium
  dataVencimento: "2026-02-22T00:00:00Z",
  ultimoAcesso: "2026-01-22T15:30:00Z",
  dispositivos: ["iPhone 14", "iPad Pro"],
  biometriaAtivada: true
}
```

### Coleção: `fazendas`
```javascript
{
  id: "fazenda_456",
  usuarioId: "user_123",
  nome: "Fazenda Boa Vista",
  cidade: "Ribeirão Preto",
  estado: "SP",
  tamanhoHectares: 500,
  tipoProducao: "Corte",
  totalAnimais: 150,
  totalArrobas: 2500,
  ultimaAtualizacao: "2026-01-22T15:30:00Z"
}
```

### Coleção: `assinaturas`
```javascript
{
  id: "sub_789",
  usuarioId: "user_123",
  plano: "premium",
  valor: 49.90,
  periodicidade: "mensal",
  dataInicio: "2026-01-01T00:00:00Z",
  dataVencimento: "2026-02-01T00:00:00Z",
  status: "ativa", // ativa, cancelada, vencida, trial
  metodoPagamento: "cartao",
  ultimoPagamento: "2026-01-01T00:00:00Z"
}
```

### Coleção: `pagamentos`
```javascript
{
  id: "pay_001",
  usuarioId: "user_123",
  assinaturaId: "sub_789",
  valor: 49.90,
  data: "2026-01-01T00:00:00Z",
  status: "aprovado", // aprovado, pendente, recusado
  metodoPagamento: "cartao",
  transacaoId: "stripe_ch_xxx"
}
```

---

## Funcionalidades do Dashboard Admin

### 1. Visão Geral (Home)
- Total de usuários cadastrados
- Usuários ativos vs inativos
- Receita mensal recorrente (MRR)
- Novos cadastros (últimos 7/30 dias)
- Taxa de churn (cancelamentos)
- Gráfico de crescimento

### 2. Gestão de Clientes
- Lista de todos os clientes com filtros
- Busca por nome, email, cidade, estado
- Visualizar detalhes do cliente
- Editar dados do cliente
- Ativar/Desativar conta
- Histórico de pagamentos
- Histórico de uso do app

### 3. Assinaturas e Planos
- Configurar planos (Free, Basic, Premium)
- Definir preços e funcionalidades
- Ver assinaturas ativas/canceladas
- Renovar assinatura manualmente
- Aplicar descontos/cupons

### 4. Financeiro
- Relatório de receitas
- Pagamentos pendentes
- Pagamentos recusados
- Integração com gateway (Stripe/PagSeguro)
- Exportar relatórios para Excel

### 5. Métricas e Analytics
- Usuários ativos diários (DAU)
- Usuários ativos mensais (MAU)
- Tempo médio de uso
- Funcionalidades mais usadas
- Regiões com mais usuários
- Dispositivos mais comuns

### 6. Suporte
- Tickets de suporte
- Chat com clientes
- FAQ editável
- Notificações push para todos

### 7. Configurações
- Personalizar app (cores, logo)
- Configurar notificações
- Termos de uso e privacidade
- Configurar integrações

---

## Implementação com Firebase

### 1. Configurar Firebase Admin SDK

```javascript
// admin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://seu-projeto.firebaseio.com'
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
```

### 2. API para Dashboard

```javascript
// api/usuarios.js
const { db } = require('../admin');

// Listar todos os usuários
async function listarUsuarios(filtros) {
  let query = db.collection('usuarios');
  
  if (filtros.status) {
    query = query.where('status', '==', filtros.status);
  }
  if (filtros.plano) {
    query = query.where('plano', '==', filtros.plano);
  }
  
  const snapshot = await query.orderBy('dataCadastro', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Obter métricas
async function obterMetricas() {
  const usuarios = await db.collection('usuarios').get();
  const assinaturas = await db.collection('assinaturas')
    .where('status', '==', 'ativa').get();
  
  const totalUsuarios = usuarios.size;
  const usuariosAtivos = usuarios.docs.filter(d => d.data().status === 'ativo').length;
  const mrr = assinaturas.docs.reduce((acc, d) => acc + d.data().valor, 0);
  
  return {
    totalUsuarios,
    usuariosAtivos,
    usuariosInativos: totalUsuarios - usuariosAtivos,
    mrr,
    taxaAtivacao: ((usuariosAtivos / totalUsuarios) * 100).toFixed(1)
  };
}

module.exports = { listarUsuarios, obterMetricas };
```

### 3. Sincronização App → Firebase

No app móvel, adicione sincronização quando o usuário fizer login:

```typescript
// No auth-context.tsx, após cadastro bem-sucedido:
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const sincronizarComFirebase = async (usuario, fazenda) => {
  const db = getFirestore();
  
  // Salvar usuário
  await setDoc(doc(db, 'usuarios', usuario.id), {
    ...usuario,
    ultimoAcesso: new Date().toISOString(),
    status: 'ativo',
    plano: 'trial', // Começa em trial
  });
  
  // Salvar fazenda
  await setDoc(doc(db, 'fazendas', fazenda.id), {
    ...fazenda,
    ultimaAtualizacao: new Date().toISOString(),
  });
};
```

---

## Integração com Pagamentos

### Stripe (Recomendado para Internacional)

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Criar assinatura
async function criarAssinatura(usuarioId, planoId) {
  const usuario = await db.collection('usuarios').doc(usuarioId).get();
  
  // Criar customer no Stripe
  const customer = await stripe.customers.create({
    email: usuario.data().email,
    name: usuario.data().nome,
  });
  
  // Criar assinatura
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: planoId }],
  });
  
  // Salvar no Firestore
  await db.collection('assinaturas').add({
    usuarioId,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    status: 'ativa',
    // ...
  });
}
```

### PagSeguro (Brasil)

```javascript
const PagSeguro = require('pagseguro-nodejs');

const pagseguro = new PagSeguro({
  email: process.env.PAGSEGURO_EMAIL,
  token: process.env.PAGSEGURO_TOKEN,
});

async function criarCobranca(usuario, plano) {
  const checkout = await pagseguro.checkout({
    reference: `assinatura_${usuario.id}`,
    items: [{
      id: plano.id,
      description: `Fazenda Digital - Plano ${plano.nome}`,
      amount: plano.valor,
      quantity: 1,
    }],
    sender: {
      name: usuario.nome,
      email: usuario.email,
      phone: usuario.telefone,
    },
  });
  
  return checkout.url;
}
```

---

## Planos Sugeridos

| Plano | Preço/mês | Funcionalidades |
|-------|-----------|-----------------|
| **Free** | R$ 0 | Até 50 animais, relatórios básicos |
| **Basic** | R$ 29,90 | Até 200 animais, todos os relatórios |
| **Premium** | R$ 49,90 | Ilimitado, suporte prioritário, backup na nuvem |
| **Enterprise** | Sob consulta | Multi-fazendas, API, integrações |

---

## Próximos Passos

1. **Configurar Firebase Project** (se ainda não tiver)
2. **Implementar sincronização** no app móvel
3. **Criar painel web** com React Admin ou Next.js
4. **Integrar gateway de pagamento** (Stripe ou PagSeguro)
5. **Configurar webhooks** para atualizar status de pagamentos
6. **Implementar notificações** de vencimento
7. **Criar relatórios** de métricas

---

## Ferramentas Recomendadas para o Dashboard

- **React Admin** - Framework pronto para painéis admin
- **Retool** - Low-code para criar dashboards rápido
- **Metabase** - Analytics e relatórios
- **Stripe Dashboard** - Gerenciar pagamentos
- **Firebase Console** - Gerenciar usuários e dados

---

## Contato e Suporte

Para implementar o Dashboard Administrativo completo, você precisará:

1. Definir quais funcionalidades são prioritárias
2. Escolher a stack de desenvolvimento (React, Next.js, etc.)
3. Configurar o gateway de pagamento
4. Desenvolver ou contratar o desenvolvimento do painel

O código do app móvel já está preparado para sincronizar com Firebase quando você implementar essa integração.
