import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  BrushIcon,
  Chart01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircleIcon,
  Alert02Icon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Difficulty, Problem, ProblemStatus, Todo } from "@/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export type DashboardTab = "problems" | "todo" | "review" | "excalidraw"

const tabIcons: Record<DashboardTab, typeof BookOpen01Icon> = {
  problems: BookOpen01Icon,
  todo: CheckmarkBadge01Icon,
  review: Chart01Icon,
  excalidraw: BrushIcon,
}

function todoUrlFromTitle(title: string) {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug ? `https://leetcode.com/problems/${slug}/` : ""
}

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

function Badge({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  )
}

function StatusBadge({ status }: { status: ProblemStatus }) {
  const tone =
    status === "resolvido"
      ? "border-green-400/30 bg-green-400/10 text-green-400"
      : status === "ajuda"
        ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-400"
        : "border-red-400/30 bg-red-400/10 text-red-400"
  return (
    <Badge className={tone}>
      <span aria-hidden="true" className="mr-1">
        {status === "resolvido" && (
          <HugeiconsIcon
            icon={CheckmarkCircleIcon}
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
          />
        )}
        {status === "ajuda" && (
          <HugeiconsIcon
            icon={Alert02Icon}
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
          />
        )}
        {status === "nao_resolvido" && (
          <HugeiconsIcon
            icon={CancelCircleIcon}
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
          />
        )}
      </span>
      {statusLabel[status]}
    </Badge>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const tone =
    difficulty === "facil"
      ? "border-green-400/30 bg-green-400/10 text-green-400"
      : difficulty === "medio"
        ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-400"
        : "border-red-400/30 bg-red-400/10 text-red-400"
  return <Badge className={tone}>{difficultyLabel[difficulty]}</Badge>
}

export function Sidebar({
  activeTab,
  onTabChange,
  todoCount,
  reviewCount,
  email,
  onSignOut,
  collapsed,
  onToggleCollapse,
}: {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  todoCount: number
  reviewCount: number
  email?: string | null
  onSignOut: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const items: [DashboardTab, string][] = [
    ["problems", "Problemas"],
    ["todo", "A fazer"],
    ["review", "Revisão"],
    ["excalidraw", "Desenhar"],
  ]

  return (
    <>
      <aside
        className={`hidden h-[calc(100vh-5rem)] shrink-0 flex-col border-r pr-3 md:flex ${collapsed ? "w-16" : "w-56"} fixed top-6 bottom-6 left-4 z-20`}
      >
        <div
          className={`mb-4 flex items-center pt-1 ${collapsed ? "justify-center" : "justify-between"}`}
        >
          <div
            className={`overflow-hidden text-lg font-semibold tracking-tight transition-all ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
          >
            Seu Dashboard
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-md p-0 text-muted-foreground"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <HugeiconsIcon
              icon={collapsed ? ArrowRight01Icon : ArrowLeft01Icon}
              size={16}
              strokeWidth={1.8}
              className="shrink-0"
            />
          </Button>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Navegação principal">
          {items.map(([tab, label]) => (
            <NavItem
              key={tab}
              tab={tab}
              label={label}
              activeTab={activeTab}
              onTabChange={onTabChange}
              count={
                tab === "todo"
                  ? todoCount
                  : tab === "review"
                    ? reviewCount
                    : undefined
              }
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="mt-auto border-t pt-4">
          {email && (
            <div
              className={`mb-3 truncate px-3 text-xs text-muted-foreground ${collapsed ? "hidden" : "block"}`}
            >
              {email}
            </div>
          )}
          {email && (
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start px-3 text-muted-foreground ${collapsed ? "justify-center px-2" : ""}`}
              onClick={onSignOut}
              title={collapsed ? "Sair" : undefined}
            >
              Sair
            </Button>
          )}
        </div>
      </aside>

      <nav
        className="mb-6 flex gap-1 overflow-x-auto border-b pb-2 md:hidden"
        aria-label="Navegação principal"
      >
        {items.map(([tab, label]) => (
          <NavItem
            key={tab}
            tab={tab}
            label={label}
            activeTab={activeTab}
            onTabChange={onTabChange}
            collapsed={false}
          />
        ))}
      </nav>

      {email && (
        <div className="mb-6 flex items-center justify-between border-b pb-4 md:hidden">
          <span className="max-w-[70%] truncate text-xs text-muted-foreground">
            {email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={onSignOut}
          >
            Sair
          </Button>
        </div>
      )}
    </>
  )
}

function NavItem({
  tab,
  label,
  activeTab,
  onTabChange,
  count,
  collapsed = false,
}: {
  tab: DashboardTab
  label: string
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  count?: number
  collapsed?: boolean
}) {
  const icon = tabIcons[tab]

  return (
    <button
      type="button"
      onClick={() => onTabChange(tab)}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-md py-2 text-left text-sm transition ${activeTab === tab ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"} ${collapsed ? "w-full justify-center px-2" : "w-full justify-between px-3"}`}
    >
      <span
        className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}
      >
        <HugeiconsIcon
          icon={icon}
          size={collapsed ? 16 : 18}
          strokeWidth={1.8}
          className="shrink-0"
        />
        {!collapsed && <span>{label}</span>}
      </span>
      {!collapsed && count !== undefined && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
      {!collapsed && count === undefined && tab === "excalidraw" && (
        <span className="sr-only">{label}</span>
      )}
    </button>
  )
}

export function PageHeader({
  tab,
  onImport,
  onExport,
  onNew,
  fileInput,
}: {
  tab: DashboardTab
  onImport: () => void
  onExport: () => void
  onNew: () => void
  fileInput: ReactNode
}) {
  const title =
    tab === "problems"
      ? "Problemas"
      : tab === "todo"
        ? "A fazer"
        : tab === "review"
          ? "Revisão"
          : "Excalidraw"
  const description =
    tab === "problems"
      ? "Seu histórico de prática"
      : tab === "todo"
        ? "Problemas que você quer resolver em seguida"
        : tab === "review"
          ? "Problemas marcados para revisar"
          : "Quadro de ideias e diagramas"
  return (
    <header className="mb-7 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {fileInput}
        <Button variant="ghost" size="sm" onClick={onImport}>
          Importar
        </Button>
        <Button variant="ghost" size="sm" onClick={onExport}>
          Exportar
        </Button>
        <Button onClick={onNew} className="font-semibold">
          Novo problema
        </Button>
      </div>
    </header>
  )
}

export function Stats({ problems }: { problems: Problem[] }) {
  const solved = problems.filter(
    (problem) => problem.status === "resolvido"
  ).length
  const helped = problems.filter((problem) => problem.status === "ajuda").length
  const failed = problems.filter(
    (problem) => problem.status === "nao_resolvido"
  ).length
  const items = [
    ["Resolvidos", solved, "text-foreground"],
    ["Precisei de ajuda", helped, "text-muted-foreground"],
    ["Não consegui", failed, "text-destructive"],
    [
      "Taxa de acerto",
      `${problems.length ? Math.round((solved / problems.length) * 100) : 0}%`,
      "text-foreground",
    ],
  ]
  return (
    <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([label, value, color]) => (
        <div
          key={String(label)}
          className="rounded-lg border border-border/70 bg-muted/30 px-3 py-3"
        >
          <div className="text-xs font-medium text-muted-foreground">
            {label}
          </div>
          <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
        </div>
      ))}
    </section>
  )
}

