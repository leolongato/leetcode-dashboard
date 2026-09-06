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
  nao_resolvido: "Não resolvido",
}
const difficultyColor: Record<Difficulty, string> = {
  facil: "text-emerald-300 bg-emerald-950/60",
  medio: "text-amber-300 bg-amber-950/60",
  dificil: "text-rose-300 bg-rose-950/60",
}
const statusColor: Record<ProblemStatus, string> = {
  resolvido: "text-emerald-300 bg-emerald-950/50",
  ajuda: "text-amber-300 bg-amber-950/50",
  nao_resolvido: "text-slate-300 bg-slate-800",
}

function titleFromUrl(url: string) {
  const match = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i)
  return match
    ? match[1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : ""
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
  const [editingId, setEditingId] = useState<string>()
  const [deleteId, setDeleteId] = useState<string>()
  const [notesProblem, setNotesProblem] = useState<Problem>()
  const [bulk, setBulk] = useState(false)
  const [bulkText, setBulkText] = useState("")
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
  const solved = problems.filter(
    (problem) => problem.status === "resolvido"
  ).length

  if (firebaseEnabled && !authResolved) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f13] p-6 text-slate-200">
        <p className="font-mono text-sm text-slate-400">
          Verificando sua sessão...
        </p>
      </main>
    )
  }

  if (firebaseEnabled && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f13] p-6 text-slate-200">
        <Card className="w-full max-w-sm border-[#2f3540] bg-[#14171d]">
          <CardHeader>
            <CardTitle className="font-mono">
              <span className="text-teal-300">$</span> leetcode-tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-5 text-sm text-slate-400">
              Entre com sua conta Google para acessar seus problemas.
            </p>
            <Button
              className="w-full bg-teal-300 font-bold text-slate-950 hover:bg-teal-200"
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

  function openNew(prefill?: Partial<ProblemInput>) {
    setEditingId(undefined)
    setForm({ ...emptyInput(), ...prefill })
    setFormOpen(true)
  }
  function updateForm<K extends keyof ProblemInput>(
    key: K,
    value: ProblemInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }
  async function submitProblem(event: FormEvent) {
    event.preventDefault()
    try {
      const item = await saveProblem(
        { ...form, title: form.title || titleFromUrl(form.url) },
        editingId
      )
      setProblems((current) => [
        ...current.filter((problem) => problem.id !== item.id),
        item,
      ])
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
    const todo = { id: uid(), url, title, createdAt: Date.now() }
    try {
      await saveTodo(todo)
      setTodos((current) => [...current, todo])
      event.currentTarget.reset()
      setToast("Adicionado à fila.")
    } catch {
      setToast("Erro ao adicionar.")
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
          ? { id: uid(), url, title, createdAt: Date.now() }
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
    setForm(emptyInput())
    setFormOpen(false)
  }

  return (
    <main className="min-h-screen bg-[#0d0f13] px-5 pt-10 pb-20 text-[#e7e9ee] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="mb-1 font-mono text-[13px] text-slate-500">
              ~/pratica <span>/</span>{" "}
              <span className="text-teal-300">leetcode-tracker</span>
            </div>
            <h1 className="font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
              <span className="text-teal-300">$</span> registro de problemas
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Cada linha resolvida aqui é uma linha que você não vai esquecer no
              dia da entrevista.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Importar
            </Button>
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="application/json"
              onChange={importData}
            />
            <Button variant="outline" onClick={exportData}>
              Exportar
            </Button>
            <Button
              onClick={() => openNew()}
              className="bg-teal-300 font-bold text-slate-950 hover:bg-teal-200"
            >
              + Novo problema
            </Button>
            {user && (
              <Button variant="ghost" onClick={() => void signOutUser()}>
                {user.email ?? "Conta Google"} · Sair
              </Button>
            )}
          </div>
        </header>
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Total", problems.length, ""],
            ["Resolvidos", solved, "text-emerald-300"],
            [
              "Taxa de acerto",
              `${problems.length ? Math.round((solved / problems.length) * 100) : 0}%`,
              "",
            ],
            [
              "Para revisar",
              problems.filter((problem) => problem.revisit).length,
              "text-amber-300",
            ],
          ].map(([label, value, color]) => (
            <Card key={String(label)} className="border-[#262b34] bg-[#14171d]">
              <CardContent className="p-4">
                <div className="font-mono text-[11px] tracking-wider text-slate-500 uppercase">
                  {String(label)}
                </div>
                <div className={`mt-1 text-2xl font-bold ${color}`}>
                  {value}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
        <section className="mb-6 rounded-xl border border-[#262b34] bg-[#14171d] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-sm font-bold">
              <span className="text-teal-300">$</span> para tentar depois
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulk((value) => !value)}
              >
                Adicionar em lote
              </Button>
              <span className="rounded-full border border-[#2f3540] bg-[#191d24] px-2 py-0.5 font-mono text-[11px] text-slate-400">
                {todos.length}
              </span>
            </div>
          </div>
          <form onSubmit={addTodo} className="mb-3 flex flex-wrap gap-2">
            <Input
              name="url"
              type="url"
              placeholder="URL do leetcode (opcional)"
              className="min-w-[180px] flex-1 border-[#2f3540] bg-[#191d24]"
            />
            <Input
              name="title"
              placeholder="Nome do problema"
              className="min-w-[180px] flex-1 border-[#2f3540] bg-[#191d24]"
            />
            <Button className="bg-teal-300 text-slate-950 hover:bg-teal-200">
              Adicionar
            </Button>
          </form>
          {bulk && (
            <form onSubmit={addBulk} className="mb-3 space-y-2">
              <textarea
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                rows={5}
                placeholder={
                  "Um problema por linha, ex:\nTrapping Rain Water\nhttps://leetcode.com/problems/word-ladder/"
                }
                className="w-full resize-none rounded-lg border border-[#2f3540] bg-[#191d24] px-3 py-2 text-sm outline-none focus:border-teal-300"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Nome, URL ou "Nome | URL".</span>
                <Button size="sm" className="bg-teal-300 text-slate-950">
                  Adicionar todos
                </Button>
              </div>
            </form>
          )}
          <ul className="space-y-1.5">
            {todos
              .slice()
              .sort((a, b) => a.createdAt - b.createdAt)
              .map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-2 rounded-lg border border-[#2f3540] bg-[#191d24] p-2.5"
                >
                  <a
                    href={todo.url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-sm font-medium hover:text-teal-300"
                  >
                    {todo.title}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void removeTodo(todo.id)
                      openNew({ url: todo.url, title: todo.title })
                    }}
                  >
                    Tentar agora
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void removeTodo(todo.id)}
                  >
                    Remover
                  </Button>
                </li>
              ))}
          </ul>
          {!todos.length && (
            <p className="py-2 text-sm text-slate-500">
              Nenhum problema na fila. Adicione um acima para tentar depois.
            </p>
          )}
        </section>
        <section className="mb-4 rounded-xl border border-[#262b34] bg-[#14171d] p-3">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou tag..."
              className="w-full border-[#2f3540] bg-[#191d24] sm:w-72"
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-lg border border-[#2f3540] bg-[#191d24] px-3 py-2 text-sm sm:ml-auto"
            >
              <option value="recent_desc">Mais recentes</option>
              <option value="recent_asc">Mais antigos</option>
              <option value="difficulty">Dificuldade</option>
              <option value="title">Nome (A-Z)</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
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
                <span className="mr-1 font-mono text-[10px] tracking-wider text-slate-500 uppercase">
                  {String(label)}
                </span>
                {(options as string[][]).map(([value, text]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() =>
                      (setter as React.Dispatch<React.SetStateAction<string>>)(
                        value
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${selected === value ? "border-teal-300 bg-teal-950/70 text-teal-300" : "border-[#2f3540] bg-[#191d24] text-slate-400 hover:text-slate-100"}`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border border-[#262b34] bg-[#14171d]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left font-mono text-[11px] tracking-wider text-slate-500 uppercase">
                  <th className="px-4 py-3">Problema</th>
                  <th className="px-4 py-3">Dificuldade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((problem) => (
                  <tr
                    key={problem.id}
                    className="border-t border-[#262b34] hover:bg-[#191d24]"
                  >
                    <td className="max-w-xs px-4 py-3">
                      <a
                        href={problem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:text-teal-300"
                      >
                        {problem.title}
                      </a>
                      {problem.revisit && (
                        <span className="ml-2 rounded bg-teal-950/70 px-1.5 py-0.5 font-mono text-[10px] text-teal-300">
                          revisar
                        </span>
                      )}
                      {problem.notes && (
                        <button
                          onClick={() => setNotesProblem(problem)}
                          className="block max-w-xs truncate text-left text-xs text-slate-500 hover:text-teal-300"
                        >
                          {problem.notes}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 font-mono text-[11px] font-bold ${difficultyColor[problem.difficulty]}`}
                      >
                        {difficultyLabel[problem.difficulty]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 font-mono text-[11px] font-bold ${statusColor[problem.status]}`}
                      >
                        ● {statusLabel[problem.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {problem.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded border border-[#2f3540] bg-[#191d24] px-1.5 py-0.5 font-mono text-[11px] text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                          className="text-rose-300"
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
            <p className="py-16 text-center text-sm text-slate-400">
              Carregando problemas...
            </p>
          ) : error ? (
            <p className="py-16 text-center text-sm text-rose-300">{error}</p>
          ) : (
            !visible.length && (
              <div className="px-6 py-16 text-center">
                <div className="font-mono text-sm text-slate-500">
                  Nenhum problema encontrado
                </div>
                <div className="text-sm text-slate-400">
                  Ajuste os filtros ou adicione seu primeiro problema.
                </div>
              </div>
            )
          )}
        </section>
        <footer className="mt-8 text-center font-mono text-[11px] text-slate-500">
          {firebaseEnabled
            ? "dados sincronizados com o Firestore"
            : "dados salvos localmente · configure o Firebase para sincronizar"}
        </footer>
      </div>
      {formOpen && (
        <Modal onClose={closeForm}>
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-[#2f3540] bg-[#14171d]">
            <CardHeader>
              <CardTitle className="font-mono">
                {editingId ? "Editar problema" : "Novo problema"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitProblem} className="space-y-4">
                <label className="block text-xs text-slate-400">
                  URL do problema *
                  <Input
                    required
                    type="url"
                    value={form.url}
                    onChange={(event) => updateForm("url", event.target.value)}
                    placeholder="https://leetcode.com/problems/two-sum/"
                    className="mt-1 border-[#2f3540] bg-[#191d24]"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Nome do problema
                  <Input
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    className="mt-1 border-[#2f3540] bg-[#191d24]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-xs text-slate-400">
                    Dificuldade
                    <select
                      value={form.difficulty}
                      onChange={(event) =>
                        updateForm(
                          "difficulty",
                          event.target.value as Difficulty
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-[#2f3540] bg-[#191d24] px-3 py-2 text-sm"
                    >
                      <option value="facil">Fácil</option>
                      <option value="medio">Médio</option>
                      <option value="dificil">Difícil</option>
                    </select>
                  </label>
                  <label className="text-xs text-slate-400">
                    Resultado
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateForm(
                          "status",
                          event.target.value as ProblemStatus
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-[#2f3540] bg-[#191d24] px-3 py-2 text-sm"
                    >
                      <option value="resolvido">Resolvido</option>
                      <option value="ajuda">Precisei de ajuda</option>
                      <option value="nao_resolvido">
                        Não consegui resolver
                      </option>
                    </select>
                  </label>
                </div>
                <label className="block text-xs text-slate-400">
                  Anotações
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    rows={3}
                    className="mt-1 w-full resize-none rounded-lg border border-[#2f3540] bg-[#191d24] px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-400">
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
                  <div className="mb-1.5 text-xs text-slate-400">
                    Tags / tópicos
                  </div>
                  <div className="flex flex-wrap gap-1.5 rounded-lg border border-[#2f3540] bg-[#191d24] p-2.5">
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
                        className={`rounded-full border px-2.5 py-1 font-mono text-xs ${form.tags.includes(tag) ? "border-teal-300 bg-teal-300 text-slate-950" : "border-[#2f3540] text-slate-400"}`}
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
                  <Button className="bg-teal-300 text-slate-950 hover:bg-teal-200">
                    Salvar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Modal>
      )}
      {deleteId && (
        <Modal onClose={() => setDeleteId(undefined)}>
          <Card className="w-full max-w-sm border-[#2f3540] bg-[#14171d] p-6">
            <h2 className="font-mono font-bold">Remover problema?</h2>
            <p className="my-4 text-sm text-slate-400">
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(undefined)}>
                Cancelar
              </Button>
              <Button
                onClick={() => void removeProblem()}
                className="bg-rose-400 text-rose-950 hover:bg-rose-300"
              >
                Remover
              </Button>
            </div>
          </Card>
        </Modal>
      )}
      {notesProblem && (
        <Modal onClose={() => setNotesProblem(undefined)}>
          <Card className="w-full max-w-lg border-[#2f3540] bg-[#14171d] p-6">
            <div className="font-mono text-[11px] text-slate-500 uppercase">
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
              <Button
                onClick={() => setNotesProblem(undefined)}
                className="bg-teal-300 text-slate-950"
              >
                Fechar
              </Button>
            </div>
          </Card>
        </Modal>
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-[#2f3540] bg-[#191d24] px-4 py-2.5 font-mono text-sm">
          {toast}
        </div>
      )}
    </main>
  )
}

export default App
