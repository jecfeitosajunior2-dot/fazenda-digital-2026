# Fazenda Digital - Checklist de Deploy do Módulo de Visão

## Pré-Requisitos

### Hardware
- [ ] Servidor edge (mínimo: 4GB RAM, 2 cores, GPU opcional)
- [ ] Câmeras RTSP instaladas e configuradas
- [ ] Rede local estável (mínimo 10 Mbps por câmera)
- [ ] Acesso à internet para comunicação com backend

### Software
- [ ] Python 3.9+ instalado no servidor edge
- [ ] Docker instalado (opcional, recomendado)
- [ ] PostgreSQL 14+ no backend
- [ ] Node.js 18+ no backend

---

## Etapa 1: Banco de Dados

### 1.1 Executar Migração
```bash
# Conectar ao PostgreSQL
psql -h seu-host -U seu-usuario -d fazenda_digital

# Executar script de migração
\i scripts/migrate-vision.sql
```

### 1.2 Verificar Tabelas Criadas
```sql
-- Listar tabelas
\dt

-- Deve mostrar:
-- cameras
-- pens
-- pen_counts
-- pen_camera_counts
-- weigh_stations
-- weight_estimates
-- calibrations
```

### 1.3 Verificar Views
```sql
-- Listar views
\dv

-- Deve mostrar:
-- v_latest_pen_counts
-- v_latest_weight_estimates
-- v_cameras_status
```

- [ ] Migração executada com sucesso
- [ ] Todas as tabelas criadas
- [ ] Views funcionando

---

## Etapa 2: Backend API

### 2.1 Configurar Variáveis de Ambiente
```bash
# Adicionar ao .env do backend
VISION_AGENT_API_KEY=gerar-chave-segura-aqui
```

### 2.2 Registrar Router de Visão
```typescript
// server/_core/router.ts
import { visionRouter } from '../visionRouter';

export const appRouter = router({
  // ... outros routers
  vision: visionRouter,
});
```

### 2.3 Testar Endpoints
```bash
# Testar status das câmeras
curl https://seu-backend.com/api/trpc/vision.getCamerasStatus

# Testar contagem do curral
curl "https://seu-backend.com/api/trpc/vision.getPenLiveCount?input={\"penId\":1}"
```

- [ ] Variável VISION_AGENT_API_KEY configurada
- [ ] Router de visão registrado
- [ ] Endpoints respondendo corretamente

---

## Etapa 3: Vision Agent (Python)

### 3.1 Instalar Dependências
```bash
cd vision-agent
pip install -r requirements.txt
```

### 3.2 Configurar Ambiente
```bash
# Criar arquivo .env
cat > .env << EOF
API_BASE_URL=https://seu-backend.com
VISION_AGENT_API_KEY=sua-chave-aqui
DEMO_MODE=false
EOF
```

### 3.3 Testar em Modo Demo
```bash
DEMO_MODE=true python main.py
```

### 3.4 Configurar Câmeras
```python
# Editar main.py ou criar config.json
CAMERAS = [
    {
        "id": 1,
        "name": "Câmera NE",
        "rtsp_url": "rtsp://usuario:senha@192.168.1.100:554/stream1",
        "position": "NE",
        "pen_id": 1
    },
    # ... mais câmeras
]
```

### 3.5 Executar em Produção
```bash
# Diretamente
python main.py

# Com Docker
docker build -t fazenda-vision-agent .
docker run -d --name vision-agent \
  -e API_BASE_URL=https://seu-backend.com \
  -e VISION_AGENT_API_KEY=sua-chave \
  fazenda-vision-agent
```

### 3.6 Configurar como Serviço
```bash
# Criar serviço systemd
sudo nano /etc/systemd/system/fazenda-vision.service

# Conteúdo:
[Unit]
Description=Fazenda Digital Vision Agent
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/fazenda-vision-agent
EnvironmentFile=/opt/fazenda-vision-agent/.env
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Ativar e iniciar
sudo systemctl daemon-reload
sudo systemctl enable fazenda-vision
sudo systemctl start fazenda-vision
```

- [ ] Dependências instaladas
- [ ] Arquivo .env configurado
- [ ] Teste em modo demo bem-sucedido
- [ ] Câmeras configuradas
- [ ] Serviço systemd criado e ativo

---

## Etapa 4: App Mobile

### 4.1 Verificar Novas Telas
- [ ] Tela `/curral` acessível
- [ ] Tela `/peso` acessível
- [ ] Navegação do Dashboard funcionando

### 4.2 Testar Funcionalidades
- [ ] Curral ao Vivo mostra contagem
- [ ] Grid de câmeras mostra status
- [ ] Gráfico de histórico carrega
- [ ] Corredor Peso mostra estimativa
- [ ] Confirmação de peso funciona
- [ ] Histórico de pesagens carrega

