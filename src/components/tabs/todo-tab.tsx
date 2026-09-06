import type { Dispatch, FormEvent, SetStateAction } from "react"
import { TodoPanel } from "@/components/dashboard"
import type { ProblemInput, Todo } from "@/types"

export function TodoTab({
  todos,
  bulk,
  bulkText,
  setBulk,
  setBulkText,
  addTodo,
  addBulk,
  removeTodo,
  openNew,
}: {
  todos: Todo[]
  bulk: boolean
  bulkText: string
  setBulk: Dispatch<SetStateAction<boolean>>
  setBulkText: Dispatch<SetStateAction<string>>
  addTodo: (event: FormEvent<HTMLFormElement>) => void
  addBulk: (event: FormEvent) => void
  removeTodo: (id: string) => void
  openNew: (prefill?: Partial<ProblemInput>, todoId?: string) => void
}) {
  return (
    <TodoPanel
      todos={todos}
      bulk={bulk}
      bulkText={bulkText}
      setBulk={setBulk}
      setBulkText={setBulkText}
      onAdd={addTodo}
      onBulk={addBulk}
      onRemove={(id) => void removeTodo(id)}
      onTry={(todo) => {
        openNew({ url: todo.url, title: todo.title }, todo.id)
      }}
    />
  )
}
