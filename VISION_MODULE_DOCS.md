# Fazenda Digital - Módulo de Visão Computacional

## Visão Geral

Este documento descreve a implementação completa do módulo de visão computacional para o app Fazenda Digital, incluindo:

1. **Contagem de Gado no Curral** - Monitoramento em tempo real com até 4 câmeras RTSP/ONVIF
2. **Estimativa de Peso por Câmera** - Pesagem automática no corredor usando visão computacional

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FAZENDA DIGITAL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Câmeras   │───▶│   Vision    │───▶│   Backend API       │ │
│  │   RTSP/     │    │   Agent     │    │   (tRPC)            │ │
│  │   ONVIF     │    │   (Python)  │    │                     │ │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘ │
│                                                    │            │
│                                                    ▼            │
│                                        ┌─────────────────────┐ │
│                                        │   PostgreSQL        │ │
│                                        │   Database          │ │
│                                        └──────────┬──────────┘ │
│                                                    │            │
│                                                    ▼            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    App Mobile (Expo)                        ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │ Curral ao   │  │ Corredor    │  │ Dashboard           │ ││
│  │  │ Vivo        │  │ Peso        │  │ Integrado           │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Banco de Dados

### Tabelas Criadas

#### `cameras`
Armazena configurações das câmeras.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | ID único |
| name | varchar(100) | Nome da câmera |
| rtsp_url | text | URL RTSP do stream |
| type | enum | 'rtsp', 'onvif', 'rgb', 'depth' |
| position | varchar(10) | Posição (NE, NW, SE, SW) |
| pen_id | integer | FK para curral (se aplicável) |
| weigh_station_id | integer | FK para estação de pesagem |
| roi_config | jsonb | Configuração de ROI |
| status | enum | 'online', 'offline', 'error' |
| last_seen_at | timestamp | Última vez online |
| created_at | timestamp | Data de criação |

#### `pens` (Currais)
Configuração dos currais monitorados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | ID único |
| name | varchar(100) | Nome do curral |
| aggregation_rule | enum | 'median', 'max', 'principal' |
| primary_camera_id | integer | Câmera principal |
| created_at | timestamp | Data de criação |

#### `pen_counts` (Contagens)
Histórico de contagens de animais.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | ID único |
| pen_id | integer | FK para curral |
| count | integer | Número de animais |
| confidence | decimal | Confiança (0-1) |
| captured_at | timestamp | Momento da captura |
| meta | jsonb | Metadados (detecções) |

#### `pen_camera_counts`
Contagens individuais por câmera.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | ID único |
| pen_count_id | integer | FK para contagem |
| camera_id | integer | FK para câmera |
| count | integer | Contagem desta câmera |
| confidence | decimal | Confiança |

#### `weigh_stations` (Estações de Pesagem)
Configuração das estações de pesagem.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | ID único |
| name | varchar(100) | Nome da estação |
| camera_id | integer | FK para câmera |
| camera_type | enum | 'rgb', 'depth' |
| calibration_version | integer | Versão da calibração |
| config | jsonb | Configurações extras |
| created_at | timestamp | Data de criação |

#### `weight_estimates` (Estimativas de Peso)
Histórico de estimativas de peso.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | ID único |
| station_id | integer | FK para estação |
| estimated_kg | decimal | Peso estimado (kg) |
| confidence | decimal | Confiança (0-1) |
| calibration_version | integer | Versão da calibração |
| captured_at | timestamp | Momento da captura |
| animal_id | integer | FK para animal (opcional) |
| confirmed_kg | decimal | Peso real confirmado |
| meta | jsonb | Metadados |

#### `calibrations` (Calibrações)
Histórico de calibrações do modelo de peso.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | ID único |
| station_id | integer | FK para estação |
| version | integer | Número da versão |
| model_type | enum | 'linear', 'polynomial' |
| coefficients | jsonb | Coeficientes do modelo |
| rmse | decimal | Erro médio (kg) |
| samples_count | integer | Amostras usadas |
| created_at | timestamp | Data de criação |

---

## 2. API Backend (tRPC)

### Endpoints Disponíveis

#### `vision.ingest`
Recebe dados do Vision Agent.

