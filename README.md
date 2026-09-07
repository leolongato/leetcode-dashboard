# LC Tracker

A personal dashboard for tracking LeetCode practice. The app centralizes your problem history, lets you record the outcome of each attempt, and maintains a queue of problems to solve next.

The project is built with React, TypeScript, Vite, Tailwind CSS, custom components inspired by shadcn/ui, and Excalidraw.

## Features

### Problems

- Add problems using a URL or title.
- Automatically fill in the title from LeetCode URLs.
- Classify problems as easy, medium, or hard.
- Record the result as solved, solved with help, or not solved.
- Add topic tags such as Array, Graph, Dynamic Programming, and Binary Search.
- Add notes and mark problems for later review.
- Search by title or tags.
- Filter by difficulty and status.
- Sort by date, difficulty, or title.
- Edit, delete, and view problem notes.
- Track solved problems, problems solved with help, unsolved problems, and success rate.

### To-do

Maintain a queue of problems you want to solve. You can add items individually, import multiple titles at once, and turn a queued item into a recorded problem.

### Review

Displays only the problems marked for review, making it easier to revisit important exercises or topics that need more practice.

### Draw

Opens an Excalidraw canvas for sketching algorithms, data structures, flows, and study ideas.

### Import and export

Use the import and export controls in the Problems tab to move your records between environments or create a local JSON backup.

## Data persistence

The app supports two modes:

- **Without Firebase:** data is stored in the browser's `localStorage`. This works immediately for local development and personal use, but the data remains limited to the current browser and device.
- **With Firebase:** when all environment variables are configured, the app uses Google Authentication and Cloud Firestore. Each user can access only their own problems and to-do items.

## Requirements

- Node.js 22 or newer is recommended.
- npm.
- A Google account and Firebase project only if you want cloud persistence and authentication.

## Local setup

Clone the repository, install the dependencies, and start the development server:

```bash
git clone https://github.com/leolongato/leetcode-dashboard.git
cd leetcode-dashboard
npm install
npm run dev
```

Vite will display the local address in the terminal, usually `http://localhost:5173`.

### Optional Firebase setup

Without this configuration, the app uses `localStorage`. To enable Google sign-in and Firestore:

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a Web app and copy the displayed credentials.
3. Enable the **Google** provider under **Authentication → Sign-in method**.
4. Create a **Cloud Firestore** database.
5. Publish the rules from [`firestore.rules`](firestore.rules).
6. Create a `.env.local` file in the project root based on [`.env.example`](.env.example):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Restart Vite after creating or changing the environment file. Do not commit `.env.local`.

To test sign-in in production, add the published site's domain under **Authentication → Settings → Authorized domains** in Firebase.

## Available scripts

```bash
npm run dev       # start the development server
npm run build     # check types and generate dist/
npm run preview   # serve the production build locally
npm run lint      # run ESLint
npm run typecheck # run the TypeScript check only
npm run format    # format TypeScript files
```

Before publishing, validate the project with:

```bash
npm run lint
npm run build
```

## GitHub Pages deployment

The [`deploy.yml`](.github/workflows/deploy.yml) workflow automatically publishes the app whenever code is pushed to the `main` branch.

1. Create a GitHub repository named `leetcode-dashboard` and push the code to the `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Under **Settings → Secrets and variables → Actions**, add these repository secrets if Firebase is configured:

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

5. Push the changes:

```bash
git add .
git commit -m "Deploy application"
git push origin main
```

After the workflow completes, the application will be available at:

```text
https://leolongato.github.io/leetcode-dashboard/
```

The `vite.config.ts` file already sets `/leetcode-dashboard/` as the base path during GitHub Actions builds. If the repository has a different name, update that value before publishing. The `VITE_*` variables are injected into the build by the workflow; application data remains protected by Firestore rules and authentication.

## Main structure

```text
src/
├── components/       # layout, navigation, and UI components
├── components/tabs/  # Problems, To-do, Review, and Excalidraw screens
├── lib/firebase.ts   # optional Firebase initialization
├── services/         # problem and to-do data access
├── App.tsx           # main application state and flows
└── types.ts          # domain types
```
