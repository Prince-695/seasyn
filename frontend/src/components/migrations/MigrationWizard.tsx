import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Step1SourceSelection } from "./Step1SourceSelection"
import { Step2TargetSelection } from "./Step2TargetSelection"
import { Step3BatchConfiguration } from "./Step3BatchConfiguration"
import { migrationsApi } from "@/api/migrations"
import { migrationKeys } from "@/lib/queryKeys"
import type { PublicDatabaseConnection } from "@/types"
import type { StartMigrationPayload } from "@/types/migration"

interface MigrationWizardProps {
  orgId: string
  projectId: string
  connections: PublicDatabaseConnection[]
  initialSourceConnId?: string
  initialSourceTable?: string
}

export function MigrationWizard({
  orgId,
  projectId,
  connections,
  initialSourceConnId = "",
  initialSourceTable = "",
}: MigrationWizardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Wizard Steps: 1 = Source, 2 = Target, 3 = Batch & Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Pipeline configuration state
  const [sourceConnId, setSourceConnId] = useState<string>(
    initialSourceConnId || connections[0]?.id || ""
  )
  const [sourceTable, setSourceTable] = useState<string>(initialSourceTable)
  const [targetConnId, setTargetConnId] = useState<string>("")
  const [targetTable, setTargetTable] = useState<string>("")
  const [batchSize, setBatchSize] = useState<number>(500)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sourceConn = connections.find((c) => c.id === sourceConnId)
  const targetConn = connections.find((c) => c.id === targetConnId)

  // Auto-set targetTable when sourceTable changes if not already set
  const handleSelectSourceTable = (table: string) => {
    setSourceTable(table)
    if (!targetTable) {
      setTargetTable(table)
    }
  }

  // Mutation to start migration
  const startMutation = useMutation({
    mutationFn: async (payload: StartMigrationPayload) => {
      setErrorMessage(null)
      const res = await migrationsApi.startMigration(orgId, projectId, payload)
      return res.data
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({
        queryKey: migrationKeys.list(orgId, projectId),
      })
      if (job?.id) {
        navigate(`/migration/${job.id}`)
      } else {
        navigate("/migration")
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        "Failed to start migration pipeline. Please check connection health."
      setErrorMessage(msg)
    },
  })

  // Validation per step
  const isStep1Valid = !!sourceConnId && !!sourceTable
  const isStep2Valid = !!targetConnId && !!targetTable.trim()
  const isStep3Valid = batchSize >= 10

  const handleNext = () => {
    if (currentStep === 1 && isStep1Valid) {
      // If target connection not chosen yet, default to first available different connection
      if (!targetConnId) {
        const available = connections.filter((c) => c.id !== sourceConnId)
        if (available[0]) setTargetConnId(available[0].id)
      }
      setCurrentStep(2)
    } else if (currentStep === 2 && isStep2Valid) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1)
    if (currentStep === 3) setCurrentStep(2)
  }

  const handleStartPipeline = async () => {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) return

    await startMutation.mutateAsync({
      source_connection_id: sourceConnId,
      target_connection_id: targetConnId,
      source_table: sourceTable,
      target_table: targetTable.trim(),
      batch_size: batchSize,
    })
  }

  return (
    <div className="space-y-6">
      {/* 3-Step Wizard Stepper Header */}
      <div className="border-border/60 bg-card/60 rounded-xl border p-4 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          {/* Step 1 Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all ${
                currentStep === 1
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : currentStep > 1
                    ? "border-success/40 bg-success/20 text-success border"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <div className="hidden sm:block">
              <p className="text-foreground text-xs font-semibold">
                Step 1: Source
              </p>
              <p className="text-muted-foreground text-[11px]">
                Choose origin database
              </p>
            </div>
          </div>

          <div className="bg-border mx-2 h-px max-w-[80px] flex-1"></div>

          {/* Step 2 Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all ${
                currentStep === 2
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : currentStep > 2
                    ? "border-success/40 bg-success/20 text-success border"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
            </div>
            <div className="hidden sm:block">
              <p className="text-foreground text-xs font-semibold">
                Step 2: Target
              </p>
              <p className="text-muted-foreground text-[11px]">
                Select destination engine
              </p>
            </div>
          </div>

          <div className="bg-border mx-2 h-px max-w-[80px] flex-1"></div>

          {/* Step 3 Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all ${
                currentStep === 3
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
            <div className="hidden sm:block">
              <p className="text-foreground text-xs font-semibold">
                Step 3: Review
              </p>
              <p className="text-muted-foreground text-[11px]">
                Parameters & launch
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content Body */}
      <Card className="border-border/70 bg-card/70 p-6 backdrop-blur-xs">
        {currentStep === 1 && (
          <Step1SourceSelection
            orgId={orgId}
            projectId={projectId}
            connections={connections}
            selectedConnId={sourceConnId}
            selectedTable={sourceTable}
            onSelectConnection={setSourceConnId}
            onSelectTable={handleSelectSourceTable}
          />
        )}

        {currentStep === 2 && (
          <Step2TargetSelection
            orgId={orgId}
            projectId={projectId}
            connections={connections}
            sourceConnId={sourceConnId}
            selectedConnId={targetConnId}
            targetTable={targetTable}
            onSelectConnection={setTargetConnId}
            onChangeTargetTable={setTargetTable}
          />
        )}

        {currentStep === 3 && (
          <Step3BatchConfiguration
            sourceConn={sourceConn}
            targetConn={targetConn}
            sourceTable={sourceTable}
            targetTable={targetTable}
            batchSize={batchSize}
            onChangeBatchSize={setBatchSize}
          />
        )}

        {/* Mutation Error Notification */}
        {errorMessage && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive mt-5 flex items-center gap-2 rounded-xl border p-3.5 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div className="border-border/60 mt-8 flex items-center justify-between border-t pt-5">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={startMutation.isPending}
              className="gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous Step</span>
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              disabled={currentStep === 1 ? !isStep1Valid : !isStep2Valid}
              className="gap-1.5 text-xs font-semibold"
            >
              <span>Next Step</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleStartPipeline}
              disabled={!isStep3Valid || startMutation.isPending}
              className="bg-success text-success-foreground hover:bg-success/90 gap-1.5 text-xs font-semibold shadow-xs"
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Launching Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Launch Live Migration</span>
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