```typescript
// POST /api/trpc/vision.ingest
{
  type: 'count' | 'weight',
  apiKey: string,
  data: {
    // Para contagem:
    penId: number,
    cameraId: number,
    count: number,
    confidence: number,
    capturedAt: string,
    meta?: object
    
    // Para peso:
    stationId: number,
    estimatedKg: number,
    confidence: number,
    calibrationVersion: number,
    capturedAt: string,
    meta?: object
  }
}
```

#### `vision.getCamerasStatus`
Retorna status de todas as câmeras.

```typescript
// GET /api/trpc/vision.getCamerasStatus
// Response:
{
  data: [
    {
      id: number,
      name: string,
      status: 'online' | 'offline' | 'error',
      lastSeenAt: string | null,
      position: string | null,
      penId: number | null,
      weighStationId: number | null
    }
  ]
}
```

#### `vision.getPenLiveCount`
Retorna contagem atual de um curral.

```typescript
// GET /api/trpc/vision.getPenLiveCount?penId=1
// Response:
{
  penId: number,
  count: number,
  confidence: number,
  capturedAt: string,
  cameras: [
    { cameraId: number, count: number, confidence: number }
  ]
}
```

#### `vision.getWeightEstimates`
Retorna estimativas de peso.

```typescript
// GET /api/trpc/vision.getWeightEstimates?stationId=1&limit=50
// Response:
{
  data: [
    {
      id: number,
      stationId: number,
      estimatedKg: number,
      confidence: number,
      capturedAt: string,
      animalId: number | null,
      confirmedKg: number | null
    }
  ]
}
```

#### `vision.confirmWeight`
Confirma peso real para calibração.

```typescript
// POST /api/trpc/vision.confirmWeight
{
  estimateId: number,
  confirmedKg: number,
  animalId?: number
}
```

---

## 3. Vision Agent (Python)

### Instalação

```bash
cd vision-agent
pip install -r requirements.txt
```

### Configuração

Variáveis de ambiente:

```bash
# .env
API_BASE_URL=https://seu-backend.com
VISION_AGENT_API_KEY=sua-chave-secreta
DEMO_MODE=false
```

### Execução

```bash
# Modo produção
python main.py

# Modo demonstração (sem câmeras reais)
DEMO_MODE=true python main.py

# Com Docker
docker build -t fazenda-vision-agent .
docker run -d \
  -e API_BASE_URL=https://seu-backend.com \
  -e VISION_AGENT_API_KEY=sua-chave \
  fazenda-vision-agent
```

### Funcionalidades

#### Detecção de Gado (YOLOv8)
- Usa modelo YOLOv8 pré-treinado
- Pode ser substituído por modelo customizado treinado com gado brasileiro
- Suporta ROI (Região de Interesse) para ignorar áreas irrelevantes

#### Contagem no Curral
- Processa frames de até 4 câmeras simultaneamente
- Aplica suavização (média móvel) para evitar flutuações
- Regras de agregação: mediana, máximo ou câmera principal

#### Estimativa de Peso
- Usa dimensões do bounding box para estimar peso
- Suporta câmeras RGB (2D) e depth (3D)
- Calibração por regressão linear/polinomial
- Melhora com confirmações de peso real

---

## 4. Telas do App Mobile

### Curral ao Vivo (`/curral`)

**Funcionalidades:**
- Visualização da contagem total em tempo real
- Grid de 4 câmeras com status individual
- Gráfico de histórico (últimas 24h)
- Configuração de regra de agregação
- Atualização automática a cada 5 segundos

**Navegação:**
- Acessível via botão no Dashboard
- Ou via deep link: `fazenda://curral`

### Corredor Peso (`/peso`)

**Funcionalidades:**
- Display de peso estimado em tempo real
- Seleção de estação de pesagem
- Confirmação de peso real (para calibração)
- Vinculação com animal cadastrado
- Histórico de pesagens do dia
- Informações de calibração

**Navegação:**
- Acessível via botão no Dashboard
- Ou via deep link: `fazenda://peso`

---

## 5. Deploy

### Checklist de Deploy

#### Backend
- [ ] Executar migração do banco de dados
- [ ] Configurar variável `VISION_AGENT_API_KEY`
- [ ] Testar endpoints de visão

#### Vision Agent
- [ ] Instalar em servidor edge (próximo às câmeras)
- [ ] Configurar URLs RTSP das câmeras
- [ ] Testar conectividade com backend
- [ ] Configurar como serviço systemd

