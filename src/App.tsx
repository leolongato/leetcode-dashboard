import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  PageHeader,
  ProblemFilters,
  ProblemTable,
  Sidebar,
  Stats,
  TodoPanel,
  type DashboardTab,
} from "@/components/dashboard"
import {
  firebaseEnabled,
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
} from "@/lib/firebase"
import {
  deleteProblem,
  deleteTodo,
  getProblems,
  getTodos,
  importProblems,
  saveProblem,
  saveTodo,
  uid,
} from "@/services/problems"
import type {
  Difficulty,
  Problem,
  ProblemInput,
  ProblemStatus,
  Todo,
} from "@/types"
import type { User } from "firebase/auth"

const tags = [
  "Array",
  "String",
  "Set",
  "Hash Table",
  "Two Pointers",
  "Sliding Window",
  "Linked List",
  "Stack",
  "Queue",
  "Tree",
  "Binary Search",
  "Graph",
  "DFS",
  "BFS",
  "Dijkstra",
  "Topological Sort",
  "Prefix",
  "Suffix",
  "Heap",
  "Backtracking",
  "Dynamic Programming",
  "Greedy",
  "Sorting",
  "Bit Manipulation",
  "Math",
  "Matrix",
  "Recursion",
  "Trie",
]
const difficultyLabel: Record<Difficulty, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
}
const statusLabel: Record<ProblemStatus, string> = {
  resolvido: "Resolvido",
  ajuda: "Com ajuda",
  nao_resolvido: "Não consegui",
}
const difficultyColor: Record<Difficulty, string> = {
  facil: "border-green-400/30 bg-green-400/10 text-green-400",
  medio: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
  dificil: "border-red-400/30 bg-red-400/10 text-red-400",
}
const statusColor: Record<ProblemStatus, string> = {
  resolvido: "border-green-400/30 bg-green-400/10 text-green-400",
  ajuda: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
  nao_resolvido: "border-red-400/30 bg-red-400/10 text-red-400",
}

function titleFromUrl(url: string) {
  const match = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i)
  return match
    ? match[1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : ""
}

function problemUrlFromTitle(title: string) {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug ? `https://leetcode.com/problems/${slug}/` : ""
}

function emptyInput(): ProblemInput {
  return {
    url: "",
    title: "",
    difficulty: "medio",
    status: "resolvido",
    tags: [],
    notes: "",
    revisit: false,
  }
}

function Modal({
  children,
  onClose,
}: {
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      {children}
    </div>
  )
}

