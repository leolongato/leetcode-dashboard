import { initializeApp, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const values = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled = Object.values(values).every(Boolean)
let app: FirebaseApp | undefined
let db: Firestore | undefined
export let auth: ReturnType<typeof getAuth> | undefined

if (firebaseEnabled) {
  app = initializeApp(values)
  db = getFirestore(app)
  auth = getAuth(app)
}

export function signInWithGoogle() {
  if (!auth) throw new Error("Firebase não está configurado.")
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export function signOutUser() {
  if (auth) return signOut(auth)
  return Promise.resolve()
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return auth ? onAuthStateChanged(auth, callback) : () => undefined
}

export { db }