### 4.3 Testar em Dispositivo Real
```bash
# Gerar build de teste
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

- [ ] Telas funcionando no simulador
- [ ] Telas funcionando no dispositivo real
- [ ] Dados sincronizando com backend

---

## Etapa 5: Configuração de Câmeras

### 5.1 Cadastrar Câmeras no Banco
```sql
-- Câmeras do Curral
INSERT INTO cameras (name, rtsp_url, type, position, pen_id) VALUES
('Câmera NE', 'rtsp://user:pass@192.168.1.101:554/stream1', 'rtsp', 'NE', 1),
('Câmera NW', 'rtsp://user:pass@192.168.1.102:554/stream1', 'rtsp', 'NW', 1),
('Câmera SE', 'rtsp://user:pass@192.168.1.103:554/stream1', 'rtsp', 'SE', 1),
('Câmera SW', 'rtsp://user:pass@192.168.1.104:554/stream1', 'rtsp', 'SW', 1);

-- Câmera de Pesagem
INSERT INTO cameras (name, rtsp_url, type, weigh_station_id) VALUES
('Câmera Pesagem', 'rtsp://user:pass@192.168.1.105:554/stream1', 'rgb', 1);
```

### 5.2 Verificar Conectividade
```bash
# Testar stream RTSP
ffplay rtsp://user:pass@192.168.1.101:554/stream1
```

- [ ] Todas as câmeras cadastradas
- [ ] Streams RTSP acessíveis
- [ ] Câmeras aparecendo como "online" no app

---

## Etapa 6: Calibração de Peso

### 6.1 Coletar Amostras Iniciais
1. Pesar animal na balança real
2. Deixar animal passar pelo corredor
3. No app, clicar "Confirmar Peso"
4. Inserir peso real
5. Repetir para 30+ animais

### 6.2 Verificar Calibração
```sql
-- Ver calibrações
SELECT * FROM calibrations ORDER BY created_at DESC;

-- Ver RMSE (erro médio)
SELECT station_id, version, rmse, samples_count 
FROM calibrations 
WHERE station_id = 1 
ORDER BY version DESC 
LIMIT 1;
```

### 6.3 Validar Precisão
- RMSE < 20kg = Excelente
- RMSE 20-30kg = Bom
- RMSE > 30kg = Precisa mais amostras

- [ ] 30+ amostras coletadas
- [ ] Calibração criada automaticamente
- [ ] RMSE dentro do aceitável

---

## Etapa 7: Monitoramento

### 7.1 Verificar Logs
```bash
# Logs do Vision Agent
journalctl -u fazenda-vision -f

# Logs do Backend
pm2 logs fazenda-backend
```

### 7.2 Verificar Métricas
```sql
-- Contagens por hora (últimas 24h)
SELECT 
    DATE_TRUNC('hour', captured_at) AS hora,
    AVG(count) AS media_contagem
FROM pen_counts
WHERE captured_at > NOW() - INTERVAL '24 hours'
GROUP BY hora
ORDER BY hora;

-- Estimativas de peso por dia
SELECT 
    DATE_TRUNC('day', captured_at) AS dia,
    COUNT(*) AS total_pesagens,
    AVG(estimated_kg) AS peso_medio
FROM weight_estimates
WHERE captured_at > NOW() - INTERVAL '7 days'
GROUP BY dia
ORDER BY dia;
```

### 7.3 Configurar Alertas (Opcional)
- [ ] Alerta quando câmera fica offline > 5min
- [ ] Alerta quando contagem muda drasticamente
- [ ] Alerta quando peso está fora do range esperado

- [ ] Logs sendo gerados corretamente
- [ ] Métricas sendo coletadas
- [ ] Alertas configurados (se necessário)

---

## Etapa 8: Validação Final

### 8.1 Teste End-to-End
1. [ ] Abrir app no celular
2. [ ] Ir para Dashboard
3. [ ] Clicar em "Curral ao Vivo"
4. [ ] Verificar contagem em tempo real
5. [ ] Verificar grid de câmeras
6. [ ] Voltar ao Dashboard
7. [ ] Clicar em "Corredor Peso"
8. [ ] Verificar estimativa de peso
9. [ ] Testar confirmação de peso
10. [ ] Verificar histórico

### 8.2 Teste de Estresse
- [ ] Sistema funciona com 4 câmeras simultâneas
- [ ] Latência < 5 segundos
- [ ] Sem erros no log por 1 hora

### 8.3 Documentação
- [ ] Usuários treinados
- [ ] Manual de operação entregue
- [ ] Contato de suporte informado

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Câmera offline | Verificar URL RTSP e credenciais |
| Contagem zerada | Verificar se Vision Agent está rodando |
| Peso muito diferente | Recalibrar com mais amostras |
| App não atualiza | Verificar conexão com backend |
| Erro 401 na API | Verificar VISION_AGENT_API_KEY |

---

## Contatos de Suporte

- **Técnico:** suporte@fazendadigital.com
- **WhatsApp:** (99) 99999-9999
- **Documentação:** https://docs.fazendadigital.com

---

**Deploy concluído com sucesso!** ✅

Data: ___/___/______
Responsável: _______________________
Assinatura: ________________________