export function TodoPanel({
  todos,
  bulk,
  bulkText,
  setBulk,
  setBulkText,
  onAdd,
  onBulk,
  onRemove,
  onTry,
}: {
  todos: Todo[]
  bulk: boolean
  bulkText: string
  setBulk: Dispatch<SetStateAction<boolean>>
  setBulkText: Dispatch<SetStateAction<string>>
  onAdd: (event: React.FormEvent<HTMLFormElement>) => void
  onBulk: (event: React.FormEvent) => void
  onRemove: (id: string) => void
  onTry: (todo: Todo) => void
}) {
  const [todoTitle, setTodoTitle] = useState("")
  const [todoUrl, setTodoUrl] = useState("")

  useEffect(() => {
    setTodoTitle("")
    setTodoUrl("")
  }, [todos.length])

  function updateTodoTitle(title: string) {
    setTodoTitle(title)
    setTodoUrl((current) =>
      !current || current === todoUrlFromTitle(todoTitle)
        ? todoUrlFromTitle(title)
        : current
    )
  }

  return (
    <section className="mb-5 rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">A fazer</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulk((value) => !value)}
          >
            Adicionar em lote
          </Button>
          <span className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {todos.length}
          </span>
        </div>
      </div>
      <form onSubmit={onAdd} className="mb-3 flex flex-wrap gap-2">
        <Input
          name="url"
          type="url"
          value={todoUrl}
          onChange={(event) => setTodoUrl(event.target.value)}
          placeholder="URL do leetcode (opcional)"
          className="min-w-45 flex-1"
        />
        <Input
          name="title"
          value={todoTitle}
          onChange={(event) => updateTodoTitle(event.target.value)}
          placeholder="Nome do problema"
          className="min-w-45 flex-1"
        />
        <Button type="submit">Adicionar</Button>
      </form>
      {bulk && (
        <form onSubmit={onBulk} className="mb-3 space-y-2">
          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            rows={5}
            placeholder={
              "Um problema por linha, ex:\nTrapping Rain Water\nhttps://leetcode.com/problems/word-ladder/"
            }
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Nome, URL ou "Nome | URL".</span>
            <Button type="submit" size="sm">
              Adicionar todos
            </Button>
          </div>
        </form>
      )}
      <ul className="divide-y">
        {todos
          .slice()
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <a
                href={todo.url || undefined}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-medium text-primary underline-offset-4 hover:text-primary hover:underline"
              >
                {todo.title}
              </a>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onTry(todo)}
              >
                <span className="hidden sm:inline">Tentar agora</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onRemove(todo.id)}
              >
                Remover
              </Button>
            </li>
          ))}
      </ul>
      {!todos.length && (
        <p className="py-2 text-sm text-muted-foreground">
          Nenhum problema na fila.
        </p>
      )}
    </section>
  )
}

