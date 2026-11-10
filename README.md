# Monitoramento Postural Mobile

[![React Native](https://img.shields.io/badge/React_Native-0.86.3-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=222222)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Plataformas](https://img.shields.io/badge/Plataformas-Android%20%7C%20iOS-3DDC84)](https://expo.dev/)

Aplicativo móvel para captura e exportação de dados de movimentação cervical, desenvolvido como projeto de estágio obrigatório do curso de Ciência da Computação da PUC Minas, em caráter interdisciplinar com alunos de Fisioterapia da UNESP.

- **Desenvolvedor:** Gustavo Jacó
- **Professor orientador:** Will Ricardo dos Santos Machado
- **Colaboração interdisciplinar:** alunos de Fisioterapia UNESP

---

## Sobre o projeto

A avaliação do equilíbrio pode envolver a observação dos movimentos da cabeça durante uma tarefa clínica. Este projeto explora o uso do giroscópio de um smartphone para registrar a movimentação cervical de pessoas idosas e gerar telemetria que possa ser analisada posteriormente pela equipe de Fisioterapia.

O aplicativo oferece um fluxo para identificar cada coleta, iniciar e encerrar a avaliação, salvar o histórico localmente no dispositivo e exportar as leituras em uma planilha Excel compartilhável. A ferramenta é um apoio à coleta de dados e **não substitui uma avaliação clínica nem fornece diagnóstico**.

## Funcionalidades

- Interface minimalista e de alto contraste, com botão central grande e texto legível, pensada para facilitar o uso por pessoas idosas.
- Um beep a cada segundo durante a contagem regressiva visual de três segundos.
- Beep diferente para indicar o começo da captura estática e um beep por segundo durante os cinco segundos parado.
- Registro da fase estática durante os primeiros cinco segundos da captura.
- Beep duplo diferente ao fim da fase estática e aviso para começar a andar.
- Captura contínua dos eixos X, Y e Z do giroscópio, com intervalo configurado de 50 ms.
- Registro do tempo decorrido, em milissegundos, e da fase (`Estatico` ou `Dinamico`) em cada leitura.
- Formulário de identificação com nome, CPF/RG opcional, tipo de teste e tempo opcional de coleta.
- Classificação da coleta como `Padrão` (modelo de treinamento) ou `Avaliação`.
- Histórico persistente no dispositivo, com data e hora, identificação, leituras e métricas; contador de coletas na tela inicial.
- Tela de avaliações salvas com duração, contagem por fase, métricas, gráficos e exportação XLSX/CSV por coleta.
- Edição de nome e CPF/RG, exclusão individual protegida por senha e limpeza geral do histórico na tela de avaliações salvas.
- Limpeza do histórico protegida por confirmação de senha do administrador.
- Encerramento automático da coleta quando o tempo informado no formulário expira; sem tempo informado, o encerramento é manual.
- Exportação e compartilhamento de arquivos Excel (`.xlsx`) e CSV pela interface nativa do celular.
- Exibição imediata no app de gráficos do movimento registrado, com resumo da duração e das leituras por fase.
- Gráfico temporal dos três eixos e dispersão X × Y, com fases estática e dinâmica destacadas.
- Suavização EMA dos dados exibidos e métricas RMS dos eixos configurados, calculadas somente na fase dinâmica.
- Verificação da disponibilidade do giroscópio antes de iniciar a avaliação.
- Script Python para calibrar os eixos pela fase estática, aplicar filtro Butterworth e gerar gráficos.

## Tecnologias utilizadas

- [React Native](https://reactnative.dev/) — interface móvel.
- [Expo SDK 57](https://expo.dev/) — ferramentas e módulos nativos.
- [Expo Sensors](https://docs.expo.dev/versions/v57.0.0/sdk/sensors/) — leitura do giroscópio.
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — armazenamento local persistente das coletas.
- [Expo Audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/) — reprodução dos sinais sonoros.
- [Expo FileSystem](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/) — gravação temporária da planilha.
- [Expo Sharing](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/) — compartilhamento nativo do arquivo.
- [SheetJS (`xlsx`)](https://www.npmjs.com/package/xlsx) — criação da planilha Excel.
- [React Native Safe Area Context](https://github.com/AppAndFlow/react-native-safe-area-context) — adaptação às áreas seguras da tela.
- Python, [pandas](https://pandas.pydata.org/), [SciPy](https://scipy.org/) e [Matplotlib](https://matplotlib.org/) — processamento e visualização dos dados exportados.

## Estrutura do app e Expo Go

O ponto de entrada `App.js` na raiz reexporta a tela principal de `src/react-native/screens/HomeScreen.js`. Componentes reutilizáveis ficam em `src/react-native/components/`, e o acesso ao AsyncStorage fica em `src/react-native/utils/collectionStorage.js`. A tela importa esses módulos com caminhos relativos, por exemplo `../components/AdminPasswordModal` e `../utils/collectionStorage`.

O app usa módulos Expo e React Native compatíveis com Expo Go, incluindo AsyncStorage, sensores, áudio, compartilhamento, SVG e armazenamento de arquivos; não foi adicionado código nativo personalizado. A disponibilidade do giroscópio depende do dispositivo iOS.

## Limpeza do histórico

Na tela **Avaliações Salvas**, é possível editar o nome e o CPF/RG associados a uma coleta. A exclusão individual e o botão **Limpar todo o histórico**, ao final da lista, solicitam a senha de administrador `123456`; o contador da tela inicial é atualizado após exclusões. Essa senha está fixa no código do aplicativo e serve apenas como barreira operacional: não é um mecanismo de segurança forte, pois pode ser descoberta por quem inspecionar o app instalado.

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
2. Preencha o nome e o tipo de teste. CPF/RG é opcional; informe um tempo em segundos para limitar a coleta ou deixe o campo vazio para encerrá-la manualmente. Use a chave para selecionar `Padrão` ou `Avaliação`.
3. Toque em **Iniciar Avaliação**. O aplicativo registra a data e hora de início, verifica o giroscópio e inicia a contagem regressiva com um beep em cada segundo: **3, 2, 1**.
4. Ao fim do preparo, um beep de tom diferente indica o começo da captura estática. Mantenha-se parado e posicione o dispositivo conforme orientação durante cinco segundos; a tela mostra **5, 4, 3, 2, 1** e toca um beep a cada segundo. As leituras são identificadas como `Estatico`.
5. Ao completar os cinco segundos, um beep duplo diferente sinaliza a transição, o app exibe **Pode Andar** e continua a coleta, identificando as leituras seguintes como `Dinamico`.
6. Toque em **Parar Avaliação** quando a coleta dinâmica terminar; se informou um tempo, a captura encerra automaticamente após esse período de gravação. Os gráficos e o resumo ficam disponíveis no aplicativo, e a coleta concluída é salva no histórico local.
7. O menu nativo de compartilhamento da planilha `.xlsx` é aberto ao encerrar a coleta. Na tela de resultados, use **Exportar XLSX** ou **Exportar CSV** para compartilhar qualquer formato novamente, ou inicie uma nova avaliação. O CSV inclui a identificação do indivíduo e cada leitura do giroscópio. Na tela inicial, **Histórico de Avaliações** abre as coletas salvas, com opção de rever os gráficos e métricas, editar o nome e o CPF/RG, ou exportar cada coleta em XLSX/CSV. A exclusão individual e **Limpar todo o histórico** solicitam a senha administrativa `123456`. A tela inicial também mostra a quantidade de coletas armazenadas no dispositivo.

O histórico é mantido localmente pelo AsyncStorage e não é sincronizado com um servidor. O AsyncStorage não criptografa os dados; considere essa característica ao registrar informações pessoais identificáveis.

Os gráficos do app mostram os eixos do giroscópio ao longo do tempo e a dispersão dos eixos laterais e anteroposteriores, com a média da fase estática removida e uma suavização EMA de 3 Hz aplicada para visualização e cálculo das métricas. Os eixos do estabilograma podem ser alterados pelas constantes `EIXO_LATERAL` e `EIXO_ANTERO_POSTERIOR` no início de `App.js`. A tela informa duração, leituras por fase e RMS dinâmico dos eixos X/Y. Os resultados também incluem a área da elipse de confiança de 95% X/Y, o jerk médio absoluto tridimensional e a velocidade média da trajetória angular X/Y. A área da elipse usa a aproximação qui-quadrado de 5,991 para uma distribuição bivariada aproximadamente normal; o jerk deriva a velocidade angular duas vezes usando os timestamps; e a velocidade é o comprimento da trajetória X/Y do giroscópio dividido pelo tempo da fase dinâmica. As unidades são, respectivamente, (rad/s)², rad/s³ e rad/s².

As exportações XLSX e CSV compartilham os mesmos cabeçalhos, metadados do indivíduo e do teste, leituras originais sem suavização e fases (`Estático`/`Dinâmico`). No XLSX, esses dados ficam na aba `Avaliação` e as métricas na aba `Resumo`; no CSV, as mesmas métricas aparecem na seção `Resumo`, antes da seção `Avaliação` com os dados linha a linha. A transição de fase é determinada pelo tempo decorrido de cada leitura; o intervalo de atualização é configurado para 50 ms, embora a frequência efetiva possa variar conforme o dispositivo.

Essas métricas descrevem o movimento angular registrado pelo celular e não representam uma medição direta do centro de pressão ou do equilíbrio corporal, nem fornecem diagnóstico. Sua interpretação clínica deve ser feita por profissionais qualificados.

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

---

Este aplicativo registra dados de movimento para análise externa. A interpretação dos resultados deve ser realizada por profissionais qualificados, no contexto de uma avaliação clínica.
