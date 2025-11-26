Projeto ChatWEB
    Programa de chat WEB, inspirado em Whatsapp/Mensseger/Telegram. 
    Utilizando Javascript, Node.js e REACT para desenvolvimento de front e backend. 
    Banco de dados FireBase, para armazenamento de login, dados de usuarios, conversas e mensagens. Banco Supabase para armazenamento de midia (arquivos, imagens, videos, etc). 


    - O projeto conta com os seguintes recursos:
        > Mensagens em tempo real
        > Envio de imagens, vídeos, áudios, PDFs e outros arquivos
        > Upload de avatar
        > Contatos e criação de grupos
        > Pesquisa de usuários
        > GIFs via API do Tenor
        > Emojis via Twemoji
        > Tela de perfil e edição
        > Confirmação de leitura e recebimento
        > Sistema de configurações (em desenvolvimento)
        > Sistema de personalização (em desenvolvimento)
        > Sistema de notificações (em desenvolvimento)
    
    ============================================================================================================================================================

    - Tecnologias utilizadas:
        > JavaScript, React, Node.js e Css
            Utilizando Node.js para utilziar o Javascript no backend e REACT para controle e configuração do frontend. Css para estilização.

        > Banco de dados
            > Firebase
                Banco de dados NoSQL do Google. Não possui tabelas e sim, coleções e campos e é dividido em vários setores. 
                A versão gratuita não permite guardar arquivos. 
                
                > Firebase Authentication
                    Banco de Authenticação do Firebase. Responsável por criar e armazenar o Login
                
                > Firebase Firestore
                    Banco de armazenamento do Firebase. Se integra com o Authentication para mostrar somente o permitido para cada user. 
                    Guarda todas as informações de perfil e cria rooms(salas/conversas) privadas ou em grupos, que armazena as mensagens de cada user e horário. 
                
                > Supabase Storage
                    Serviço de armazenamento em nuvem gratuito (versão gratuita suporta 1GB de arquivos) que utiliza PostgreSQL como núcleo. 
                    Neste caso, está integrado ao banco Firebase Storage para armazenar arquivos, como avatars de usuarios, imagens, videos e arquivos enviados em conversas, etc.
                    É utilizado uma API da própria Supabase para a conexão em tempo real, conexão com o firebase e serviços de protocolo RESTful.

        > APIs de Emojis (emoji-picker-react + Twemoji)
            > emoji-picker-react
                API que faz a integração com o programa emojiPicker. 
                Uma biblioteca online com diversos tipos de emoji e funcionalidades de navegação, pesquisa, filtro por tipo, seleção rápida, uso recente e personalização.
            > Twemoji
                Biblioteca de emojis de código aberto criada pelo X/Twitter para exibir emojis de forma padronizada entre dispositivos.

        > API Tenor (GIFs)
            Plataforma de busca por GIFs e banco de dados de GIFs animados, de propriedade do Google. 
            Utilizado integrado ao teclado no Android e IOS e utilizado no Whatsapp, Messenger, Discord, etc.
            Como o firebase e o tenor são desenvolvidos pela Google e são integrados ao Google Cloud, a mesma API Key pode ser utilizado para os dois.
        
        > Biblioteca axios 
            Biblioteca que permite e auxilia na integração de projetos REACT com qualquer serviço de API disponível.
    
    ============================================================================================================================================================

    - O que é necessário instalar para rodar o projeto:
        > Instalar Node.Js 
            https://nodejs.org/pt

        > Instalar API de integração com firebase  
            npm install firebase
        
        > Instalar API de integração com Supabase Storage
            npm install @supabase/supabase-js
        
        > Instalar API de Emoji - Emoji picker e twemoji 
            npm install emoji-picker-react@4.4.5
            npm install twemoji
        
        > Instalar API de Gifs - Tenor API e biblioteca Axios
            # biblioteca HTTP (pode usar fetch, mas axios facilita)
            npm install axios
    
        > Criar arquivo .env 
            Criar arquivo.env e manter na pasta do projeto, ele conterá as API Keys. Exemplo:
                REACT_APP_SUPABASE_URL=<sua_url>
                REACT_APP_SUPABASE_ANON_KEY=<sua_key>
                REACT_APP_TENOR_KEY=<sua_key>
        
        > Criar arquivo .gitnore
            Para dados sensíveis não serem postados no github. Exemplo:
                node_modules
                build/
                .env
                .env.local
                .env.development.local
                .env.test.local
                .env.production.local
                npm-debug.log*
                yarn-debug.log*
                yarn-error.log*

    ============================================================================================================================================================

    - Links de acesso
        > Acesso ao Firebase:
            https://console.firebase.google.com/u/1/project/chatweb-7ae93/authentication/users?hl=pt-br

        > Acesso ao Google Cloud:
            https://console.cloud.google.com/welcome?authuser=1&hl=pt-BR&project=chatweb-7ae93&supportedpurview=project,organizationId,folder

        > Acesso ao Supabase:
            https://supabase.com/dashboard/project/gfgnajdzbgotzjcmeany
    
        > Acesso ao Tenor:
            https://developers.google.com/tenor/guides/quickstart?hl=pt-br

    ============================================================================================================================================================

    - Como Executar o Projeto:
        Rodar no terminal: npm start
        Acesso em: http://localhost:3000/

    ============================================================================================================================================================

    - Estrutura do Projeto
        chat-firebase/
            node_modules/
            public/
            src/
            ├── js/
            │    ├── Firebase/
            │    │     └── FirebaseConfig.js
            │    ├── Supabase/
            │    │     ├── SupabaseConfig.js
            │    │     └── SupabaseUpload.js
            │    ├── Search/
            │    │     └── UseSearchUsers.js
            │    ├── Chat/
            │    │     ├── Emoji/
            │    │     │     ├── EmojiParser.js
            │    │     │     └── EmojiFallback.js
            │    │     ├── Gif/
            │    │     │     └── TenorApi.js
            │    │     ├── PrivateChat.helpers.js
            │    │     └── PrivateChat.media.js
            │    ├── Tests/
            │    │     └── SetupTests.js
            │    ├── WebVitals/
            │    │     └── ReportWebVitals.js
            │    └── App.js
            │
            ├── jsx/
            │    ├── Chat/
            │    │     ├── Contacts
            │    │     │    ├── Contacts.jsx
            │    │     │    └── UserList.jsx        
            │    │     ├── Emoji
            │    │     │    └── EmojiInput.jsx        
            │    │     ├── Gif
            │    │     │    └── GifSearchModal.jsx       
            │    │     ├── Group
            │    │     │    ├── CreateGroup.jsx
            │    │     │    └── GroupChat.jsx                
            │    │     ├── Private
            │    │     │    ├── PrivateChat.jsx
            │    │     │    └── PrivateChat.MessageComponents.jsx                
            │    ├── Profile/
            │    │     ├── Profile.jsx
            │    │     ├── ProfileView.jsx
            │    │     └── Avatar.jsx
            │    ├── Auth/
            │    │     ├── Login.jsx
            │    │     └── Register.jsx
            │    ├──  Settings/
            │    │     ├── SettingsContainer.jsx
            │    │     ├── SettingsMenuFloating.jsx
            │    │     ├── SettingsScreen.jsx
            │    │     └── Panels
            │    │          ├── DeleteAccountPanel.jsx
            │    │          ├── NotificationsPanel.jsx
            │    │          ├── PersonalizationPanel.jsx
            │    │          └── SecurityPanel.jsx
            │    │
            ├── css/
            │    ├── App.css
            │    └── Theme.css
            │
            ├── App.test.js
            ├── index.js
            ├── logo.svg
        .env
        .gitignore
        package-lock.json
        README.md
        UsersTeste.txt    
    
    ============================================================================================================================================================

    - O que ainda falta fazer:
        > Funcionalidades em desenvolvimento    
            Permitir Excluir conta
            Sistema completo de configurações
            Troca de tema (claro/escuro + temas WhatsApp/Telegram/Discord)
            Modo “Não Perturbe”
            Silenciar grupos e contatos
            Notificações Web Push
            Permitir alterar senha
            Papel de parede personalizado do chat
        
        > Funcionalidades menores
            Funcionalidades menores
            Melhorar sistema de preview de mídia
            Melhorar exibição de links no perfil
            Otimizar performance de Firestore (indexes)
        
        > Possíveis Melhorias Futuras
            Possíveis Melhorias Futuras
            Ligações/chamadas de áudio ou áudio e vídeo
            Mensagens de áudio em tempo real
            Criptografia ponta a ponta
            Envio de múltiplas mídias simultâneas
            Pastas para organizar conversas arquivadas
            Filtro de mensagens (não lidas, lidas, grupos, etc)
            Status (igual WhatsApp)
            Tradução automática de mensagens
            Plugins personalizáveis para grupos
            Versão PWA (instalável)







            

