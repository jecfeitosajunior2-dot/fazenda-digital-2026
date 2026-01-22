# Guia Completo de Deploy - Fazenda Digital

## Passo a Passo: Do Expo Go para a App Store

Este documento detalha todo o processo para publicar o aplicativo Fazenda Digital nas lojas Apple App Store e Google Play Store.

---

## Pré-requisitos

Antes de iniciar o processo de deploy, certifique-se de ter:

| Item | Descrição | Custo |
|------|-----------|-------|
| Apple Developer Account | Conta de desenvolvedor Apple | US$ 99/ano |
| Google Play Console | Conta de desenvolvedor Google | US$ 25 (único) |
| EAS CLI | Ferramenta de build do Expo | Gratuito |
| Expo Account | Conta no Expo.dev | Gratuito |
| Certificados iOS | Gerados automaticamente pelo EAS | Incluído |
| Keystore Android | Gerado automaticamente pelo EAS | Incluído |

---

## Etapa 1: Preparar o Projeto

### 1.1 Instalar EAS CLI

Abra o terminal e execute:

```bash
npm install -g eas-cli
eas login
```

### 1.2 Configurar o Projeto para Build

No diretório do projeto, execute:

```bash
eas build:configure
```

Isso criará o arquivo `eas.json` com as configurações de build.

### 1.3 Atualizar app.config.ts

Verifique se as seguintes informações estão corretas:

```typescript
const config: ExpoConfig = {
  name: "Fazenda Digital",           // Nome que aparece na App Store
  slug: "fazenda-digital-app",       // Identificador único
  version: "3.0.0",                  // Versão do app
  ios: {
    bundleIdentifier: "com.suaempresa.fazendadigital",
    supportsTablet: true,
    buildNumber: "1",                // Incrementar a cada build
  },
  android: {
    package: "com.suaempresa.fazendadigital",
    versionCode: 1,                  // Incrementar a cada build
  },
};
```

### 1.4 Configurar eas.json

Edite o arquivo `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "seu@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## Etapa 2: Build para iOS (App Store)

### 2.1 Criar Build de Produção

Execute o comando:

```bash
eas build --platform ios --profile production
```

O EAS irá:
1. Solicitar login na sua conta Apple Developer
2. Gerar certificados automaticamente
3. Compilar o app na nuvem
4. Disponibilizar o arquivo .ipa para download

**Tempo estimado:** 15-30 minutos

### 2.2 Configurar App Store Connect

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Clique em **"My Apps"** → **"+"** → **"New App"**
3. Preencha as informações:

| Campo | Valor |
|-------|-------|
| Platform | iOS |
| Name | Fazenda Digital |
| Primary Language | Portuguese (Brazil) |
| Bundle ID | com.suaempresa.fazendadigital |
| SKU | fazendadigital2026 |

### 2.3 Preparar Metadados

Você precisará fornecer:

**Descrição do App (até 4000 caracteres):**
```
Fazenda Digital é o aplicativo mais completo para gestão pecuária do Brasil. 
Desenvolvido para pecuaristas de todos os portes, oferece controle total do 
seu rebanho na palma da mão.

FUNCIONALIDADES PRINCIPAIS:
• Gestão completa do rebanho (cadastro, pesagem, categorização)
• Controle de vendas com cálculo automático de arrobas
• Gestão de custos por categoria
• Relatórios detalhados (inventário, vendas, custos, desempenho)
• Calculadora pecuária (GMD, conversão alimentar, projeções)
• Sistema de lembretes para vacinação e manejo
• Autenticação biométrica para segurança
• Funciona 100% offline

DIFERENCIAIS:
• Interface intuitiva e profissional
• Dados seguros no seu dispositivo
• Sem necessidade de internet para uso diário
• Suporte técnico especializado

Ideal para fazendas de corte, leite ou produção mista.
```

**Palavras-chave:**
```
pecuária, fazenda, gado, boi, rebanho, arroba, gestão rural, agropecuária, 
nelore, angus, controle de gado, venda de gado
```

**Screenshots necessários:**
- iPhone 6.5" (1284 x 2778 px) - 3 a 10 imagens
- iPhone 5.5" (1242 x 2208 px) - 3 a 10 imagens
- iPad Pro 12.9" (2048 x 2732 px) - opcional

### 2.4 Enviar para Revisão

```bash
eas submit --platform ios --profile production
```

Ou faça upload manual pelo Transporter (app da Apple).

**Tempo de revisão:** 24-48 horas (primeira vez pode levar mais)

---

## Etapa 3: Build para Android (Google Play)

### 3.1 Criar Build de Produção

Execute o comando:

```bash
eas build --platform android --profile production
```

O EAS irá:
1. Gerar keystore automaticamente (guarde bem!)
2. Compilar o app na nuvem
3. Disponibilizar o arquivo .aab para download

**Tempo estimado:** 10-20 minutos

### 3.2 Configurar Google Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Clique em **"Create app"**
3. Preencha as informações:

| Campo | Valor |
|-------|-------|
| App name | Fazenda Digital |
| Default language | Portuguese (Brazil) |
| App or game | App |
| Free or paid | Free (ou Paid) |

### 3.3 Configurar Ficha da Loja

**Descrição curta (até 80 caracteres):**
```
Gestão pecuária completa: rebanho, vendas, custos e relatórios.
```

**Descrição completa (até 4000 caracteres):**
```
Fazenda Digital é o aplicativo de gestão pecuária mais completo do Brasil, 
desenvolvido especialmente para pecuaristas que buscam produtividade e 
controle total do seu negócio.

