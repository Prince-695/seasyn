import { ArrowRight, ShieldCheck } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { EngineIcon } from "@/components/connections/EngineIcon"
import type { PublicDatabaseConnection } from "@/types"

interface Step3BatchConfigurationProps {
  sourceConn: PublicDatabaseConnection | undefined
  targetConn: PublicDatabaseConnection | undefined
  sourceTable: string
  targetTable: string
  batchSize: number
  onChangeBatchSize: (size: number) => void
  totalRows?: number
}

const BATCH_PRESETS = [100, 500, 1000, 2500, 5000]

export function Step3BatchConfiguration({
  sourceConn,
  targetConn,
  sourceTable,
  targetTable,
  batchSize,
  onChangeBatchSize,
  totalRows = 0,
}: Step3BatchConfigurationProps) {
  const estimatedBatches =
    totalRows > 0 && batchSize > 0 ? Math.ceil(totalRows / batchSize) : null

  return (
    <div className="space-y-6">
      {/* 1. Batch Size Parameter Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="batchSize"
            className="text-foreground text-xs font-semibold"
          >
            Batch Streaming Size
          </Label>
          <span className="text-muted-foreground font-mono text-xs">
            {batchSize.toLocaleString()} rows per batch
          </span>
        </div>

        <p className="text-muted-foreground text-xs">
          Controls how many records SeaSyn fetches, transforms, and bulk-inserts
          in each network chunk.
        </p>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          {BATCH_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onChangeBatchSize(preset)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                batchSize === preset
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-bold shadow-xs"
                  : "border-border/70 bg-card hover:bg-muted/40 text-foreground"
              }`}
            >
              {preset.toLocaleString()} rows
            </Button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-muted-foreground text-xs">Custom:</span>
          <Input
            id="batchSize"
            type="number"
            min={10}
            max={50000}
            value={batchSize}
            onChange={(e) =>
              onChangeBatchSize(Math.max(10, parseInt(e.target.value) || 500))
            }
            className="w-32 font-mono text-xs"
          />
          <span className="text-muted-foreground text-xs">
            (Range: 10 – 50,000)
          </span>
        </div>
      </div>

      {/* 2. Pipeline Architecture Blueprint Review */}
      <div className="space-y-2 pt-2">
        <Label className="text-foreground text-xs font-semibold">
          Pipeline Blueprint Review
        </Label>

        <Card className="border-border/70 bg-card/60 p-5 backdrop-blur-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Origin Source */}
            <div className="flex items-center gap-3">
              {sourceConn?.db_type && (
                <div className="border-border/60 bg-muted/30 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border">
                  <EngineIcon engine={sourceConn.db_type} className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                  Source Database
                </p>
                <p className="text-foreground text-sm font-semibold">
                  {sourceConn?.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {sourceTable}
                  </Badge>
                  <span className="text-muted-foreground text-[11px]">
                    ({totalRows.toLocaleString()} rows)
                  </span>
                </div>
              </div>
            </div>

            {/* Pipeline Stream Visual */}
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="bg-border h-px w-12"></div>
                <div className="border-primary/40 bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full border">
                  <ArrowRight className="text-primary h-4 w-4 animate-pulse" />
                </div>
                <div className="bg-border h-px w-12"></div>
              </div>
              <span className="text-muted-foreground mt-1 font-mono text-[10px]">
                SSE Live CDC
              </span>
            </div>

            {/* Destination Target */}
            <div className="flex items-center gap-3">
              {targetConn?.db_type && (
                <div className="border-border/60 bg-muted/30 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border">
                  <EngineIcon engine={targetConn.db_type} className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                  Target Database
                </p>
                <p className="text-foreground text-sm font-semibold">
                  {targetConn?.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {targetTable}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Calculation Badges */}
          <div className="border-border/60 bg-muted/20 mt-5 grid grid-cols-2 gap-4 rounded-xl border p-3.5 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Total Records
              </p>
              <p className="text-foreground font-mono text-sm font-bold">
                {totalRows.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Batch Size
              </p>
              <p className="text-foreground font-mono text-sm font-bold">
                {batchSize.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Est. Batches
              </p>
              <p className="text-foreground font-mono text-sm font-bold">
                {estimatedBatches !== null ? `~${estimatedBatches}` : "--"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Safety & Execution Guarantees */}
      <div className="border-border/60 bg-muted/20 text-muted-foreground flex items-start gap-2.5 rounded-xl border p-3.5 text-xs">
        <ShieldCheck className="text-success mt-0.5 h-4 w-4 shrink-0" />
        <p className="leading-relaxed">
          SeaSyn operates statelessly. Data is streamed directly between your
          source and target connections in memory without writing records to
          external disk or third-party servers.
        </p>
      </div>
    </div>
  )
}
