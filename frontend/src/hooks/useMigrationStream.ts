import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { migrationsApi } from "@/api/migrations"
import type { MigrationProgress, MigrationStatus } from "@/types/migration"

export interface MigrationStreamLog {
  id: string
  timestamp: string
  level: "INFO" | "STREAM" | "BATCH" | "SUCCESS" | "WARN" | "ERROR"
  message: string
}

export interface UseMigrationStreamOptions {
  orgId?: string
  projectId?: string
  jobId?: string | null
  initialStatus?: MigrationStatus
  initialTotalRows?: number
  initialMigratedRows?: number
  onComplete?: () => void
  onError?: (error: string) => void
}

export function useMigrationStream({
  orgId,
  projectId,
  jobId,
  initialStatus = "pending",
  initialTotalRows = 0,
  initialMigratedRows = 0,
  onComplete,
  onError,
}: UseMigrationStreamOptions) {
  const [progress, setProgress] = useState<MigrationProgress | null>(null)
  const [streamStatus, setStreamStatus] = useState<MigrationStatus | null>(null)
  const [rowsPerSecond, setRowsPerSecond] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [liveLogs, setLiveLogs] = useState<MigrationStreamLog[]>([])

  const eventSourceRef = useRef<EventSource | null>(null)
  const lastUpdateRef = useRef<{ time: number; rows: number }>({
    time: 0,
    rows: initialMigratedRows,
  })

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        if (!event.data || event.data.trim() === "") return
        const data: MigrationProgress = JSON.parse(event.data)
        setProgress(data)
        setStreamStatus(data.state)

        // Use backend calculated throughput (RPS) directly if present, otherwise calculate delta
        if (data.current_rps !== undefined && data.current_rps >= 0) {
          setRowsPerSecond(Math.round(data.current_rps))
        } else {
          const now = Date.now()
          const elapsedSec = (now - lastUpdateRef.current.time) / 1000
          if (elapsedSec >= 1 && lastUpdateRef.current.time > 0) {
            const deltaRows = data.migrated_rows - lastUpdateRef.current.rows
            const rps = Math.max(0, Math.round(deltaRows / elapsedSec))
            setRowsPerSecond(rps)
            lastUpdateRef.current = { time: now, rows: data.migrated_rows }
          }
        }

        // Generate dynamic live log entry from server-sent event
        const nowStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })

        let logMsg = data.message
        let logLevel: MigrationStreamLog["level"] = "BATCH"

        if (data.state === "completed") {
          logLevel = "SUCCESS"
          logMsg =
            logMsg ||
            `Migration completed. All ${data.total_rows.toLocaleString()} rows transferred.`
        } else if (data.state === "failed") {
          logLevel = "ERROR"
          logMsg = logMsg || `Migration failed.`
        } else if (data.state === "cancelled") {
          logLevel = "WARN"
          logMsg = logMsg || `Migration cancelled.`
        } else {
          if (!logMsg) {
            const batchPart =
              data.batch_index !== undefined
                ? `Batch #${data.batch_index}: `
                : ""
            const rpsPart = data.current_rps
              ? ` at ${Math.round(data.current_rps)} rows/s`
              : ""
            const latPart = data.batch_latency_ms
              ? ` (${data.batch_latency_ms}ms latency)`
              : ""
            logMsg = `${batchPart}Streamed ${data.migrated_rows.toLocaleString()} / ${data.total_rows.toLocaleString()} rows (${data.percentage}%)${rpsPart}${latPart}`
          }
        }

        if (logMsg) {
          setLiveLogs((prev) => [
            ...prev,
            {
              id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: nowStr,
              level: logLevel,
              message: logMsg,
            },
          ])
        }

        // Terminal state handling
        if (data.state === "completed") {
          setIsConnected(false)
          eventSourceRef.current?.close()
          onComplete?.()
        } else if (data.state === "failed" || data.state === "cancelled") {
          setIsConnected(false)
          eventSourceRef.current?.close()
          const failMsg =
            data.message ||
            (data.state === "cancelled"
              ? "Migration job was cancelled."
              : "Migration failed. Please inspect database logs and connection status.")
          setErrorMessage(failMsg)
          onError?.(failMsg)
        }
      } catch {
        // Malformed SSE event or non-JSON keepalive comment — ignore and continue streaming
      }
    },
    [onComplete, onError]
  )

  useEffect(() => {
    // If not a running/pending job or missing params, don't open stream
    if (!jobId || !orgId || !projectId) return
    if (
      initialStatus === "completed" ||
      initialStatus === "cancelled" ||
      initialStatus === "failed"
    ) {
      return
    }

    const streamUrl = migrationsApi.getProgressStreamUrl(
      orgId,
      projectId,
      jobId
    )
    const es = new EventSource(streamUrl, { withCredentials: true })
    eventSourceRef.current = es

    es.onopen = () => {
      setIsConnected(true)
      setErrorMessage(null)
      lastUpdateRef.current = {
        time: Date.now(),
        rows: initialMigratedRows,
      }
      setLiveLogs((prev) => [
        ...prev,
        {
          id: `open-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          level: "STREAM",
          message: "Connected to real-time telemetry stream.",
        },
      ])
    }

    // Backend emits named "progress" events: fmt.Fprintf(w, "event: progress\ndata: %s\n\n", data)
    // In standard EventSource, custom event names must be registered via addEventListener
    es.addEventListener("progress", handleMessage)
    es.onmessage = handleMessage

    es.onerror = () => {
      setIsConnected(false)
      if (es.readyState === EventSource.CLOSED) {
        // Server closed stream cleanly (e.g. migration ended)
        onComplete?.()
      } else {
        setErrorMessage(
          "Live telemetry stream disconnected. Attempting to reconnect..."
        )
      }
    }

    return () => {
      es.removeEventListener("progress", handleMessage)
      es.close()
      setIsConnected(false)
    }
  }, [
    jobId,
    orgId,
    projectId,
    initialStatus,
    initialMigratedRows,
    handleMessage,
    onComplete,
  ])

  // Effective status derived from stream or initial
  const status: MigrationStatus =
    streamStatus ?? progress?.state ?? initialStatus

  // Calculated values
  const totalRows = progress?.total_rows ?? initialTotalRows
  const migratedRows = progress?.migrated_rows ?? initialMigratedRows
  const percentage =
    progress?.percentage ??
    (totalRows > 0
      ? Math.min(100, Math.round((migratedRows / totalRows) * 100))
      : 0)

  const estimatedSecondsRemaining = useMemo(() => {
    if (status !== "running" || rowsPerSecond <= 0) return null
    const remainingRows = Math.max(0, totalRows - migratedRows)
    return Math.ceil(remainingRows / rowsPerSecond)
  }, [status, rowsPerSecond, totalRows, migratedRows])

  const etaFormatted = useMemo(() => {
    if (estimatedSecondsRemaining === null) return null
    if (estimatedSecondsRemaining < 5) return "< 5 seconds"
    if (estimatedSecondsRemaining < 60) return `${estimatedSecondsRemaining}s`
    const mins = Math.floor(estimatedSecondsRemaining / 60)
    const secs = estimatedSecondsRemaining % 60
    return `${mins}m ${secs}s`
  }, [estimatedSecondsRemaining])

  return {
    progress,
    status,
    totalRows,
    migratedRows,
    percentage,
    rowsPerSecond,
    estimatedSecondsRemaining,
    etaFormatted,
    errorMessage,
    isConnected,
    bandwidthFormatted: progress?.bandwidth_formatted,
    bytesTransferredFormatted: progress?.bytes_transferred_formatted,
    bytesTransferred: progress?.bytes_transferred,
    batchLatencyMs: progress?.batch_latency_ms,
    batchIndex: progress?.batch_index,
    liveLogs,
  }
}
