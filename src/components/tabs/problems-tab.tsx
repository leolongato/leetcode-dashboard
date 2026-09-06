import type { Dispatch, SetStateAction } from "react"
import { ProblemFilters, ProblemTable } from "@/components/dashboard"
import type { Problem } from "@/types"

export function ProblemsTab({
  loading,
  error,
  visible,
  search,
  setSearch,
  sort,
  setSort,
  difficulty,
  setDifficulty,
  status,
  setStatus,
  hasFilters,
  clearFilters,
  openEdit,
  setDeleteId,
  setNotesProblem,
}: {
  loading: boolean
  error: string
  visible: Problem[]
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  sort: string
  setSort: Dispatch<SetStateAction<string>>
  difficulty: string
  setDifficulty: Dispatch<SetStateAction<string>>
  status: string
  setStatus: Dispatch<SetStateAction<string>>
  hasFilters: boolean
  clearFilters: () => void
  openEdit: (problem: Problem) => void
  setDeleteId: Dispatch<SetStateAction<string | undefined>>
  setNotesProblem: Dispatch<SetStateAction<Problem | undefined>>
}) {
  return (
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
  )
}
