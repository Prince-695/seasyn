import { ShieldCheck } from "lucide-react"
import { EngineIcon } from "./EngineSelector"
import { DiagnosticPingButton } from "./DiagnosticPingButton"
import { cn } from "@/lib/utils"
import type { DatabaseConnectionInput } from "@/lib/validators"
import type { DBType, TestConnectionPayload } from "@/types"
import type { ENGINES } from "@/lib/constants/engines"

interface WizardStep3ReviewProps {
  projectId: string
  selectedEngine: DBType
  selectedEngineMeta: (typeof ENGINES)[number] | undefined
  isSourceVal: boolean
  formValues: DatabaseConnectionInput
  getTestPayload: () => TestConnectionPayload
  isError: boolean
  errorMessage: string | null
}

export function WizardStep3Review({
  projectId,
  selectedEngine,
  selectedEngineMeta,
  isSourceVal,
  formValues,
  getTestPayload,
  isError,
  errorMessage,
}: WizardStep3ReviewProps) {
  return (
    <div className="space-y-3 pt-1">
      {/* Summary Card */}
      <div className="border-border/70 bg-card rounded-xl border p-3.5">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="border-border/60 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-lg border">
              <EngineIcon type={selectedEngine} className="h-4 w-4" />
            </div>
            <div>
              <span className="text-foreground text-xs font-medium">
                {formValues.name || "Unnamed Connection"}
              </span>
              <span className="text-muted-foreground ml-2 text-[11px]">
                ({selectedEngineMeta?.name})
              </span>
            </div>
          </div>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-medium uppercase",
              isSourceVal
                ? "bg-primary/10 text-primary border-primary/20 border"
                : "border-success/20 bg-success/10 text-success border"
            )}
          >
            {isSourceVal ? "Source" : "Target"}
          </span>
        </div>

        <div className="border-border/60 divide-border/50 divide-y border-t pt-1 font-mono text-xs">
          <div className="flex items-start justify-between py-1.5">
            <span className="text-muted-foreground w-24 shrink-0 text-[11px] font-medium">
              Endpoint
            </span>
            <span className="text-foreground max-w-[75%] text-right text-[11px] font-medium break-all">
              {selectedEngine === "sqlite"
                ? formValues.file_path || "-"
                : selectedEngine === "mongodb" && formValues.uri
                  ? formValues.uri || "-"
                  : `${formValues.host || "localhost"}:${formValues.port || (selectedEngine === "mongodb" ? 27017 : 5432)}`}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-muted-foreground w-24 shrink-0 text-[11px] font-medium">
              Database
            </span>
            <span className="text-foreground text-[11px] font-medium">
              {formValues.database || "-"}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-muted-foreground w-24 shrink-0 text-[11px] font-medium">
              User
            </span>
            <span className="text-foreground text-[11px] font-medium">
              {formValues.username || "-"}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-muted-foreground w-24 shrink-0 text-[11px] font-medium">
              SSL Mode
            </span>
            <span className="text-foreground text-[11px] font-medium">
              {selectedEngine === "mongodb" &&
              formValues.uri?.startsWith("mongodb+srv://")
                ? "require (TLS SRV)"
                : formValues.ssl_mode || "disable"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Diagnostics Card */}
      <div className="border-border/70 bg-card rounded-xl border p-3.5">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <ShieldCheck className="text-primary h-4 w-4" />
            <span>Live Connection Diagnostic</span>
          </div>
          <span className="text-muted-foreground text-[10px]">
            Recommended before saving
          </span>
        </div>

        <DiagnosticPingButton
          getPayload={getTestPayload}
          projectId={projectId}
          size="sm"
        />
      </div>

      {/* Server Error Alert */}
      {isError && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-2.5 text-xs">
          {errorMessage ||
            "Unable to save database connection. Please check that credentials are correct and test the connection diagnostic above."}
        </div>
      )}
    </div>
  )
}
