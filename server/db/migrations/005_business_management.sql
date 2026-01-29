-- Migration 005: Business Management System
-- Sistema de Gestão Empresarial Completo
-- Criado em: 2026-01-29

-- ============================================
-- 1. TABELA DE PLANOS
-- ============================================

CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,              -- 'free', 'premium', 'enterprise'
  display_name VARCHAR(100) NOT NULL,            -- 'Gratuito', 'Premium', 'Enterprise'
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',          -- { "max_animals": 50, "ai_vision": false }
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir planos padrão
INSERT INTO plans (name, display_name, description, price_monthly, price_yearly, features) VALUES
('free', 'Gratuito', 'Plano básico para começar', 0.00, 0.00, '{
  "max_animals": 50,
  "ai_vision": false,
  "export": false,
  "history_days": 30,
  "cloud_backup": false,
  "priority_support": false
}'),
('premium', 'Premium', 'Plano completo para produtores profissionais', 29.90, 299.00, '{
  "max_animals": null,
  "ai_vision": true,
  "export": true,
  "history_days": null,
  "cloud_backup": true,
  "priority_support": true
}'),
('enterprise', 'Enterprise', 'Plano para grandes fazendas e cooperativas', 99.90, 999.00, '{
  "max_animals": null,
  "ai_vision": true,
  "export": true,
  "history_days": null,
  "cloud_backup": true,
  "priority_support": true,
  "multiple_farms": true,
  "multiple_users": true,
  "api_access": true,
  "custom_reports": true
}');

-- ============================================
-- 2. TABELA DE ASSINATURAS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INT NOT NULL REFERENCES plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active', 'canceled', 'expired', 'trial', 'suspended'
  billing_cycle VARCHAR(10) NOT NULL,            -- 'monthly', 'yearly'
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP,
  trial_end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  canceled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);

-- ============================================
-- 3. TABELA DE PAGAMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  subscription_id INT REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) UNIQUE,            -- ID do Stripe/PayPal/Mercado Pago
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded', 'disputed'
  payment_method VARCHAR(50),                    -- 'credit_card', 'pix', 'boleto', 'paypal'
  payment_gateway VARCHAR(50),                   -- 'stripe', 'paypal', 'mercadopago'
  payment_date TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  metadata JSONB,                                -- Dados extras do gateway
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- ============================================
-- 4. TABELA DE MÉTRICAS DE USO
-- ============================================

