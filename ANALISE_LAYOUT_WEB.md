# Análise de Problemas de Layout Web

## Problema Identificado no Vídeo

**Tela:** Criar Conta (Cadastro)

### Problemas Visuais:

1. **Campos de input muito largos**
   - Os campos ocupam quase toda a largura da tela
   - Não há margem/padding adequado nas laterais
   - Parece "esticado" demais

2. **Falta de centralização**
   - O formulário não está centralizado
   - Deveria ter maxWidth e estar no centro

3. **Falta de espaçamento**
   - Pouco espaço entre os campos
   - Botão muito próximo do último campo

4. **Layout não responsivo**
   - Em tela grande, deveria ter maxWidth menor (600-800px)
   - Deveria estar centralizado horizontalmente

### Solução:

Aplicar as mesmas correções de responsividade que fizemos no Dashboard:
- maxWidth para telas grandes
- Centralização com alignSelf: "center"
- Padding adequado
- Espaçamento entre elementos

## Arquivos a Corrigir:

1. `app/(auth)/criar-conta.tsx` - Tela de cadastro
2. `app/(auth)/login.tsx` - Tela de login (provavelmente tem o mesmo problema)
3. Qualquer outra tela de formulário que esteja "esticada"
