-- =====================================================
-- FAZENDA DIGITAL - MIGRAÇÃO DO MÓDULO DE VISÃO
-- Versão: 4.0.0
-- Data: Janeiro 2026
-- =====================================================

-- Criar tipos ENUM
DO $$ BEGIN
    CREATE TYPE camera_type AS ENUM ('rtsp', 'onvif', 'rgb', 'depth');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE camera_status AS ENUM ('online', 'offline', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE aggregation_rule AS ENUM ('median', 'max', 'principal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE model_type AS ENUM ('linear', 'polynomial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABELA: cameras
-- =====================================================
CREATE TABLE IF NOT EXISTS cameras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rtsp_url TEXT NOT NULL,
    type camera_type NOT NULL DEFAULT 'rtsp',
    position VARCHAR(10),
    pen_id INTEGER,
    weigh_station_id INTEGER,
    roi_config JSONB DEFAULT '{}',
    status camera_status NOT NULL DEFAULT 'offline',
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cameras_pen_id ON cameras(pen_id);
CREATE INDEX IF NOT EXISTS idx_cameras_weigh_station_id ON cameras(weigh_station_id);
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);

-- =====================================================
-- TABELA: pens (Currais)
-- =====================================================
CREATE TABLE IF NOT EXISTS pens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    aggregation_rule aggregation_rule NOT NULL DEFAULT 'median',
    primary_camera_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Foreign key para câmera principal
ALTER TABLE pens 
    DROP CONSTRAINT IF EXISTS fk_pens_primary_camera;
ALTER TABLE pens 
    ADD CONSTRAINT fk_pens_primary_camera 
    FOREIGN KEY (primary_camera_id) REFERENCES cameras(id) ON DELETE SET NULL;

-- Foreign key de cameras para pens
ALTER TABLE cameras 
    DROP CONSTRAINT IF EXISTS fk_cameras_pen;
ALTER TABLE cameras 
    ADD CONSTRAINT fk_cameras_pen 
    FOREIGN KEY (pen_id) REFERENCES pens(id) ON DELETE SET NULL;

-- =====================================================
-- TABELA: pen_counts (Contagens)
-- =====================================================
CREATE TABLE IF NOT EXISTS pen_counts (
    id SERIAL PRIMARY KEY,
    pen_id INTEGER NOT NULL,
    count INTEGER NOT NULL,
    confidence DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    meta JSONB DEFAULT '{}',
    CONSTRAINT fk_pen_counts_pen FOREIGN KEY (pen_id) REFERENCES pens(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pen_counts_pen_id ON pen_counts(pen_id);
CREATE INDEX IF NOT EXISTS idx_pen_counts_captured_at ON pen_counts(captured_at DESC);

-- =====================================================
-- TABELA: pen_camera_counts (Contagens por Câmera)
-- =====================================================
CREATE TABLE IF NOT EXISTS pen_camera_counts (
    id SERIAL PRIMARY KEY,
    pen_count_id INTEGER NOT NULL,
    camera_id INTEGER NOT NULL,
    count INTEGER NOT NULL,
    confidence DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    CONSTRAINT fk_pen_camera_counts_pen_count FOREIGN KEY (pen_count_id) REFERENCES pen_counts(id) ON DELETE CASCADE,
    CONSTRAINT fk_pen_camera_counts_camera FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pen_camera_counts_pen_count_id ON pen_camera_counts(pen_count_id);
CREATE INDEX IF NOT EXISTS idx_pen_camera_counts_camera_id ON pen_camera_counts(camera_id);

-- =====================================================
-- TABELA: weigh_stations (Estações de Pesagem)
-- =====================================================
CREATE TABLE IF NOT EXISTS weigh_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    camera_id INTEGER,
    camera_type camera_type NOT NULL DEFAULT 'rgb',
    calibration_version INTEGER NOT NULL DEFAULT 0,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_weigh_stations_camera FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE SET NULL
);

-- Foreign key de cameras para weigh_stations
ALTER TABLE cameras 
    DROP CONSTRAINT IF EXISTS fk_cameras_weigh_station;
ALTER TABLE cameras 
    ADD CONSTRAINT fk_cameras_weigh_station 
    FOREIGN KEY (weigh_station_id) REFERENCES weigh_stations(id) ON DELETE SET NULL;

-- =====================================================
-- TABELA: weight_estimates (Estimativas de Peso)
-- =====================================================
CREATE TABLE IF NOT EXISTS weight_estimates (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL,
    estimated_kg DECIMAL(10,2) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    calibration_version INTEGER NOT NULL DEFAULT 0,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    animal_id INTEGER,
    confirmed_kg DECIMAL(10,2),
    meta JSONB DEFAULT '{}',
    CONSTRAINT fk_weight_estimates_station FOREIGN KEY (station_id) REFERENCES weigh_stations(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_weight_estimates_station_id ON weight_estimates(station_id);
CREATE INDEX IF NOT EXISTS idx_weight_estimates_captured_at ON weight_estimates(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_weight_estimates_animal_id ON weight_estimates(animal_id);

-- =====================================================
-- TABELA: calibrations (Calibrações)
-- =====================================================
CREATE TABLE IF NOT EXISTS calibrations (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    model_type model_type NOT NULL DEFAULT 'linear',
    coefficients JSONB NOT NULL DEFAULT '{}',
    rmse DECIMAL(10,2),
    samples_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_calibrations_station FOREIGN KEY (station_id) REFERENCES weigh_stations(id) ON DELETE CASCADE,
    CONSTRAINT uq_calibrations_station_version UNIQUE (station_id, version)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_calibrations_station_id ON calibrations(station_id);

-- =====================================================
-- DADOS INICIAIS (Demonstração)
-- =====================================================

-- Inserir curral de demonstração
INSERT INTO pens (name, aggregation_rule) 
VALUES ('Curral Principal', 'median')
ON CONFLICT DO NOTHING;

-- Inserir estação de pesagem de demonstração
INSERT INTO weigh_stations (name, camera_type) 
VALUES ('Corredor de Pesagem 1', 'rgb')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Última contagem por curral
CREATE OR REPLACE VIEW v_latest_pen_counts AS
SELECT DISTINCT ON (pen_id)
    pc.id,
    pc.pen_id,
    p.name AS pen_name,
    pc.count,
    pc.confidence,
    pc.captured_at
FROM pen_counts pc
JOIN pens p ON p.id = pc.pen_id
ORDER BY pen_id, captured_at DESC;

-- View: Última estimativa de peso por estação
CREATE OR REPLACE VIEW v_latest_weight_estimates AS
SELECT DISTINCT ON (station_id)
    we.id,
    we.station_id,
    ws.name AS station_name,
    we.estimated_kg,
    we.confidence,
    we.captured_at,
    we.confirmed_kg
FROM weight_estimates we
JOIN weigh_stations ws ON ws.id = we.station_id
ORDER BY station_id, captured_at DESC;

-- View: Status das câmeras
CREATE OR REPLACE VIEW v_cameras_status AS
SELECT 
    c.id,
    c.name,
    c.type,
    c.status,
    c.position,
    c.last_seen_at,
    p.name AS pen_name,
    ws.name AS weigh_station_name
FROM cameras c
LEFT JOIN pens p ON p.id = c.pen_id
LEFT JOIN weigh_stations ws ON ws.id = c.weigh_station_id;

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função: Calcular contagem agregada do curral
CREATE OR REPLACE FUNCTION fn_aggregate_pen_count(p_pen_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_rule aggregation_rule;
    v_primary_camera_id INTEGER;
    v_result INTEGER;
BEGIN
    -- Buscar regra de agregação
    SELECT aggregation_rule, primary_camera_id 
    INTO v_rule, v_primary_camera_id
    FROM pens WHERE id = p_pen_id;
    
    -- Buscar última contagem
    SELECT 
        CASE v_rule
            WHEN 'median' THEN (
                SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pcc.count)::INTEGER
                FROM pen_camera_counts pcc
                JOIN pen_counts pc ON pc.id = pcc.pen_count_id
                WHERE pc.pen_id = p_pen_id
                AND pc.id = (SELECT MAX(id) FROM pen_counts WHERE pen_id = p_pen_id)
            )
            WHEN 'max' THEN (
                SELECT MAX(pcc.count)
                FROM pen_camera_counts pcc
                JOIN pen_counts pc ON pc.id = pcc.pen_count_id
                WHERE pc.pen_id = p_pen_id
                AND pc.id = (SELECT MAX(id) FROM pen_counts WHERE pen_id = p_pen_id)
            )
            WHEN 'principal' THEN (
                SELECT pcc.count
                FROM pen_camera_counts pcc
                JOIN pen_counts pc ON pc.id = pcc.pen_count_id
                WHERE pc.pen_id = p_pen_id
                AND pcc.camera_id = v_primary_camera_id
                AND pc.id = (SELECT MAX(id) FROM pen_counts WHERE pen_id = p_pen_id)
            )
        END
    INTO v_result;
    
    RETURN COALESCE(v_result, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Ajuste conforme seu usuário de banco de dados
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seu_usuario;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seu_usuario;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