#### App Mobile
- [ ] Testar telas de Curral e Peso
- [ ] Verificar navegação do Dashboard
- [ ] Testar em dispositivo real

### Script de Migração

```bash
# Executar no servidor do backend
cd fazenda-digital-app
pnpm db:push
```

### Configuração do Vision Agent como Serviço

```ini
# /etc/systemd/system/fazenda-vision.service
[Unit]
Description=Fazenda Digital Vision Agent
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/fazenda-vision-agent
Environment=API_BASE_URL=https://api.fazendadigital.com
Environment=VISION_AGENT_API_KEY=sua-chave
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable fazenda-vision
sudo systemctl start fazenda-vision
sudo systemctl status fazenda-vision
```

---

## 6. Configuração de Câmeras

### Câmeras RTSP Recomendadas

| Modelo | Resolução | FPS | Preço Aprox. |
|--------|-----------|-----|--------------|
| Hikvision DS-2CD2043G2-I | 4MP | 30 | R$ 800 |
| Intelbras VIP 3230 | 2MP | 30 | R$ 500 |
| Dahua IPC-HFW2431S | 4MP | 25 | R$ 700 |

### Câmeras Depth (Para Pesagem)

| Modelo | Tipo | Alcance | Preço Aprox. |
|--------|------|---------|--------------|
| Intel RealSense D435 | Stereo | 10m | R$ 1.500 |
| Intel RealSense D455 | Stereo | 20m | R$ 2.500 |
| Azure Kinect DK | ToF | 5m | R$ 3.000 |

### Posicionamento Recomendado

**Curral (4 câmeras):**
```
    ┌─────────────────────────┐
    │         CURRAL          │
    │                         │
NW ◉│                         │◉ NE
    │                         │
    │                         │
SW ◉│                         │◉ SE
    │                         │
    └─────────────────────────┘
```

**Corredor de Pesagem:**
```
    ┌───────────────────────────────┐
    │                               │
    │   ◉ Câmera (altura 2.5m)     │
    │   │                          │
    │   ▼                          │
    │  ┌─────┐                     │
    │  │ 🐄  │ ← Animal passando   │
    │  └─────┘                     │
    │                               │
    └───────────────────────────────┘
```

---

## 7. Calibração do Modelo de Peso

### Processo de Calibração

1. **Coleta de Amostras**
   - Pesar animais na balança real
   - Confirmar peso no app (botão "Confirmar Peso")
   - Mínimo recomendado: 30 amostras

2. **Treinamento do Modelo**
   - Sistema treina automaticamente quando há amostras suficientes
   - Usa regressão linear ou polinomial
   - Calcula RMSE (erro médio)

3. **Validação**
   - Comparar estimativas com pesos reais
   - RMSE aceitável: < 20kg

### Fórmula de Estimativa (RGB)

```
Peso (kg) = a × Área_bbox + b
```

Onde:
- `Área_bbox` = largura × altura do bounding box em pixels
- `a`, `b` = coeficientes calibrados

### Fórmula de Estimativa (Depth)

```
Peso (kg) = a × Volume_estimado + b × Comprimento + c
```

Onde:
- `Volume_estimado` = volume aproximado do animal em m³
- `Comprimento` = comprimento do animal em metros

---

## 8. Troubleshooting

### Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| Câmera offline | URL RTSP incorreta | Verificar URL e credenciais |
| Contagem instável | Iluminação ruim | Melhorar iluminação ou ajustar ROI |
| Peso impreciso | Calibração desatualizada | Recalibrar com mais amostras |
| Latência alta | Rede lenta | Usar servidor edge local |

### Logs do Vision Agent

```bash
# Ver logs em tempo real
tail -f /opt/fazenda-vision-agent/vision_agent.log

# Filtrar erros
grep ERROR vision_agent.log
```

---

## 9. Próximas Melhorias

- [ ] Suporte a identificação individual de animais (RFID + visão)
- [ ] Detecção de comportamento anormal (doença, cio)
- [ ] Integração com drones para contagem em pasto
- [ ] Modelo de IA treinado especificamente para gado brasileiro
- [ ] Dashboard web para monitoramento remoto

---

## Suporte

Para dúvidas ou problemas, entre em contato:
- Email: suporte@fazendadigital.com
- WhatsApp: (99) 99999-9999

---

**Versão:** 4.0.0  
**Última atualização:** Janeiro 2026  
**Autor:** Fazenda Digital
