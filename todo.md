# Fazenda Digital - TODO

## Configuração Base
- [x] Configurar tema de cores agropecuária profissional
- [x] Configurar ícones da tab bar
- [x] Atualizar app.config.ts com nome e branding

## Telas Principais
- [x] Dashboard (Home) com cards de resumo
- [x] Tela de Rebanho (lista de animais)
- [x] Tela de Vendas
- [x] Tela de Custos
- [x] Tela de Relatórios

## Funcionalidades de Animais
- [x] Cadastro de animal com foto
- [x] Edição de animal
- [x] Exclusão de animal
- [x] Filtro por categoria
- [x] Busca por identificador
- [x] Exibição de detalhes

## Funcionalidades de Vendas
- [x] Seleção múltipla de animais
- [x] Cálculo automático de arrobas
- [x] Cálculo de valor total
- [x] Registro de venda
- [x] Histórico de vendas

## Funcionalidades de Custos
- [x] Cadastro de custo
- [x] Categorização de custos
- [x] Lista de custos
- [x] Resumo por categoria

## Relatórios
- [x] Relatório de inventário
- [x] Relatório de vendas
- [x] Relatório de custos
- [x] Relatório de desempenho
- [x] Compartilhamento

## Calculadora Pecuária
- [x] Conversão kg para arrobas
- [x] Cálculo de valor do animal
- [x] Média de peso

## Persistência de Dados
- [x] AsyncStorage para animais
- [x] AsyncStorage para vendas
- [x] AsyncStorage para custos
- [x] Carregamento inicial de dados

## Branding
- [x] Gerar logo do aplicativo
- [x] Configurar ícones do app

## Validação Final
- [x] Testar todos os botões
- [x] Testar todos os formulários
- [x] Testar relatórios
- [x] Validar fluxos de usuário
- [x] Testes unitários passando

## Melhorias Adicionais (v2.0)
- [x] Gráficos de evolução do rebanho (Pizza Chart)
- [x] Componentes de gráficos customizados (Line, Bar, Pie, Progress)
- [x] Calculadora pecuária avançada (GMD, conversão alimentar, projeção)
- [x] Sistema de lembretes para vacinação/vermifugo/pesagem
- [x] Feedback háptico nos botões
- [x] Tela de configurações completa
- [x] Valores padrão configuráveis (preço arroba, rendimento)

## Versão Comercial Final (v3.0)

### Sistema de Autenticação
- [x] Tela de splash animada com logo (3 segundos)
- [x] Tela de login/cadastro inicial
- [x] Cadastro do cliente (nome, email, telefone, CPF/CNPJ)
- [x] Cadastro da fazenda (nome, localização, tamanho em hectares)
- [x] Autenticação biométrica (Face ID / Touch ID) a partir do 2º acesso
- [x] Persistência de sessão do usuário
- [x] Logout e troca de conta

### Dashboard Administrativo (Painel do Dono)
- [x] Estrutura para integração com Firebase (documentação)
- [x] Visualização de clientes cadastrados (documentação)
- [x] Status de pagamentos (ativo/inativo) (documentação)
- [x] Relatórios de uso do app (documentação)
- [x] Métricas de engajamento (documentação)

### Dados Iniciais
- [x] Zerar animais cadastrados
- [x] Zerar vendas registradas
- [x] Zerar custos registrados
- [x] Estado inicial limpo para produção

### Documentação
- [x] Passo a passo para publicar na App Store (DEPLOY_GUIDE.md)
- [x] Guia de integração com Firebase existente (ADMIN_DASHBOARD.md)
- [x] Instruções de configuração do painel admin (ADMIN_DASHBOARD.md)


## Visão Computacional (v4.0)

### Funcionalidade 1 - Contagem de Gado no Curral
- [x] Modelagem: tabela cameras
- [x] Modelagem: tabela pens/currais
- [x] Modelagem: tabela pen_counts
- [x] API: GET /pens/:id/count
- [x] API: GET /pens/:id/count/history
- [x] API: GET /cameras/status
- [x] API: POST /vision/ingest (interno)
- [x] Tela: Curral ao Vivo
- [x] Widget: Status das câmeras
- [x] Widget: Histórico por hora/dia

### Funcionalidade 2 - Peso por Câmera no Corredor
- [x] Modelagem: tabela weigh_stations
- [x] Modelagem: tabela weight_estimates
- [x] Modelagem: tabela calibrations
- [x] API: GET /weigh-stations/:id/latest
- [x] API: GET /weigh-stations/:id/history
- [x] API: POST /weigh-stations/:id/calibrations
- [x] Tela: Corredor - Peso Estimado
- [x] Widget: Lista de passagens
- [x] Widget: Gráfico de histórico
- [x] Módulo de calibração

### Vision Agent (Serviço Separado)
- [x] Estrutura do serviço Python
- [x] Conexão RTSP/ONVIF
- [x] Detecção YOLO + ByteTrack
- [x] Suavização de contagem
- [x] Estimativa de peso
- [x] Modo MOCK
- [x] Healthcheck
- [x] Config por ENV

### Documentação e Deploy
- [x] Script de migração do banco
- [x] Arquivo .env exemplo
- [x] Docker Compose
- [x] Checklist de implantação


## Atualização de UI e Branding (v4.1)
- [x] Adicionar aba "Peso IA" na tab bar
- [x] Adicionar aba "Curral IA" na tab bar
- [x] Gerar nova logo oficial com touro verde/dourado
- [x] Integrar nome "Fazenda Digital" dentro do ícone do touro
- [x] Atualizar logo no splash screen
- [x] Atualizar logo no ícone do app
- [x] Atualizar logo no header do app
- [x] Copiar logo para todos os locais necessários


## Versão Web Responsiva (v4.2)
- [x] Adicionar detecção de plataforma (Platform.OS === "web")
- [x] Adicionar detecção de tamanho de tela (width > 768)
- [x] Layout responsivo do content (maxWidth 1400px, padding 40px)
- [x] Cards financeiros em linha horizontal para telas grandes
- [x] Cards financeiros com flex: 1 e minWidth: 300px