export function App() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [authResolved, setAuthResolved] = useState(!firebaseEnabled)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [search, setSearch] = useState("")
  const [difficulty, setDifficulty] = useState("all")
  const [status, setStatus] = useState("all")
  const [sort, setSort] = useState("recent_desc")
  const [form, setForm] = useState<ProblemInput>(emptyInput())
  const [formOpen, setFormOpen] = useState(false)
  const [pendingTodoId, setPendingTodoId] = useState<string>()
  const [editingId, setEditingId] = useState<string>()
  const [deleteId, setDeleteId] = useState<string>()
  const [notesProblem, setNotesProblem] = useState<Problem>()
  const [bulk, setBulk] = useState(false)
  const [bulkText, setBulkText] = useState("")
  const [activeTab, setActiveTab] = useState<DashboardTab>("problems")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(
    () =>
      subscribeToAuth((nextUser) => {
        setUser(nextUser)
        setAuthResolved(true)
      }),
    []
  )

  useEffect(() => {
    if (firebaseEnabled && !user) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([getProblems(), getTodos()])
      .then(([items, queued]) => {
        setProblems(items)
        setTodos(queued)
      })
      .catch((reason: unknown) => {
        const code =
          reason && typeof reason === "object" && "code" in reason
            ? String(reason.code)
            : ""
        setError(
          code === "permission-denied"
            ? "Firestore recusou o acesso. Publique firestore.rules e mantenha a autenticação habilitada."
            : "Não foi possível carregar os dados. Verifique as variáveis do .env e reinicie o Vite."
        )
      })
      .finally(() => setLoading(false))
  }, [user])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visible = useMemo(
    () =>
      problems
        .filter(
          (problem) =>
            (difficulty === "all" || problem.difficulty === difficulty) &&
            (status === "all" || problem.status === status) &&
            `${problem.title} ${problem.tags.join(" ")}`
              .toLowerCase()
              .includes(search.toLowerCase())
        )
        .sort((a, b) =>
          sort === "recent_asc"
            ? a.createdAt - b.createdAt
            : sort === "difficulty"
              ? { facil: 0, medio: 1, dificil: 2 }[a.difficulty] -
                { facil: 0, medio: 1, dificil: 2 }[b.difficulty]
              : sort === "title"
                ? a.title.localeCompare(b.title)
                : b.createdAt - a.createdAt
        ),
    [problems, difficulty, status, search, sort]
  )
  if (firebaseEnabled && !authResolved) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <p className="text-sm text-muted-foreground">
          Verificando sua sessão...
        </p>
      </main>
    )
  }

  if (firebaseEnabled && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              <span className="text-teal-300">$</span> leetcode-tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-5 text-sm text-muted-foreground">
              Entre com sua conta Google para acessar seus problemas.
            </p>
            <Button
              className="w-full"
              onClick={() =>
                signInWithGoogle().catch((reason: unknown) => {
                  const code =
                    reason && typeof reason === "object" && "code" in reason
                      ? String(reason.code)
                      : ""
                  setError(
                    code === "auth/operation-not-allowed"
                      ? "Ative o provedor Google no Firebase Authentication."
                      : "Não foi possível entrar com Google."
                  )
                })
              }
            >
              Entrar com Google
            </Button>
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          </CardContent>
        </Card>
      </main>
    )
  }

  function openNew(prefill?: Partial<ProblemInput>, todoId?: string) {
    setEditingId(undefined)
    setPendingTodoId(todoId)
    const nextForm = { ...emptyInput(), ...prefill }
    if (!nextForm.url && nextForm.title) {
      nextForm.url = problemUrlFromTitle(nextForm.title)
    }
    setForm(nextForm)
    setFormOpen(true)
  }
  function updateForm<K extends keyof ProblemInput>(
    key: K,
    value: ProblemInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }
  function updateTitle(title: string) {
    setForm((current) => ({
      ...current,
      title,
      url:
        !current.url || current.url === problemUrlFromTitle(current.title)
          ? problemUrlFromTitle(title)
          : current.url,
    }))
  }
  async function submitProblem(event: FormEvent) {
    event.preventDefault()
    try {
      const item = await saveProblem(
        {
          ...form,
          title: form.title || titleFromUrl(form.url),
          url: form.url || problemUrlFromTitle(form.title),
        },
        editingId
      )
      setProblems((current) => [
        ...current.filter((problem) => problem.id !== item.id),
        item,
      ])
      if (pendingTodoId) {
        await deleteTodo(pendingTodoId)
        setTodos((current) =>
          current.filter((todo) => todo.id !== pendingTodoId)
        )
      }
      closeForm()
      setToast("Problema salvo.")
    } catch {
      setToast("Erro ao salvar o problema.")
    }
  }
  async function removeProblem() {
    if (!deleteId) return
    try {
      await deleteProblem(deleteId)
      setProblems((current) =>
        current.filter((problem) => problem.id !== deleteId)
      )
      setDeleteId(undefined)
      setToast("Problema removido.")
    } catch {
      setToast("Erro ao remover o problema.")
    }
  }
  async function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const url = String(data.get("url") || "")
    const title = String(data.get("title") || "") || titleFromUrl(url)
    if (!title) return
    const todo = {
      id: uid(),
      url: url || problemUrlFromTitle(title),
      title,
      createdAt: Date.now(),
    }
    try {
      await saveTodo(todo)
      setTodos((current) => [...current, todo])
      event.currentTarget.reset()
      setToast("Adicionado à fila.")
    } catch (reason: unknown) {
      const code =
        reason && typeof reason === "object" && "code" in reason
          ? String(reason.code)
          : ""
      setToast(
        code === "permission-denied"
          ? "Firestore recusou a gravação. Publique as regras atualizadas."
          : "Erro ao adicionar o problema."
      )
    }
  }
  async function addBulk(event: FormEvent) {
    event.preventDefault()
    const lines = bulkText
      .split("\n")
      .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
      .filter(Boolean)
    const existing = new Set(todos.map((todo) => todo.title.toLowerCase()))
    const additions = lines
      .map((line) => {
        const [left, right] = line.split("|").map((part) => part.trim())
        const url = right || (left.match(/https?:\/\/\S+/)?.[0] ?? "")
        const title =
          (right ? left : left.replace(url, "").trim()) || titleFromUrl(url)
        return title
          ? {
              id: uid(),
              url: url || problemUrlFromTitle(title),
              title,
              createdAt: Date.now(),
            }
          : undefined
      })
      .filter(
        (todo): todo is Todo =>
          todo !== undefined && !existing.has(todo.title.toLowerCase())
      )
    try {
      await Promise.all(additions.map(saveTodo))
      setTodos((current) => [...current, ...additions])
      setBulkText("")
      setToast(`${additions.length} item(ns) adicionado(s).`)
    } catch {
      setToast("Erro ao adicionar a lista.")
    }
  }
  async function removeTodo(id: string) {
    try {
      await deleteTodo(id)
      setTodos((current) => current.filter((todo) => todo.id !== id))
    } catch {
      setToast("Erro ao remover.")
    }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(problems, null, 2)], {
      type: "application/json",
    })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `leetcode-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    file
      .text()
      .then((text) =>
        importProblems(JSON.parse(text) as Problem[]).then((items) => {
          setProblems(items)
          setToast("Importação concluída.")
        })
      )
      .catch(() => setToast("Arquivo JSON inválido."))
  }
  function openEdit(problem: Problem) {
    setEditingId(problem.id)
    setForm({
      url: problem.url,
      title: problem.title,
      difficulty: problem.difficulty,
      status: problem.status,
      tags: problem.tags,
      notes: problem.notes,
      revisit: problem.revisit,
      createdAt: problem.createdAt,
    })
    setFormOpen(true)
  }
  function closeForm() {
    setEditingId(undefined)
    setPendingTodoId(undefined)
    setForm(emptyInput())
    setFormOpen(false)
  }

  const hasFilters = Boolean(search || difficulty !== "all" || status !== "all")
  function clearFilters() {
    setSearch("")
    setDifficulty("all")
    setStatus("all")
    setSort("recent_desc")
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl gap-8">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todoCount={todos.length}
          reviewCount={problems.filter((problem) => problem.revisit).length}
          email={user?.email}
          onSignOut={() => void signOutUser()}
        />
        <div className="min-w-0 flex-1">
          <PageHeader
            tab={activeTab}
            onImport={() => fileRef.current?.click()}
            onExport={exportData}
            onNew={() => openNew()}
            fileInput={
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="application/json"
                onChange={importData}
              />
            }
          />
          {activeTab === "problems" && <Stats problems={problems} />}
          {activeTab === "todo" && (
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
          )}
          {activeTab === "problems" && (
            <>
              <ProblemFilters
                search={search}
                setSearch={setSearch}
                sort={sort}
                setSort={setSort}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                status={status}
                setStatus={setStatus}
                count={visible.length}
                hasFilters={hasFilters}
                clearFilters={clearFilters}
              />
              <ProblemTable
                title="Histórico"
                problems={visible}
                loading={loading}
                error={error}
                onEdit={openEdit}
                onDelete={setDeleteId}
                onNotes={setNotesProblem}
              />
            </>
          )}
          {false && activeTab === "problems" && (
            <>
              <section className="mb-3 rounded-xl border bg-card p-3">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nome ou tag"
                    className="w-full lg:max-w-sm"
                  />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm sm:ml-auto"
                  >
                    <option value="recent_desc">Mais recentes</option>
                    <option value="recent_asc">Mais antigos</option>
                    <option value="difficulty">Dificuldade</option>
                    <option value="title">Nome (A-Z)</option>
                  </select>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground lg:ml-auto">
                    <span>
                      {visible.length}{" "}
                      {visible.length === 1 ? "problema" : "problemas"}
                    </span>
                    {hasFilters && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                  {[
                    [
                      "Dificuldade",
                      [
                        ["all", "Todas"],
                        ["facil", "Fácil"],
                        ["medio", "Médio"],
                        ["dificil", "Difícil"],
                      ],
                      difficulty,
                      setDifficulty,
                    ],
                    [
                      "Status",
                      [
                        ["all", "Todos"],
                        ["resolvido", "Resolvido"],
                        ["ajuda", "Com ajuda"],
                        ["nao_resolvido", "Não resolvido"],
                      ],
                      status,
                      setStatus,
                    ],
                  ].map(([label, options, selected, setter]) => (
                    <div
                      key={String(label)}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <span className="mr-1 text-sm font-medium text-foreground">
                        {String(label)}
                      </span>
                      {(options as string[][]).map(([value, text]) => (
                        <button
                          type="button"
                          key={value}
                          onClick={() =>
                            (
                              setter as React.Dispatch<
                                React.SetStateAction<string>
                              >
                            )(value)
                          }
                          className={`rounded-md border px-3 py-1.5 text-xs transition ${selected === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
              <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <h2 className="text-base font-semibold">Histórico</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {visible.length} exibidos
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-left text-xs font-medium text-muted-foreground">
                        <th className="px-5 py-3">Problema</th>
                        <th className="px-5 py-3">Dificuldade</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Tópico</th>
                        <th className="px-5 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((problem) => (
                        <tr
                          key={problem.id}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="max-w-xs px-5 py-4">
                            <a
                              href={problem.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium hover:text-primary"
                            >
                              {problem.title}
                            </a>
                            {problem.revisit && (
                              <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                revisar
                              </span>
                            )}
                            {problem.notes && (
                              <button
                                onClick={() => setNotesProblem(problem)}
                                className="block max-w-xs truncate text-left text-xs text-muted-foreground hover:text-primary"
                              >
                                {problem.notes}
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${difficultyColor[problem.difficulty]}`}
                            >
                              {difficultyLabel[problem.difficulty]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex min-h-6 min-w-[6.5rem] items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${statusColor[problem.status]}`}
                            >
                              ● {statusLabel[problem.status]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex max-w-[220px] flex-wrap gap-1">
                              {problem.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(problem)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(problem.id)}
                                className="text-destructive"
                              >
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {loading ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Carregando problemas...
                  </p>
                ) : error ? (
                  <p className="py-16 text-center text-sm text-destructive">
                    {error}
                  </p>
                ) : (
                  !visible.length && (
                    <div className="px-6 py-16 text-center">
                      <div className="text-sm font-medium text-foreground">
                        Nenhum problema encontrado
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Ajuste os filtros ou adicione seu primeiro problema.
                      </div>
                    </div>
                  )
                )}
              </section>
            </>
          )}
          {activeTab === "review" && (
            <ProblemTable
              title="Revisão"
              problems={problems.filter((problem) => problem.revisit)}
              onEdit={openEdit}
              onDelete={setDeleteId}
              onNotes={setNotesProblem}
            />
          )}
          {false && activeTab === "review" && (
            <section className="overflow-hidden rounded-xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-xs font-medium text-muted-foreground">
                      <th className="px-5 py-3">Problema</th>
                      <th className="px-5 py-3">Dificuldade</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Tópico</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems
                      .filter((problem) => problem.revisit)
                      .map((problem) => (
                        <tr
                          key={problem.id}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="px-5 py-4">
                            <a
                              href={problem.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium hover:text-primary"
                            >
                              {problem.title}
                            </a>
                            {problem.notes && (
                              <button
                                onClick={() => setNotesProblem(problem)}
                                className="block max-w-xs truncate text-left text-xs text-muted-foreground hover:text-primary"
                              >
                                {problem.notes}
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${difficultyColor[problem.difficulty]}`}
                            >
                              {difficultyLabel[problem.difficulty]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor[problem.status]}`}
                            >
                              {statusLabel[problem.status]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex max-w-[220px] flex-wrap gap-1">
                              {problem.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(problem)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setDeleteId(problem.id)}
                            >
                              Excluir
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!problems.some((problem) => problem.revisit) && (
                <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                  Nenhum problema marcado para revisão.
                </div>
              )}
            </section>
          )}
          <footer className="mt-8 text-center text-xs text-muted-foreground">
            {firebaseEnabled
              ? "dados sincronizados com o Firestore"
              : "dados salvos localmente · configure o Firebase para sincronizar"}
          </footer>
        </div>
      </div>
      {formOpen && (
        <Modal onClose={closeForm}>
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingId ? "Editar problema" : "Novo problema"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitProblem} className="space-y-4">
                <label className="block text-sm font-medium">
                  URL do problema *
                  <Input
                    required
                    type="url"
                    value={form.url}
                    onChange={(event) => updateForm("url", event.target.value)}
                    placeholder="https://leetcode.com/problems/two-sum/"
                    className="mt-1"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Nome do problema
                  <Input
                    value={form.title}
                    onChange={(event) => updateTitle(event.target.value)}
                    className="mt-1"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-sm font-medium">
                    Dificuldade
                    <select
                      value={form.difficulty}
                      onChange={(event) =>
                        updateForm(
                          "difficulty",
                          event.target.value as Difficulty
                        )
                      }
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="facil">Fácil</option>
                      <option value="medio">Médio</option>
                      <option value="dificil">Difícil</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Resultado
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateForm(
                          "status",
                          event.target.value as ProblemStatus
                        )
                      }
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="resolvido">Resolvido</option>
                      <option value="ajuda">Precisei de ajuda</option>
                      <option value="nao_resolvido">
                        Não consegui resolver
                      </option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Anotações
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    rows={3}
                    className="mt-1 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.revisit}
                    onChange={(event) =>
                      updateForm("revisit", event.target.checked)
                    }
                  />{" "}
                  Marcar para revisar depois
                </label>
                <div>
                  <div className="mb-1.5 text-sm font-medium">
                    Tags / tópicos
                  </div>
                  <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/40 p-2.5">
                    {tags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() =>
                          updateForm(
                            "tags",
                            form.tags.includes(tag)
                              ? form.tags.filter((item) => item !== tag)
                              : [...form.tags, tag]
                          )
                        }
                        className={`rounded-md border px-2.5 py-1 text-xs ${form.tags.includes(tag) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Modal>
      )}
      {deleteId && (
        <Modal onClose={() => setDeleteId(undefined)}>
          <Card className="w-full max-w-sm p-6">
            <h2 className="font-semibold">Remover problema?</h2>
            <p className="my-4 text-sm text-muted-foreground">
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(undefined)}>
                Cancelar
              </Button>
              <Button onClick={() => void removeProblem()} className="">
                Remover
              </Button>
            </div>
          </Card>
        </Modal>
      )}
      {notesProblem && (
        <Modal onClose={() => setNotesProblem(undefined)}>
          <Card className="w-full max-w-lg p-6">
            <div className="text-xs font-medium text-muted-foreground">
              Anotação
            </div>
            <h2 className="mt-1 font-semibold">{notesProblem.title}</h2>
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">
              {notesProblem.notes}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNotesProblem(undefined)
                  openEdit(notesProblem)
                }}
              >
                Editar problema
              </Button>
              <Button onClick={() => setNotesProblem(undefined)} className="">
                Fechar
              </Button>
            </div>
          </Card>
        </Modal>
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-md border bg-popover px-4 py-2.5 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </main>
  )
}

export default App
