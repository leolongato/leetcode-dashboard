import type { Dispatch, SetStateAction } from "react"
import { ProblemTable } from "@/components/dashboard"
import type { Problem } from "@/types"

export function ReviewTab({
  problems,
  openEdit,
  setDeleteId,
  setNotesProblem,
}: {
  problems: Problem[]
  openEdit: (problem: Problem) => void
  setDeleteId: Dispatch<SetStateAction<string | undefined>>
  setNotesProblem: Dispatch<SetStateAction<Problem | undefined>>
}) {
  return (
    <ProblemTable
      title="Revisão"
      problems={problems.filter((problem) => problem.revisit)}
      onEdit={openEdit}
      onDelete={setDeleteId}
      onNotes={setNotesProblem}
    />
  )
}