CREATE TABLE IF NOT EXISTS usage_metrics (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,               -- 'login', 'feature_used', 'export', 'ai_vision'
  feature_name VARCHAR(100),                     -- 'rebanho', 'vendas', 'peso_ia', 'curral_ia'
  screen_name VARCHAR(100),                      -- Nome da tela acessada
  action VARCHAR(100),                           -- 'create', 'read', 'update', 'delete', 'export'
  duration_seconds INT,                          -- Tempo na tela/feature
  metadata JSONB,                                -- Dados extras do evento
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX idx_usage_metrics_event_type ON usage_metrics(event_type);
CREATE INDEX idx_usage_metrics_feature_name ON usage_metrics(feature_name);
CREATE INDEX idx_usage_metrics_timestamp ON usage_metrics(timestamp);

-- ============================================
-- 5. TABELA DE EVENTOS DO APP
-- ============================================

CREATE TABLE IF NOT EXISTS app_events (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,               -- 'app_open', 'app_close', 'error', 'crash', 'upgrade_prompt'
  platform VARCHAR(20),                          -- 'ios', 'android', 'web'
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
CREATE INDEX idx_app_events_platform ON app_events(platform);
CREATE INDEX idx_app_events_timestamp ON app_events(timestamp);

-- ============================================
-- 6. TABELA DE ADMIN LOGS (Auditoria)
-- ============================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,                  -- 'user_updated', 'plan_changed', 'refund_issued'
  target_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  target_type VARCHAR(50),                       -- 'user', 'subscription', 'payment', 'plan'
  target_id INT,
  changes JSONB,                                 -- { "before": {...}, "after": {...} }
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX idx_admin_logs_target_user_id ON admin_logs(target_user_id);
CREATE INDEX idx_admin_logs_timestamp ON admin_logs(timestamp);

-- ============================================
-- 7. ATUALIZAR TABELA DE USUÁRIOS
-- ============================================

-- Adicionar campo de role para distinguir admin de usuário comum
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
-- Valores possíveis: 'user', 'admin', 'super_admin', 'support'

-- Adicionar campo de status
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
-- Valores possíveis: 'active', 'inactive', 'suspended', 'deleted'

-- Adicionar campo de última atividade
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_activity_at ON users(last_activity_at);

-- ============================================
-- 8. VIEWS PARA RELATÓRIOS
-- ============================================

-- View: Usuários com plano atual
CREATE OR REPLACE VIEW users_with_plan AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.status,
  u.created_at,
  u.last_activity_at,
  p.name as plan_name,
  p.display_name as plan_display_name,
  s.status as subscription_status,
  s.end_date as subscription_end_date,
  s.auto_renew
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN plans p ON s.plan_id = p.id;

-- View: Métricas de faturamento mensal
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
  DATE_TRUNC('month', payment_date) as month,
  COUNT(*) as total_payments,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_payment,
  COUNT(DISTINCT user_id) as unique_users
FROM payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month DESC;

-- View: Usuários ativos por dia
CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as active_users
FROM usage_metrics
WHERE event_type = 'login'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- View: Features mais usadas
CREATE OR REPLACE VIEW feature_usage AS
SELECT 
  feature_name,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(duration_seconds) as avg_duration_seconds
FROM usage_metrics
WHERE feature_name IS NOT NULL
GROUP BY feature_name
ORDER BY usage_count DESC;

-- ============================================
-- 9. FUNÇÕES ÚTEIS
-- ============================================

-- Função: Verificar se usuário tem acesso a feature
CREATE OR REPLACE FUNCTION user_has_feature(p_user_id INT, p_feature_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_features JSONB;
  v_feature_value TEXT;
BEGIN
  -- Buscar features do plano atual do usuário
  SELECT p.features INTO v_features
  FROM users u
  JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
  JOIN plans p ON s.plan_id = p.id
  WHERE u.id = p_user_id;
  
  -- Se não tem assinatura ativa, retorna false
  IF v_features IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se a feature existe e está habilitada
  v_feature_value := v_features->>p_feature_name;
  
  IF v_feature_value IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Se for booleano, retornar o valor
  IF v_feature_value = 'true' THEN
    RETURN TRUE;
  ELSIF v_feature_value = 'false' THEN
    RETURN FALSE;
  ELSE
    -- Se for número ou null (ilimitado), retornar true
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função: Registrar métrica de uso
CREATE OR REPLACE FUNCTION log_usage_metric(
  p_user_id INT,
  p_event_type VARCHAR,
  p_feature_name VARCHAR DEFAULT NULL,
  p_screen_name VARCHAR DEFAULT NULL,
  p_action VARCHAR DEFAULT NULL,
  p_duration_seconds INT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_metrics (
    user_id,
    event_type,
    feature_name,
    screen_name,
    action,
    duration_seconds,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_feature_name,
    p_screen_name,
    p_action,
    p_duration_seconds,
    p_metadata
  );
  
  -- Atualizar última atividade do usuário
  UPDATE users SET last_activity_at = NOW() WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. TRIGGERS
-- ============================================

-- Trigger: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIM DA MIGRATION
-- ============================================

-- Comentários finais
COMMENT ON TABLE plans IS 'Planos de assinatura disponíveis (free, premium, enterprise)';
COMMENT ON TABLE subscriptions IS 'Assinaturas dos usuários';
COMMENT ON TABLE payments IS 'Histórico de pagamentos e transações';
COMMENT ON TABLE usage_metrics IS 'Métricas de uso do app por usuário';
COMMENT ON TABLE app_events IS 'Eventos do app (aberturas, erros, crashes)';
COMMENT ON TABLE admin_logs IS 'Log de ações administrativas para auditoria';
