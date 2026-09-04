import { useState } from "react"
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { cn } from "@/lib/utils"
import type { TestConnectionPayload, ConnectionTestResult } from "@/types"

interface DiagnosticPingButtonProps {
  // Option A: Test unsaved payload (inside ConnectionWizardModal)
  getPayload?: () => TestConnectionPayload | null

  // Option B: Test existing saved connection (on ConnectionCard)
  savedConnId?: string
  projectId?: string

  // Callbacks
  onResult?: (result: ConnectionTestResult) => void
  size?: "default" | "sm"
  variant?: "default" | "outline" | "secondary"
  className?: string
}

export function DiagnosticPingButton({
  getPayload,
  savedConnId,
  projectId,
  onResult,
  size = "default",
  variant = "outline",
  className,
}: DiagnosticPingButtonProps) {
  const { activeOrg } = useWorkspaceStore()
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ConnectionTestResult | null>(null)

  const handleTest = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!activeOrg?.id) return
    setTesting(true)
    setResult(null)

    try {
      let testRes: ConnectionTestResult

      if (savedConnId && projectId) {
        const res = await projectsApi.testSavedConnection(
          activeOrg.id,
          projectId,
          savedConnId
        )
        testRes = res.data || {
          success: false,
          latency_ms: 0,
          error_message: "No data returned",
        }
      } else if (getPayload) {
        const payload = getPayload()
        if (!payload) {
          setTesting(false)
          return
        }
        const effectiveProjectId = projectId || "draft"
        const res = await projectsApi.testDirectConnection(
          activeOrg.id,
          effectiveProjectId,
          payload
        )
        testRes = res.data || {
          success: false,
          latency_ms: 0,
          error_message: "No data returned",
        }
      } else {
        throw new Error("Invalid diagnostic configuration")
      }

      setResult(testRes)
      onResult?.(testRes)
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Connection diagnostic failed."
      const failResult: ConnectionTestResult = {
        success: false,
        latency_ms: 0,
        error_message: errorMsg,
      }
      setResult(failResult)
      onResult?.(failResult)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleTest}
        disabled={testing}
        className={cn("gap-2 font-semibold transition-all", className)}
      >
        {testing ? (
          <>
            <Loader2 className="text-primary h-4 w-4 animate-spin" />
            <span>Testing Connection...</span>
          </>
        ) : (
          <>
            <Activity className="text-primary h-4 w-4" />
            <span>Test Connection</span>
          </>
        )}
      </Button>

      {/* Result feedback banner */}
      {result && (
        <div
          className={cn(
            "flex items-start gap-2.5 rounded-lg border p-3 text-xs transition-all duration-200",
            result.success
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {result.success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}

          <div className="flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 font-medium">
              <span>
                {result.success ? "Connection Verified" : "Connection Failed"}
              </span>
              {result.latency_ms > 0 && (
                <span className="bg-background/50 rounded px-1.5 py-0.5 font-mono text-[11px]">
                  {result.latency_ms}ms latency
                </span>
              )}
            </div>

            {result.server_info && (
              <p className="font-mono text-[11px] opacity-90">
                {result.server_info}
              </p>
            )}

            {result.error_message && (
              <p className="leading-relaxed opacity-90">
                {result.error_message}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleTest}
            title="Re-run ping test"
            className="hover:bg-background/20 rounded p-1 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}
    </div>
  )
}