export function ProblemFilters({
  search,
  setSearch,
  sort,
  setSort,
  difficulty,
  setDifficulty,
  status,
  setStatus,
  count,
  hasFilters,
  clearFilters,
}: {
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  sort: string
  setSort: Dispatch<SetStateAction<string>>
  difficulty: string
  setDifficulty: Dispatch<SetStateAction<string>>
  status: string
  setStatus: Dispatch<SetStateAction<string>>
  count: number
  hasFilters: boolean
  clearFilters: () => void
}) {
  const groups: [
    string,
    string[][],
    string,
    Dispatch<SetStateAction<string>>,
  ][] = [
    [
      "Ordenar por",
      [
        ["recent_desc", "Mais recentes"],
        ["recent_asc", "Mais antigos"],
        ["difficulty", "Dificuldade"],
        ["title", "Nome (A-Z)"],
      ],
      sort,
      setSort,
    ],
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
        ["nao_resolvido", "Não consegui"],
      ],
      status,
      setStatus,
    ],
  ]
  return (
    <section className="mb-3 rounded-xl border bg-card p-3">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome ou tag"
          className="w-full lg:max-w-sm"
        />
        <div className="flex items-center gap-3 text-sm text-muted-foreground lg:ml-auto">
          <span>
            {count} {count === 1 ? "problema" : "problemas"}
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
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-start">
        {groups.map(([label, options, selected, setter]) => (
          <div
            key={label}
            className="flex min-w-0 flex-1 flex-col gap-2 border-b border-border/70 pb-3 last:border-b-0 last:pb-0 sm:border-r sm:border-b-0 sm:pr-6 sm:last:border-r-0 sm:last:pr-0"
          >
            <span className="text-sm font-medium text-foreground">{label}</span>
            <div className="flex flex-wrap gap-1.5">
              {options.map(([value, text]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setter(value)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition ${selected === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ProblemTable({
  title,
  problems,
  loading,
  error,
  onEdit,
  onDelete,
  onNotes,
}: {
  title: string
  problems: Problem[]
  loading?: boolean
  error?: string
  onEdit: (problem: Problem) => void
  onDelete: (id: string) => void
  onNotes: (problem: Problem) => void
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {problems.length} exibidos
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
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
            {problems.map((problem) => (
              <tr key={problem.id} className="border-t hover:bg-muted/50">
                <td className="max-w-xs px-5 py-4">
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-sm font-medium text-primary underline-offset-4 hover:text-primary hover:underline"
                  >
                    {problem.title}
                  </a>
                  {problem.revisit && (
                    <Badge className="ml-2 border-primary/30 bg-primary/10 text-primary">
                      Revisar
                    </Badge>
                  )}
                  {problem.notes && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            onClick={() => onNotes(problem)}
                            className="block max-w-xs truncate text-left text-xs text-muted-foreground hover:text-primary"
                          >
                            {problem.notes}
                          </button>
                        }
                      />
                      <TooltipContent side="bottom" align="start">
                        <p>{problem.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </td>
                <td className="px-5 py-4">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={problem.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex max-w-[220px] flex-wrap gap-1">
                    {problem.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="border-border bg-muted text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(problem)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-destructive"
                      onClick={() => onDelete(problem.id)}
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
        <p className="py-16 text-center text-sm text-destructive">{error}</p>
      ) : (
        !problems.length && (
          <div className="px-6 py-16 text-center">
            <div className="text-sm font-medium">
              Nenhum problema encontrado
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Ajuste os filtros ou adicione seu primeiro problema.
            </div>
          </div>
        )
      )}
    </section>
  )
}
