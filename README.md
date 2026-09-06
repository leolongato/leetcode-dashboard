# LC Tracker

Dashboard pessoal para acompanhar a prática de problemas do LeetCode. O app centraliza o histórico de exercícios, permite registrar o resultado de cada tentativa e cria uma fila de problemas para resolver depois.

O projeto foi construído com React, TypeScript, Vite, Tailwind CSS, componentes próprios inspirados no shadcn/ui e Excalidraw.

## Funcionalidades

### Problemas

- Cadastro de problemas por URL ou título.
- Preenchimento automático do título a partir de URLs do LeetCode.
- Classificação por dificuldade: fácil, médio ou difícil.
- Registro do resultado: resolvido, com ajuda ou não resolvido.
- Tags de assuntos, como Array, Graph, Dynamic Programming e Binary Search.
- Anotações e marcação para revisão posterior.
- Busca por título ou tags.
- Filtros por dificuldade e status.
- Ordenação por data, dificuldade ou título.
- Edição, exclusão e visualização das anotações.
- Indicadores de problemas resolvidos, problemas com ajuda, problemas não resolvidos e taxa de acerto.

### A fazer

Mantenha uma fila de problemas que você pretende resolver. É possível adicionar itens individualmente, importar vários títulos de uma vez e transformar um item da fila em um problema registrado.

### Revisão

Exibe somente os problemas marcados com a opção de revisão, facilitando revisitar exercícios importantes ou que ainda precisam de prática.

### Desenhar

Abre um quadro Excalidraw para rascunhar algoritmos, estruturas de dados, fluxos e ideias durante os estudos.

### Importação e exportação

Na aba de problemas, use os controles de importação e exportação para transportar seus registros em formato JSON entre ambientes ou manter um backup local.

## Persistência dos dados

O app possui dois modos de funcionamento:

- **Sem Firebase:** os dados são salvos no `localStorage` do navegador. Esse modo funciona imediatamente para desenvolvimento e uso local, mas os dados ficam restritos ao navegador e ao dispositivo atual.
- **Com Firebase:** quando todas as variáveis de ambiente estão configuradas, o app usa autenticação Google e Cloud Firestore. Cada usuário acessa apenas os próprios problemas e itens da fila.

## Requisitos

- Node.js 22 ou superior recomendado.
- npm.
- Uma conta Google e um projeto Firebase apenas se você quiser persistência na nuvem e autenticação.

## Instalação e uso local

Clone o repositório, instale as dependências e inicie o servidor de desenvolvimento:

```bash
git clone https://github.com/SEU_USUARIO/leetcode-dashboard.git
cd leetcode-dashboard
npm install
npm run dev
```

O Vite exibirá o endereço local no terminal, normalmente `http://localhost:5173`.

### Configuração opcional do Firebase

Sem essa configuração, o app usa `localStorage`. Para ativar login Google e Firestore:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Registre uma aplicação Web e copie as credenciais exibidas.
3. Ative o provedor **Google** em **Authentication → Sign-in method**.
4. Crie um banco **Cloud Firestore**.
5. Publique as regras do arquivo [`firestore.rules`](firestore.rules).
6. Crie um arquivo `.env.local` na raiz, baseado em [`.env.example`](.env.example):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Reinicie o Vite depois de criar ou alterar o arquivo de ambiente. O arquivo `.env.local` não deve ser commitado.

Para testar o login em produção, adicione o domínio do site publicado em **Authentication → Settings → Authorized domains** no Firebase.

## Scripts disponíveis

```bash
npm run dev       # inicia o servidor de desenvolvimento
npm run build     # verifica os tipos e gera dist/
npm run preview   # serve o build localmente
npm run lint      # executa o ESLint
npm run typecheck # executa apenas a verificação TypeScript
npm run format    # formata arquivos TypeScript
```

Antes de publicar, valide o projeto com:

```bash
npm run lint
npm run build
```

## Publicação no GitHub Pages

O workflow [`deploy.yml`](.github/workflows/deploy.yml) publica automaticamente a aplicação a cada push na branch `main`.

1. Crie um repositório no GitHub chamado `leetcode-dashboard` e envie o código para a branch `main`.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment → Source**, selecione **GitHub Actions**.
4. Em **Settings → Secrets and variables → Actions**, adicione estes secrets caso o Firebase esteja configurado:

	- `VITE_FIREBASE_API_KEY`
	- `VITE_FIREBASE_AUTH_DOMAIN`
	- `VITE_FIREBASE_PROJECT_ID`
	- `VITE_FIREBASE_STORAGE_BUCKET`
	- `VITE_FIREBASE_MESSAGING_SENDER_ID`
	- `VITE_FIREBASE_APP_ID`

5. Faça o push:

```bash
git add .
git commit -m "Deploy application"
git push origin main
```

Depois que a action terminar, a aplicação estará disponível em:

```text
https://SEU_USUARIO.github.io/leetcode-dashboard/
```

O `vite.config.ts` já define o caminho base `/leetcode-dashboard/` durante o build do GitHub Actions. Se o repositório tiver outro nome, altere esse valor no arquivo antes de publicar. As variáveis `VITE_*` são injetadas no build pela action; os dados continuam protegidos pelas regras do Firestore e pela autenticação.

## Estrutura principal

```text
src/
├── components/       # layout, navegação e componentes de interface
├── components/tabs/  # telas de problemas, a fazer, revisão e Excalidraw
├── lib/firebase.ts   # inicialização opcional do Firebase
├── services/         # leitura e gravação de problemas e tarefas
├── App.tsx           # estado e fluxos principais da aplicação
└── types.ts          # tipos de domínio
```
