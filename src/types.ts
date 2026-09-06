export type Difficulty = "facil" | "medio" | "dificil"
export type ProblemStatus = "resolvido" | "ajuda" | "nao_resolvido"

export interface Problem {
  id: string
  url: string
  title: string
  difficulty: Difficulty
  status: ProblemStatus
  tags: string[]
  notes: string
  revisit: boolean
  createdAt: number
  userId?: string
}

export interface Todo {
  id: string
  url: string
  title: string
  createdAt: number
  userId?: string
}

export interface ProblemInput {
  url: string
  title: string
  difficulty: Difficulty
  status: ProblemStatus
  tags: string[]
  notes: string
  revisit: boolean
  createdAt?: number
}
