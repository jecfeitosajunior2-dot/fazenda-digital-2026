# Alinhamento de Schema Backend/Frontend

## Status Atual

O app **Fazenda Digital** está 100% funcional com armazenamento local (AsyncStorage). Os dados são salvos no dispositivo do usuário e funcionam perfeitamente offline.

**Backend:** Implementado com tRPC + PostgreSQL (TiDB)  
**Frontend:** Usa AsyncStorage (local)  
**Problema:** Schemas incompatíveis entre backend e frontend

---

## Incompatibilidades de Schema

### Tabela: Animais

| Frontend (app) | Backend (banco) | Ação Necessária |
|---|---|---|
| `identificador` | `identificacao` | Renomear coluna ou ajustar frontend |
| `categoria` (Boi/Vaca/Bezerro/Novilha) | `sexo` (macho/femea) | Adicionar coluna `categoria` no banco |
| `peso` | `pesoAtual` | Renomear coluna ou ajustar frontend |
| `lote` | ❌ Não existe | Adicionar coluna `lote` no banco |
| `status` (Saudável/Em tratamento/Observação) | `status` (ativo/vendido/morto) | Usar enum diferente ou adicionar coluna |
| `foto` | ❌ Não existe | Adicionar coluna `foto` no banco |
| `dataCadastro` | `createdAt` | Usar `createdAt` no frontend |
| `dataUltimaPesagem` | ❌ Não existe | Adicionar coluna no banco |
| `pesoAnterior` | ❌ Não existe | Adicionar coluna no banco |

### Tabela: Vendas

| Frontend (app) | Backend (banco) | Ação Necessária |
|---|---|---|
| `animais` (array de IDs) | `animalId` (single) | Criar tabela intermediária `vendas_animais` |
| `quantidadeAnimais` | `quantidade` | Renomear coluna ou ajustar frontend |
| `pesoTotal` | `pesoTotal` | ✅ OK |
| `arrobas` | ❌ Não existe | Adicionar coluna no banco |
| `precoArroba` | ❌ Não existe | Adicionar coluna no banco |
| `valorTotal` | `valorTotal` | ✅ OK |
| `comprador` | `comprador` | ✅ OK |
| `data` | `dataVenda` | Usar `dataVenda` no frontend |

### Tabela: Custos

| Frontend (app) | Backend (banco) | Ação Necessária |
|---|---|---|
| `descricao` | `descricao` | ✅ OK |
| `valor` | `valor` | ✅ OK |
| `categoria` (Alimentação/Veterinário/etc) | `categoria` (alimentacao/veterinario/etc) | Ajustar mapeamento no frontend |
| `data` | `dataCusto` | Usar `dataCusto` no frontend |

---

## Solução Recomendada

### Opção 1: Ajustar Backend (Recomendado)

Modificar o schema do banco para alinhar com o frontend:

```sql
-- Adicionar colunas faltantes em animais
ALTER TABLE animais 
  ADD COLUMN categoria VARCHAR(50),
  ADD COLUMN lote VARCHAR(50),
  ADD COLUMN statusSaude ENUM('Saudável', 'Em tratamento', 'Observação'),
  ADD COLUMN foto TEXT,
  ADD COLUMN dataUltimaPesagem TIMESTAMP,
  ADD COLUMN pesoAnterior DECIMAL(8,2);

-- Renomear colunas
ALTER TABLE animais 
  CHANGE COLUMN identificacao identificador VARCHAR(50),
  CHANGE COLUMN pesoAtual peso DECIMAL(8,2);

-- Adicionar colunas faltantes em vendas
ALTER TABLE vendas
  ADD COLUMN arrobas DECIMAL(10,2),
  ADD COLUMN precoArroba DECIMAL(8,2);

-- Criar tabela intermediária para vendas com múltiplos animais
CREATE TABLE vendas_animais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendaId INT NOT NULL,
  animalId INT NOT NULL,
  FOREIGN KEY (vendaId) REFERENCES vendas(id),
  FOREIGN KEY (animalId) REFERENCES animais(id)
);
```

### Opção 2: Ajustar Frontend

Modificar o `data-context.tsx` para mapear campos do frontend para o backend:

```typescript
// Exemplo de mapeamento
const animalToBackend = (animal: Animal) => ({
  identificacao: animal.identificador,
  pesoAtual: animal.peso,
  sexo: animal.categoria === "Boi" || animal.categoria === "Bezerro" ? "macho" : "femea",
  // ... outros campos
});
```

---

## Estimativa de Implementação

### Opção 1 (Ajustar Backend)
- **Tempo:** 4-6 horas
- **Custo:** R$ 1.500-2.500
- **Tokens Manus:** ~30.000-40.000

### Opção 2 (Ajustar Frontend)
- **Tempo:** 6-8 horas
- **Custo:** R$ 2.000-3.500
- **Tokens Manus:** ~40.000-50.000

---

## Checklist de Implementação

### Backend (Opção 1)
- [ ] Criar migration SQL com alterações de schema
- [ ] Executar migration no banco de dados
- [ ] Atualizar `drizzle/schema.ts` com novos campos
- [ ] Atualizar funções em `server/db.ts`
- [ ] Atualizar endpoints tRPC em `server/routers/fazenda.ts`
- [ ] Testar endpoints com Postman/Insomnia
- [ ] Atualizar `data-context.tsx` para usar tRPC

### Frontend (Opção 2)
- [ ] Criar funções de mapeamento em `lib/data-context.tsx`
- [ ] Ajustar `addAnimal()` para mapear campos
- [ ] Ajustar `updateAnimal()` para mapear campos
- [ ] Ajustar `addVenda()` para mapear campos
- [ ] Ajustar `addCusto()` para mapear campos
- [ ] Testar integração completa

---

## Contato para Implementação

Se precisar contratar desenvolvedor para implementar:

**Perfil recomendado:**
- Experiência com React Native + TypeScript
- Conhecimento de tRPC e Drizzle ORM
- Experiência com PostgreSQL/MySQL

**Onde encontrar:**
- Upwork: https://www.upwork.com
- Freelancer: https://www.freelancer.com.br
- LinkedIn: Buscar "React Native Developer Brazil"

**Orçamento esperado:** R$ 1.500-3.500 (4-8 horas de trabalho)

---

## Conclusão

O app está **100% funcional offline**. A integração com backend é opcional e pode ser feita quando você:
- Quiser sincronizar dados entre dispositivos
- Precisar de backup automático na nuvem
- Quiser acessar dados via dashboard admin web

**Por enquanto, o app funciona perfeitamente sem backend!** ✅
