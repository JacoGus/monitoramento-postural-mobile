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
- Um beep a cada segundo durante a contagem regressiva visual de três segundos.
- Beep diferente para indicar o começo dos cinco segundos de captura estática.
- Registro da fase estática durante os primeiros cinco segundos da captura.
- Beep duplo diferente ao fim da fase estática e aviso para começar a andar.
- Captura contínua dos eixos X, Y e Z do giroscópio, com intervalo configurado de 50 ms.
- Registro do tempo decorrido, em milissegundos, e da fase (`Estatico` ou `Dinamico`) em cada leitura.
- Geração automática de planilha Excel (`.xlsx`) ao encerrar a avaliação.
- Compartilhamento do arquivo pela interface nativa do celular, para envio ou análise externa.
- Exibição imediata no app de gráficos do movimento registrado, com resumo da duração e das leituras por fase.
- Gráfico temporal dos três eixos e dispersão X × Y, com fases estática e dinâmica destacadas.
- Verificação da disponibilidade do giroscópio antes de iniciar a avaliação.
- Script Python para calibrar os eixos pela fase estática, aplicar filtro Butterworth e gerar gráficos.

## Tecnologias utilizadas

- [React Native](https://reactnative.dev/) — interface móvel.
- [Expo SDK 57](https://expo.dev/) — ferramentas e módulos nativos.
- [Expo Sensors](https://docs.expo.dev/versions/v57.0.0/sdk/sensors/) — leitura do giroscópio.
- [Expo Audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/) — reprodução dos sinais sonoros.
- [Expo FileSystem](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/) — gravação temporária da planilha.
- [Expo Sharing](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/) — compartilhamento nativo do arquivo.
- [SheetJS (`xlsx`)](https://www.npmjs.com/package/xlsx) — criação da planilha Excel.
- [React Native Safe Area Context](https://github.com/AppAndFlow/react-native-safe-area-context) — adaptação às áreas seguras da tela.
- Python, [pandas](https://pandas.pydata.org/), [SciPy](https://scipy.org/) e [Matplotlib](https://matplotlib.org/) — processamento e visualização dos dados exportados.

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
2. Toque em **Iniciar Avaliação**. O aplicativo verifica o giroscópio e inicia a contagem regressiva com um beep em cada segundo: **3, 2, 1**.
3. Ao fim do preparo, um beep de tom diferente indica o começo da captura estática. Mantenha-se parado com o celular na cabeça durante cinco segundos; as leituras são identificadas como `Estatico`.
5. Ao completar os cinco segundos, um beep duplo diferente sinaliza a transição, o app exibe **Pode Andar** e continua a coleta, identificando as leituras seguintes como `Dinamico`.
6. Toque em **Parar Avaliação** quando a coleta dinâmica terminar. Os gráficos do movimento e o resumo da coleta ficam disponíveis diretamente no aplicativo.
7. A planilha `.xlsx` é gerada e o menu nativo de compartilhamento é aberto. Na tela de resultados, você também pode tocar em **Compartilhar Excel** novamente ou iniciar uma nova avaliação.

Os gráficos do app mostram os eixos do giroscópio ao longo do tempo e a dispersão X × Y, com a média da fase estática removida para facilitar a visualização. A tela também informa duração e contagem de leituras por fase. São visualizações da rotação do aparelho/cabeça, não uma medição direta do equilíbrio corporal ou um diagnóstico. A planilha contém `Tempo (ms)`, `Giroscópio X`, `Giroscópio Y`, `Giroscópio Z` e `Fase`. A transição de fase é determinada pelo tempo decorrido de cada leitura; o intervalo de atualização é configurado para 50 ms, embora a frequência efetiva possa variar conforme o dispositivo.

## Análise dos dados com Python

O script `analyze_equilibrio.py` lê a planilha exportada, separa as fases estática e dinâmica, calcula o offset de cada eixo usando a média da fase estática e aplica um filtro passa-baixa Butterworth de quarta ordem com corte em 5 Hz. Em seguida, salva `series_temporais.png` (com a transição de fase marcada) e `estabilograma.png` na pasta `analise_equilibrio`, ao lado da planilha.

Instale Python 3.10 ou superior e as dependências:

```bash
python -m venv .venv
```

Ative o ambiente virtual:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS ou Linux
source .venv/bin/activate
```

Instale as bibliotecas e execute a análise:

```bash
python -m pip install -r requirements.txt
python analyze_equilibrio.py caminho/para/avaliacao.xlsx
```

Para escolher outro diretório para as imagens:

```bash
python analyze_equilibrio.py caminho/para/avaliacao.xlsx --saida caminho/para/graficos
```

O filtro requer que a frequência de amostragem estimada a partir da coluna de tempo seja superior a 10 Hz. A taxa é estimada pela mediana dos intervalos entre amostras. Os gráficos representam a velocidade angular do giroscópio e servem como visualização da telemetria; não são uma medida clínica de centro de pressão nem fornecem diagnóstico.

## Equipe e créditos

Projeto de estágio obrigatório do curso de Ciência da Computação da PUC Minas, desenvolvido em caráter interdisciplinar com alunos de Fisioterapia.

- **Desenvolvedor:** Gustavo Jacó
- **Professor orientador:** Will Machado
- **Colaboração interdisciplinar:** alunos de Fisioterapia

---

Este aplicativo registra dados de movimento para análise externa. A interpretação dos resultados deve ser realizada por profissionais qualificados, no contexto de uma avaliação clínica.
