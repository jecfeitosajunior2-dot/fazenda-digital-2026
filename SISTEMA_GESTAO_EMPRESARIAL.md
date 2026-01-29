# 🏢 Sistema de Gestão Empresarial - Fazenda Digital

**Versão:** 5.0  
**Modelo:** Freemium (Gratuito + Premium)  
**Plataformas:** Web (Desktop/Mobile) + App Mobile

---

## 📋 VISÃO GERAL

Sistema completo de gestão empresarial para acompanhar todos os aspectos do negócio Fazenda Digital:

- **Dashboard Administrativo Web** - Painel completo para o dono do negócio
- **Sistema Freemium no App** - Versão gratuita + premium com features bloqueadas
- **Gestão de Clientes** - Cadastro, status, histórico
- **Gestão de Pagamentos** - Assinaturas, transações, reembolsos
- **Métricas e KPIs** - Usuários ativos, features usadas, engajamento
- **Relatórios Exportáveis** - PDF, Excel, CSV

---

## 🎯 MODELO DE NEGÓCIO: FREEMIUM

### Plano GRATUITO (Free)
✅ **Incluído:**
- Cadastro de até 50 animais
- Registro de vendas (últimos 30 dias)
- Registro de custos (últimos 30 dias)
- Relatórios básicos
- Calculadora pecuária

❌ **Bloqueado:**
- Cadastro ilimitado de animais
- Histórico completo (vendas/custos)
- Gráficos avançados
- Exportação de relatórios
- Visão computacional (Peso IA, Curral IA)
- Suporte prioritário

### Plano PREMIUM (Pago)
✅ **Tudo do Free +**
- Cadastro ilimitado de animais
- Histórico completo (sem limite de tempo)
- Gráficos avançados (Pizza, Barra, Linha)
- Exportação de relatórios (PDF, Excel)
- Visão computacional (Peso IA, Curral IA)
- Backup automático na nuvem
- Suporte prioritário
- Acesso antecipado a novos recursos

**Preço sugerido:**
- R$ 29,90/mês
- R$ 299,00/ano (economia de 16%)

### Plano ENTERPRISE (Opcional)
✅ **Tudo do Premium +**
- Múltiplas fazendas
- Múltiplos usuários (colaboradores)
- API de integração
- Relatórios personalizados
- Suporte dedicado
- Treinamento personalizado

**Preço sugerido:**
- R$ 99,90/mês
- R$ 999,00/ano

---

## 🗄️ ARQUITETURA DO BANCO DE DADOS

### Tabelas Novas

