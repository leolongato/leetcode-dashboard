import "@excalidraw/excalidraw/index.css"
import { Excalidraw } from "@excalidraw/excalidraw"
import { useTheme } from "@/components/theme-provider"

export function ExcalidrawTab() {
  const { theme } = useTheme()
  const resolvedTheme =
    theme === "system"
      ? document.documentElement.classList.contains("dark")
        ? "dark"
        : "light"
      : theme

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="h-[calc(100vh-5.5rem)] min-h-[620px] w-full">
        <Excalidraw theme={resolvedTheme} />
      </div>
    </div>
  )
}
