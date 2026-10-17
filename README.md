# Monitoramento Postural Mobile

[![React Native](https://img.shields.io/badge/React_Native-0.86.3-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=222222)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Plataformas](https://img.shields.io/badge/Plataformas-Android%20%7C%20iOS-3DDC84)](https://expo.dev/)

Aplicativo móvel para captura e exportação de dados de movimentação cervical, desenvolvido como projeto de estágio obrigatório do curso de Ciência da Computação da PUC Minas, em caráter interdisciplinar com alunos de Fisioterapia.

## Sobre o projeto

A avaliação do equilíbrio pode envolver a observação dos movimentos da cabeça durante uma tarefa clínica. Este projeto explora o uso do giroscópio de um smartphone para registrar a movimentação cervical de pessoas idosas e gerar telemetria que possa ser analisada posteriormente pela equipe de Fisioterapia.

O aplicativo oferece um fluxo simples para iniciar e encerrar a coleta, armazena as leituras durante a avaliação e as exporta em uma planilha Excel compartilhável. A ferramenta é um apoio à coleta de dados e **não substitui uma avaliação clínica nem fornece diagnóstico**.

## Funcionalidades

- Interface minimalista e de alto contraste, com botão central grande e texto legível, pensada para facilitar o uso por pessoas idosas.
- Beep de preparação e contagem regressiva visual de três segundos antes da coleta.
- Beep distinto no início da contagem e no início da captura.
- Captura contínua dos eixos X, Y e Z do giroscópio, com intervalo configurado de 50 ms.
- Registro do tempo decorrido, em milissegundos, para cada leitura.
- Geração automática de planilha Excel (`.xlsx`) ao encerrar a avaliação.
- Compartilhamento do arquivo pela interface nativa do celular, para envio ou análise externa.
- Verificação da disponibilidade do giroscópio antes de iniciar a avaliação.

## Tecnologias utilizadas

- [React Native](https://reactnative.dev/) — interface móvel.
- [Expo SDK 57](https://expo.dev/) — ferramentas e módulos nativos.
- [Expo Sensors](https://docs.expo.dev/versions/v57.0.0/sdk/sensors/) — leitura do giroscópio.
- [Expo Audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/) — reprodução dos sinais sonoros.
- [Expo FileSystem](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/) — gravação temporária da planilha.
- [Expo Sharing](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/) — compartilhamento nativo do arquivo.
- [SheetJS (`xlsx`)](https://www.npmjs.com/package/xlsx) — criação da planilha Excel.
- [React Native Safe Area Context](https://github.com/AppAndFlow/react-native-safe-area-context) — adaptação às áreas seguras da tela.

## Pré-requisitos e instalação

Você precisará de:

- [Node.js LTS](https://nodejs.org/) e npm.
- Um smartphone Android ou iOS com giroscópio para realizar uma avaliação.
- O aplicativo Expo Go compatível com o SDK do projeto, ou um ambiente de desenvolvimento Expo configurado.
- Git para clonar o repositório.

Clone o projeto e instale as dependências:

```bash
git clone https://github.com/JacoGus/monitoramento-postural-mobile.git
cd monitoramento-postural-mobile
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npx expo start
```

Para limpar o cache do Metro, se necessário:

```bash
npx expo start -c
```

Com o servidor iniciado, abra o projeto no Expo Go ou use o QR code exibido no terminal. Para uma captura real, utilize um dispositivo com giroscópio; o suporte a sensores pode variar entre dispositivos e emuladores.

## Como usar

1. Abra o aplicativo e posicione o celular conforme a orientação do profissional responsável pela avaliação.
2. Toque em **Iniciar Avaliação**. O aplicativo verifica se o giroscópio está disponível e emite o primeiro beep.
3. Acompanhe a contagem regressiva visual: **3, 2, 1**.
4. Ao final da contagem, um segundo beep sinaliza o início da captura. A coleta dos eixos do giroscópio começa, e o botão passa a exibir **Parar Avaliação**.
5. Toque em **Parar Avaliação** quando a coleta terminar.
6. O aplicativo gera a planilha `.xlsx` e abre o menu nativo de compartilhamento para que o arquivo possa ser enviado ou aberto em outro aplicativo.

A planilha contém o tempo decorrido da leitura, em milissegundos, e os valores dos eixos X, Y e Z do giroscópio. O intervalo de atualização é configurado para 50 ms; a frequência efetiva pode variar conforme o dispositivo.

## Equipe e créditos

Projeto de estágio obrigatório do curso de Ciência da Computação da PUC Minas, desenvolvido em caráter interdisciplinar com alunos de Fisioterapia.

- **Desenvolvedor:** Gustavo Jacó
- **Professor orientador:** Will Machado
- **Colaboração interdisciplinar:** alunos de Fisioterapia

---

Este aplicativo registra dados de movimento para análise externa. A interpretação dos resultados deve ser realizada por profissionais qualificados, no contexto de uma avaliação clínica.