🐂 GESTÃO DO REBANHO
• Cadastre todos os seus animais com foto
• Organize por categoria, raça e lote
• Acompanhe o peso e status de saúde
• Filtros inteligentes para localização rápida

💰 CONTROLE DE VENDAS
• Registre vendas com cálculo automático de arrobas
• Selecione múltiplos animais por venda
• Histórico completo de transações
• Identifique seus melhores compradores

📊 GESTÃO DE CUSTOS
• Categorize despesas (alimentação, veterinário, manutenção)
• Acompanhe o custo por cabeça
• Visualize a rentabilidade do negócio

📈 RELATÓRIOS PROFISSIONAIS
• Inventário completo do rebanho
• Análise de vendas por período
• Custos detalhados por categoria
• Indicadores de desempenho (GMD, conversão)

🔧 CALCULADORA PECUÁRIA
• Conversão kg para arrobas
• Cálculo de GMD (Ganho Médio Diário)
• Projeção de peso futuro
• Valor estimado do animal

🔔 LEMBRETES DE MANEJO
• Vacinação
• Vermifugação
• Pesagem periódica

🔐 SEGURANÇA
• Autenticação biométrica (Face ID / Fingerprint)
• Dados armazenados localmente no dispositivo
• Funciona 100% offline

Desenvolvido por pecuaristas, para pecuaristas. Baixe agora e transforme 
a gestão da sua fazenda!
```

### 3.4 Criar Service Account (para submissão automática)

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou use existente
3. Ative a API do Google Play Developer
4. Crie uma Service Account com permissão de "Release Manager"
5. Baixe o arquivo JSON e salve como `google-service-account.json`

### 3.5 Enviar para Revisão

```bash
eas submit --platform android --profile production
```

**Tempo de revisão:** 1-7 dias (primeira vez pode levar mais)

---

## Etapa 4: Integração com Firebase (Opcional)

Se você deseja sincronizar dados com Firebase:

### 4.1 Configurar Firebase no Projeto

```bash
npm install firebase
```

### 4.2 Criar arquivo de configuração

Crie `lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 4.3 Sincronizar Dados

Adicione no `auth-context.tsx` após cadastro:

```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Após cadastro bem-sucedido:
await setDoc(doc(db, 'usuarios', novoUsuario.id), {
  ...novoUsuario,
  status: 'trial',
  plano: 'free',
});
```

---

## Etapa 5: Manutenção e Atualizações

### 5.1 Publicar Atualizações OTA (Over-the-Air)

Para atualizações que não alteram código nativo:

```bash
eas update --branch production --message "Correção de bugs"
```

### 5.2 Nova Versão na Loja

Para atualizações com mudanças nativas:

1. Incremente a versão em `app.config.ts`
2. Execute novo build: `eas build --platform all --profile production`
3. Submeta: `eas submit --platform all --profile production`

### 5.3 Monitoramento

- Use **Firebase Crashlytics** para erros
- Use **Firebase Analytics** para métricas
- Monitore reviews nas lojas

---

## Checklist Final

Antes de submeter, verifique:

- [ ] Versão e build number atualizados
- [ ] Ícone do app em todas as resoluções
- [ ] Splash screen configurada
- [ ] Screenshots para todas as dimensões
- [ ] Descrição e palavras-chave otimizadas
- [ ] Política de privacidade publicada
- [ ] Termos de uso publicados
- [ ] Testado em dispositivos reais
- [ ] Todos os botões funcionando
- [ ] Relatórios gerando corretamente
- [ ] Login/cadastro funcionando
- [ ] Biometria funcionando

---

## Custos Estimados

| Item | Custo | Frequência |
|------|-------|------------|
| Apple Developer | US$ 99 | Anual |
| Google Play | US$ 25 | Único |
| EAS Build (Free tier) | Gratuito | 30 builds/mês |
| EAS Build (Production) | US$ 99/mês | Se precisar mais |
| Firebase (Spark) | Gratuito | Até limites |
| Firebase (Blaze) | Pay as you go | Conforme uso |

---

## Suporte

Em caso de dúvidas durante o processo:

- **Documentação Expo:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction
- **App Store Connect:** https://developer.apple.com/app-store-connect
- **Google Play Console:** https://support.google.com/googleplay/android-developer

---

*Documento atualizado em Janeiro de 2026*
*Fazenda Digital v3.0.0*