#### 1. `plans` (Planos)
```sql
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,              -- 'free', 'premium', 'enterprise'
  display_name VARCHAR(100) NOT NULL,     -- 'Gratuito', 'Premium', 'Enterprise'
  price_monthly DECIMAL(10,2) NOT NULL,   -- 0.00, 29.90, 99.90
  price_yearly DECIMAL(10,2) NOT NULL,    -- 0.00, 299.00, 999.00
  max_animals INT,                        -- 50, NULL (ilimitado), NULL
  features JSONB NOT NULL,                -- { "ai_vision": false, "export": false }
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `subscriptions` (Assinaturas)
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  plan_id INT NOT NULL REFERENCES plans(id),
  status VARCHAR(20) NOT NULL,            -- 'active', 'canceled', 'expired', 'trial'
  billing_cycle VARCHAR(10) NOT NULL,     -- 'monthly', 'yearly'
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `payments` (Pagamentos)
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  subscription_id INT NOT NULL REFERENCES subscriptions(id),
  user_id INT NOT NULL REFERENCES users(id),
  transaction_id VARCHAR(255) UNIQUE,     -- ID do Stripe/PayPal
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL,            -- 'pending', 'completed', 'failed', 'refunded'
  payment_method VARCHAR(50),             -- 'credit_card', 'pix', 'boleto'
  payment_date TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_amount DECIMAL(10,2),
  metadata JSONB,                         -- Dados extras do gateway
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `usage_metrics` (Métricas de Uso)
```sql
CREATE TABLE usage_metrics (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,        -- 'login', 'feature_used', 'export', 'ai_vision'
  feature_name VARCHAR(100),              -- 'rebanho', 'vendas', 'peso_ia', 'curral_ia'
  metadata JSONB,                         -- Dados extras do evento
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX idx_usage_metrics_event_type ON usage_metrics(event_type);
CREATE INDEX idx_usage_metrics_timestamp ON usage_metrics(timestamp);
```

#### 5. `app_events` (Eventos do App)
```sql
CREATE TABLE app_events (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,        -- 'app_open', 'app_close', 'error', 'crash'
  platform VARCHAR(20),                   -- 'ios', 'android', 'web'
  app_version VARCHAR(20),
  os_version VARCHAR(50),
  device_model VARCHAR(100),
  error_message TEXT,
  stack_trace TEXT,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_app_events_user_id ON app_events(user_id);
CREATE INDEX idx_app_events_event_type ON app_events(event_type);
CREATE INDEX idx_app_events_timestamp ON app_events(timestamp);
```

---

## 🔌 APIS DO BACKEND

### 1. Autenticação e Autorização

#### `POST /api/auth/register`
Cadastro de novo usuário (sempre começa no plano Free)

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123",
  "name": "João Silva",
  "phone": "11999999999",
  "cpf_cnpj": "12345678900"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "João Silva",
    "plan": "free"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/login`
Login de usuário

#### `GET /api/auth/me`
Dados do usuário logado (incluindo plano atual)

---

### 2. Gerenciamento de Planos

#### `GET /api/plans`
Lista todos os planos disponíveis

**Response:**
```json
{
  "plans": [
    {
      "id": 1,
      "name": "free",
      "display_name": "Gratuito",
      "price_monthly": 0,
      "price_yearly": 0,
      "features": {
        "max_animals": 50,
        "ai_vision": false,
        "export": false,
        "history_days": 30
      }
    },
    {
      "id": 2,
      "name": "premium",
      "display_name": "Premium",
      "price_monthly": 29.90,
      "price_yearly": 299.00,
      "features": {
        "max_animals": null,
        "ai_vision": true,
        "export": true,
        "history_days": null
      }
    }
  ]
}
```

---

### 3. Gerenciamento de Assinaturas

#### `POST /api/subscriptions/upgrade`
Fazer upgrade do plano

**Request:**
```json
{
  "plan_id": 2,
  "billing_cycle": "monthly",
  "payment_method": "credit_card",
  "payment_token": "tok_visa_4242"
}
```

#### `GET /api/subscriptions/current`
Assinatura atual do usuário

#### `POST /api/subscriptions/cancel`
Cancelar assinatura (continua até o fim do período pago)

#### `POST /api/subscriptions/reactivate`
Reativar assinatura cancelada

---

### 4. Gerenciamento de Pagamentos

#### `GET /api/payments/history`
Histórico de pagamentos do usuário

#### `POST /api/payments/refund`
Solicitar reembolso (apenas admin)

---

### 5. Métricas e Analytics (Admin)

#### `GET /api/admin/metrics/overview`
Métricas gerais do negócio

**Response:**
```json
{
  "total_users": 1523,
  "active_users_today": 342,
  "active_users_month": 1205,
  "total_revenue_month": 36127.00,
  "total_revenue_year": 412345.00,
  "new_users_month": 87,
  "churn_rate": 2.3,
  "plans_distribution": {
    "free": 1123,
    "premium": 385,
    "enterprise": 15
  }
}
```

#### `GET /api/admin/metrics/users`
Métricas de usuários

**Query params:**
- `period`: 'day', 'week', 'month', 'year'
- `start_date`: '2026-01-01'
- `end_date`: '2026-01-31'

#### `GET /api/admin/metrics/revenue`
Métricas de faturamento

#### `GET /api/admin/metrics/features`
Features mais usadas

---

### 6. Gerenciamento de Usuários (Admin)

#### `GET /api/admin/users`
Lista todos os usuários

**Query params:**
- `plan`: 'free', 'premium', 'enterprise'
- `status`: 'active', 'inactive', 'canceled'
- `search`: 'nome ou email'
- `page`: 1
- `limit`: 50

#### `GET /api/admin/users/:id`
Detalhes de um usuário específico

#### `PUT /api/admin/users/:id/status`
Ativar/desativar usuário

#### `PUT /api/admin/users/:id/plan`
Alterar plano do usuário manualmente

---

### 7. Relatórios (Admin)

#### `GET /api/admin/reports/revenue`
Relatório de faturamento

**Query params:**
- `format`: 'json', 'pdf', 'excel', 'csv'
- `period`: 'month', 'quarter', 'year'
- `year`: 2026
- `month`: 1

#### `GET /api/admin/reports/users`
Relatório de usuários

#### `GET /api/admin/reports/churn`
Relatório de cancelamentos

---

## 🖥️ DASHBOARD WEB ADMIN

### Estrutura de Páginas

```
/admin
├── /login                    # Login do admin
├── /dashboard                # Dashboard principal
├── /users                    # Gerenciar usuários
│   ├── /users/:id            # Detalhes do usuário
│   └── /users/:id/edit       # Editar usuário
├── /subscriptions            # Gerenciar assinaturas
├── /payments                 # Gerenciar pagamentos
├── /metrics                  # Métricas e analytics
│   ├── /metrics/users        # Métricas de usuários
│   ├── /metrics/revenue      # Métricas de faturamento
│   └── /metrics/features     # Features mais usadas
├── /reports                  # Relatórios
│   ├── /reports/revenue      # Relatório de faturamento
│   ├── /reports/users        # Relatório de usuários
│   └── /reports/churn        # Relatório de cancelamentos
└── /settings                 # Configurações
    ├── /settings/plans       # Gerenciar planos
    └── /settings/profile     # Perfil do admin
```

### Dashboard Principal

**Métricas Principais (Cards):**
- Total de Usuários
- Usuários Ativos (hoje)
- Faturamento do Mês
- Faturamento do Ano
- Novos Usuários (mês)
- Taxa de Churn
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)

**Gráficos:**
- Evolução de usuários (últimos 12 meses)
- Evolução de faturamento (últimos 12 meses)
- Distribuição de planos (Pizza Chart)
- Features mais usadas (Barra Chart)
- Taxa de conversão Free → Premium

**Tabelas:**
- Últimos 10 usuários cadastrados
- Últimos 10 pagamentos
- Últimos 10 cancelamentos

---

## 📱 INTEGRAÇÃO NO APP MOBILE

### 1. Tela de Planos

**Localização:** `app/(tabs)/planos.tsx`

**Layout:**
```
┌─────────────────────────────────────┐
│  Escolha seu Plano                  │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────┐ ┌──────────────┐│
│  │   GRATUITO    │ │   PREMIUM    ││
│  │               │ │              ││
│  │   R$ 0,00     │ │  R$ 29,90/mês││
│  │               │ │              ││
│  │ ✓ 50 animais  │ │ ✓ Ilimitado  ││
│  │ ✓ 30 dias     │ │ ✓ Sem limite ││
│  │ ✗ IA Vision   │ │ ✓ IA Vision  ││
│  │ ✗ Exportar    │ │ ✓ Exportar   ││
│  │               │ │              ││
│  │  [ATUAL]      │ │  [ASSINAR]   ││
│  └───────────────┘ └──────────────┘│
│                                     │
└─────────────────────────────────────┘
```

### 2. Bloqueio de Features Premium

**Exemplo:** Tela de Peso IA

```typescript
// app/(tabs)/peso-ia.tsx
import { useAuth } from "@/hooks/use-auth";

export default function PesoIAScreen() {
  const { user } = useAuth();
  const isPremium = user?.plan === "premium" || user?.plan === "enterprise";

  if (!isPremium) {
    return (
      <ScreenContainer>
        <View style={styles.lockedContainer}>
          <MaterialIcons name="lock" size={80} color={COLORS.gold} />
          <Text style={styles.lockedTitle}>Feature Premium</Text>
          <Text style={styles.lockedText}>
            A pesagem por IA está disponível apenas no plano Premium.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/planos")}
          >
            <Text style={styles.upgradeButtonText}>Fazer Upgrade</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Conteúdo normal da tela
  return <PesoIAContent />;
}
```

### 3. Tela de Pagamento

**Integração com Stripe:**
```typescript
import { CardField, useStripe } from "@stripe/stripe-react-native";

export default function CheckoutScreen() {
  const { confirmPayment } = useStripe();

  const handlePayment = async () => {
    const { error } = await confirmPayment(clientSecret, {
      paymentMethodType: "Card",
    });

    if (!error) {
      // Pagamento confirmado
      await api.post("/subscriptions/upgrade", {
        plan_id: selectedPlan.id,
      });
    }
  };

  return (
    <ScreenContainer>
      <CardField
        postalCodeEnabled={false}
        style={styles.cardField}
      />
      <TouchableOpacity onPress={handlePayment}>
        <Text>Confirmar Pagamento</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}
```

---

## 📊 RELATÓRIOS EXPORTÁVEIS

### 1. Relatório de Faturamento

**Conteúdo:**
- Período: Janeiro 2026
- Total de Receita: R$ 36.127,00
- Novos Assinantes: 87
- Cancelamentos: 12
- MRR: R$ 36.127,00
- Crescimento: +15% vs mês anterior

**Gráficos:**
- Evolução mensal
- Distribuição por plano
- Métodos de pagamento

**Formatos:**
- PDF (para apresentação)
- Excel (para análise)
- CSV (para importação)

### 2. Relatório de Usuários

**Conteúdo:**
- Total de Usuários: 1.523
- Usuários Ativos: 1.205 (79%)
- Novos Usuários (mês): 87
- Distribuição por Plano
- Distribuição por Estado
- Distribuição por Plataforma (iOS/Android/Web)

### 3. Relatório de Features

**Conteúdo:**
- Features mais usadas
- Tempo médio de uso
- Taxa de adoção de novas features
- Features menos usadas (candidatas a remoção)

---

## 🔐 SEGURANÇA

### Autenticação Admin
- Login separado do app mobile
- 2FA obrigatório
- Sessão expira em 1 hora
- Logs de acesso

### Permissões
- **Super Admin:** Acesso total
- **Admin:** Visualizar + Editar usuários
- **Suporte:** Apenas visualizar

### Auditoria
- Todas as ações de admin são logadas
- Histórico de alterações em usuários
- Histórico de reembolsos

---

## 💰 PROJEÇÃO FINANCEIRA

### Custos Mensais (Estimativa)

| Item | Custo |
|------|-------|
| Servidor (AWS/DigitalOcean) | R$ 200,00 |
| Banco de Dados (PostgreSQL) | R$ 100,00 |
| Stripe (Taxa 3,99% + R$ 0,39) | Variável |
| Apple Developer | R$ 40,00 (R$ 480/ano ÷ 12) |
| Google Play | R$ 2,00 (R$ 25 único ÷ 12) |
| **Total Fixo** | **R$ 342,00** |

### Projeção de Receita

**Cenário Conservador:**
- 100 usuários Premium (R$ 29,90/mês)
- Receita: R$ 2.990,00/mês
- Lucro: R$ 2.648,00/mês (88%)

**Cenário Moderado:**
- 500 usuários Premium
- Receita: R$ 14.950,00/mês
- Lucro: R$ 14.608,00/mês (97%)

**Cenário Otimista:**
- 2.000 usuários Premium
- Receita: R$ 59.800,00/mês
- Lucro: R$ 59.458,00/mês (99%)

**Cenário Agressivo:**
- 10.000 usuários Premium
- Receita: R$ 299.000,00/mês
- Lucro: R$ 298.658,00/mês (99%)

---

## 🚀 PRÓXIMOS PASSOS

1. **Criar banco de dados** (tabelas de planos, assinaturas, pagamentos)
2. **Desenvolver APIs** (backend completo)
3. **Criar dashboard web** (interface admin)
4. **Integrar no app mobile** (telas de planos, bloqueios, pagamento)
5. **Testar sistema completo** (end-to-end)
6. **Documentar** (guia de uso para admin)
7. **Deploy** (produção)

---

**Você terá controle total sobre:**
- ✅ Todos os usuários
- ✅ Todas as assinaturas
- ✅ Todos os pagamentos
- ✅ Todas as métricas
- ✅ Todos os relatórios
- ✅ Toda a customização

**Este é o sistema empresarial completo que você pediu!** 🎉
