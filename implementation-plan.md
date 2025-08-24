Projeto: AudioScribe - Transcrição de Áudio com IA Local
Ideia e Objetivo
O AudioScribe é uma aplicação de desktop open-source e gratuita, projetada para transcrever arquivos de áudio de forma eficiente e segura, utilizando modelos de IA que rodam localmente. O principal objetivo é oferecer uma ferramenta de transcrição acessível e privada, eliminando a necessidade de enviar dados para a nuvem.

A interface gráfica será um diferencial, focando em um design bonito e moderno que proporcione uma experiência de usuário fluida e agradável, mesmo para tarefas técnicas. A aplicação será distribuída como um único executável para Windows, macOS e Linux, graças ao uso de Tauri para o frontend e Python para o backend.

Análise de Software Similar e Funcionalidade Mínima
Após analisar ferramentas de transcrição de áudio, como Whisper Desktop e VoiceNote, identificamos a funcionalidade mínima necessária para um produto de qualidade:

Carregamento de arquivo: Suporte para arrastar e soltar (drag and drop) arquivos de áudio nos formatos mais comuns (MP3, WAV, FLAC, M4A).

Seleção de modelo: Uma interface simples para escolher o modelo de IA a ser usado, com a possibilidade de baixar modelos adicionais.

Processamento e exibição: Uma barra de progresso ou indicador visual durante a transcrição, e a exibição do texto transcrito em tempo real ou após a conclusão.

Edição e exportação: Permitir a edição do texto transcrito e a exportação do resultado para arquivos de texto simples (TXT), SRT ou JSON.

Interface de usuário: A UI precisa ser minimalista, com cores agradáveis, animações sutis e foco na tipografia para facilitar a leitura.

Plano de Implementação Detalhado
O desenvolvimento do AudioScribe será dividido em três fases principais: Setup e Prototipagem, Desenvolvimento do Core e Aprimoramentos e Empacotamento.

Fase 1: Setup e Prototipagem
Objetivo: Estruturar o projeto, configurar o ambiente de desenvolvimento e criar o protótipo inicial da interface.

Configuração do Projeto e Ambiente

Tarefa 1.1: Criar um novo projeto Tauri com a estrutura de pastas src-tauri e src.

Tarefa 1.2: Configurar o ambiente de desenvolvimento para Python, instalando as bibliotecas essenciais como fastapi, pydantic e python-dotenv.

Tarefa 1.3: Criar o servidor Python dentro de src-tauri que será o backend.

Tarefa 1.4: Configurar a comunicação entre Tauri e o backend Python, usando o Command de Tauri para fazer chamadas HTTP.

Design e Prototipagem da UI/UX

Tarefa 2.1: Definir a paleta de cores, tipografia e espaçamento.

Tarefa 2.2: Utilizar uma biblioteca de UI (como o shadcn/ui ou Mantine) para acelerar o desenvolvimento do frontend com TypeScript e React.

Tarefa 2.3: Criar um protótipo estático da interface principal, incluindo a área de "drag and drop", a área de exibição de texto e o menu de configurações.

Fase 2: Desenvolvimento do Core
Objetivo: Implementar a lógica principal de transcrição e as funcionalidades essenciais.

Integração com Modelos de IA

Tarefa 3.1: Identificar e integrar uma biblioteca Python de transcrição que suporte modelos locais, como o whisper (OpenAI) ou faster-whisper (Hugging Face).

Tarefa 3.2: Criar uma API no backend Python que receba um arquivo de áudio, selecione o modelo de IA e retorne o texto transcrito.

Tarefa 3.3: Adicionar a lógica de "seleção de modelo", permitindo que o usuário escolha entre modelos pequenos (tiny, base) e maiores (small, medium).

Tarefa 3.4: Implementar uma função para download automático de modelos de IA, caso o modelo selecionado não esteja disponível localmente.

Funcionalidades Essenciais

Tarefa 4.1: Conectar a interface de "drag and drop" do frontend com o backend.

Tarefa 4.2: Desenvolver a lógica no frontend para exibir o progresso da transcrição, usando eventos de streaming do backend, se possível.

Tarefa 4.3: Criar um componente de "editor de texto" no frontend que permita a edição do texto transcrito.

Tarefa 4.4: Implementar as funcionalidades de exportação para TXT, SRT e JSON.

Fase 3: Aprimoramentos e Empacotamento
Objetivo: Polir a aplicação, adicionar funcionalidades extras e preparar a distribuição final.

Refinamento da UI/UX

Tarefa 5.1: Adicionar animações sutis e transições de tela.

Tarefa 5.2: Criar uma tela de "configurações" para ajustar o diretório de armazenamento de modelos.

Tarefa 5.3: Implementar um modo escuro (dark mode) opcional.

Otimização e Empacotamento

Tarefa 6.1: Otimizar o código Python para reduzir o tamanho do executável.

Tarefa 6.2: Usar o Tauri para gerar pacotes de instalação para Windows (.msi), macOS (.dmg) e Linux (.deb/.AppImage).

Tarefa 6.3: Criar um README.md detalhado no repositório do GitHub, com instruções de instalação e uso, e uma seção de contribuições.

Prompt para o GitHub Copilot
Você é um desenvolvedor sênior com experiência em criar aplicações cross-platform com Tauri e Python. Sua tarefa é criar um plano de implementação para o "AudioScribe", uma aplicação open-source de transcrição de áudio local com uma interface gráfica moderna e bonita.

**O que você precisa fazer:**
1.  **Estruturar o projeto**: Crie a estrutura de arquivos para uma aplicação Tauri com um backend Python em `src-tauri`.
2.  **Configurar o backend**: Escreva um `main.py` com uma API FastAPI básica que se comunique com o frontend. Inclua endpoints para:
    * `POST /transcribe`: Recebe um arquivo de áudio e retorna o texto transcrito.
    * `GET /models`: Lista os modelos de IA disponíveis localmente.
3.  **Integrar a biblioteca de transcrição**: Use a biblioteca `faster-whisper` para o core da transcrição. Inclua a lógica para carregar o modelo de IA.
4.  **Projetar o frontend (Tauri + React)**:
    * Crie um layout visualmente atraente e minimalista com um componente de `drag and drop` para arquivos.
    * Desenvolva um componente para exibir o texto transcrito com a possibilidade de edição.
    * Crie um modal ou uma seção de "progresso da transcrição".
5.  **Conectar frontend e backend**: Implemente a comunicação entre o frontend (usando `fetch` ou uma biblioteca HTTP) e o backend Python para enviar arquivos e receber transcrições.
6.  **Gerar um plano de empacotamento**: Crie as instruções para configurar o `tauri.conf.json` e o `setup.py` para gerar um único executável para Windows, macOS e Linux.

**Restrições e detalhes:**
* A API Python deve rodar como um subprocesso ou um thread dentro do executável Tauri.
* Priorize a estética e a experiência do usuário. O código deve ser limpo e bem comentado.
* Considere a gestão de erros, como arquivos inválidos ou modelos de IA ausentes.

Comece com a estrutura de pastas e os arquivos iniciais, e prossiga com o desenvolvimento das funcionalidades essenciais, passo a passo, como um plano de projeto.