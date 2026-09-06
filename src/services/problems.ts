import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { Problem, ProblemInput, Todo } from "@/types"

const problemKey = "lc_tracker_problems_v1"
const todoKey = "lc_tracker_todos_v1"

function currentUserId() {
  const userId = auth?.currentUser?.uid
  if (!userId) throw new Error("Usuário não autenticado.")
  return userId
}

function localRead<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T[]) : []
  } catch {
    return []
  }
}

function localWrite<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
}

export async function getProblems() {
  if (!db) return localRead<Problem>(problemKey)
  const snapshot = await getDocs(
    query(collection(db, "problems"), where("userId", "==", currentUserId()))
  )
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as Problem
  )
}

export async function saveProblem(input: ProblemInput, id?: string) {
  const { createdAt, ...data } = input
  const problem: Problem = {
    ...data,
    id: id ?? uid(),
    createdAt: createdAt ?? Date.now(),
    userId: db ? currentUserId() : undefined,
  }
  if (db) {
    await setDoc(doc(db, "problems", problem.id), problem)
  } else
    localWrite(problemKey, [
      ...localRead<Problem>(problemKey).filter(
        (item) => item.id !== problem.id
      ),
      problem,
    ])
  return problem
}

export async function deleteProblem(id: string) {
  if (db) {
    await deleteDoc(doc(db, "problems", id))
  } else
    localWrite(
      problemKey,
      localRead<Problem>(problemKey).filter((item) => item.id !== id)
    )
}

export async function getTodos() {
  if (!db) return localRead<Todo>(todoKey)
  const snapshot = await getDocs(
    query(collection(db, "todos"), where("userId", "==", currentUserId()))
  )
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Todo)
}

export async function saveTodo(todo: Todo) {
  if (db) {
    await setDoc(doc(db, "todos", todo.id), {
      ...todo,
      userId: currentUserId(),
    })
  } else
    localWrite(todoKey, [
      ...localRead<Todo>(todoKey).filter((item) => item.id !== todo.id),
      todo,
    ])
}

export async function deleteTodo(id: string) {
  if (db) {
    await deleteDoc(doc(db, "todos", id))
  } else
    localWrite(
      todoKey,
      localRead<Todo>(todoKey).filter((item) => item.id !== id)
    )
}

export async function importProblems(problems: Problem[]) {
  const current = await getProblems()
  const existing = new Set(current.map((item) => item.id))
  const additions = problems.filter((item) => !existing.has(item.id))
  await Promise.all(additions.map((item) => saveProblem(item, item.id)))
  return [...current, ...additions]
}

export function uid() {
  return `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
