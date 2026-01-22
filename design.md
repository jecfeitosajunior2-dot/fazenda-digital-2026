# Fazenda Digital - Design Document

## Visão Geral

Aplicativo de gestão pecuária profissional para pecuaristas de pequeno e grande porte em todo o Brasil. O design segue os padrões Apple Human Interface Guidelines (HIG) para garantir uma experiência nativa iOS de alta qualidade.

---

## Paleta de Cores (Agropecuária Profissional)

| Token | Light Mode | Dark Mode | Uso |
|-------|------------|-----------|-----|
| `primary` | #1B4332 | #2D6A4F | Verde escuro - cor principal da marca |
| `background` | #F8F9FA | #0D1B14 | Fundo das telas |
| `surface` | #FFFFFF | #1A2F23 | Cards e elementos elevados |
| `foreground` | #1B4332 | #E8F5E9 | Texto principal |
| `muted` | #6C757D | #9BA1A6 | Texto secundário |
| `border` | #DEE2E6 | #2D4A3E | Bordas e divisores |
| `success` | #2D6A4F | #4ADE80 | Estados de sucesso |
| `warning` | #E9C46A | #FBBF24 | Alertas e avisos |
| `error` | #E63946 | #F87171 | Erros e exclusões |
| `accent` | #D4A574 | #C9A227 | Destaques dourados (premium) |

---

## Lista de Telas

### 1. Splash Screen
- Logo animado da Fazenda Digital
- Gradiente verde profissional
- Transição suave para Login/Home

### 2. Tela de Login/Cadastro
- Logo centralizado
- Campos de email e senha
- Botões de Login e Cadastro
- Design limpo e profissional

### 3. Home (Dashboard)
- Header com saudação e nome do usuário
- Cards de resumo: Total de Animais, Arrobas, Faturamento, Custos
- Ações rápidas: Novo Animal, Nova Venda, Novo Custo
- Gráfico de desempenho mensal
- Últimas atividades

### 4. Rebanho (Animais)
- Barra de busca
- Filtros por categoria (Boi, Vaca, Bezerro, Novilha)
- Lista de animais com foto, ID, peso, lote
- FAB para adicionar novo animal
- Modal de cadastro/edição completo

### 5. Vendas
- Resumo de vendas do mês
- Lista de vendas realizadas
- FAB para nova venda
- Modal de venda com seleção de animais

### 6. Custos
- Resumo de custos por categoria
- Lista de custos registrados
- FAB para novo custo
- Modal de cadastro de custo

### 7. Relatórios
- Cards de relatórios disponíveis:
  - Inventário Completo
  - Relatório de Vendas
  - Análise de Custos
  - Desempenho do Rebanho
- Geração de PDF com compartilhamento

### 8. Perfil/Configurações
- Dados do usuário
- Nome da fazenda
- Configurações do app
- Botão de logout

---

## Funcionalidades Principais

### Gestão de Animais
- Cadastro com foto (câmera/galeria)
- Identificador único (brinco)
- Categoria: Boi, Vaca, Bezerro, Novilha
- Raça, Peso, Lote
- Status sanitário
- Histórico de pesagens

### Gestão de Vendas
- Seleção múltipla de animais
- Cálculo automático de arrobas
- Preço por arroba configurável
- Valor total calculado
- Histórico de vendas

### Gestão de Custos
- Categorias: Alimentação, Veterinário, Manutenção, Mão de Obra, Outros
- Descrição e valor
- Data automática
- Relatório por categoria

### Relatórios
- Inventário completo do rebanho
- Relatório de vendas e faturamento
- Análise de custos
- Indicadores de desempenho (GMD, @/cab)

### Calculadora Pecuária
- Conversão kg ↔ arrobas
- Cálculo de GMD (Ganho Médio Diário)
- Valor do animal por peso
- Média de peso do rebanho

---

## Fluxos de Usuário

### Fluxo 1: Cadastrar Animal
1. Usuário toca no FAB "+" na tela Rebanho
2. Modal abre com formulário
3. Usuário tira foto ou seleciona da galeria
4. Preenche: Identificador, Categoria, Raça, Peso, Lote, Status
5. Toca em "Cadastrar Animal"
6. Animal aparece na lista

### Fluxo 2: Registrar Venda
1. Usuário toca no FAB "+" na tela Vendas
2. Seleciona animais para venda (checkbox)
3. Toca em "Continuar"
4. Visualiza resumo (quantidade, peso, arrobas)
5. Informa preço da arroba
6. Valor total é calculado automaticamente
7. Toca em "Finalizar Venda"
8. Animais são removidos do rebanho

### Fluxo 3: Gerar Relatório
1. Usuário acessa tela Relatórios
2. Seleciona tipo de relatório
3. Toca em "Gerar PDF"
4. Relatório é gerado com dados atuais
5. Opção de compartilhar via WhatsApp/Email

---

## Componentes de UI

### Cards de Resumo
- Ícone à esquerda
- Título e valor
- Indicador de variação (↑↓)
- Sombra sutil

### Lista de Animais
- Foto circular à esquerda
- Identificador em destaque
- Detalhes: categoria, raça, peso
- Badge de lote e status
- Chevron à direita

### Botões de Ação
- Primário: Fundo verde, texto branco
- Secundário: Borda verde, fundo transparente
- Destrutivo: Fundo vermelho

### Tab Bar
- 5 tabs: Home, Rebanho, Vendas, Custos, Relatórios
- Ícones SF Symbols
- Indicador de tab ativo

---

## Diferenciais Competitivos

1. **Interface Premium**: Design profissional padrão multinacional
2. **Offline First**: Funciona sem internet com AsyncStorage
3. **Cálculos Automáticos**: Arrobas, GMD, valores
4. **Relatórios PDF**: Geração e compartilhamento instantâneo
5. **Fotos de Animais**: Identificação visual rápida
6. **Dashboard Inteligente**: Visão geral completa em uma tela
7. **Facilidade de Uso**: Fluxos simples e intuitivos
