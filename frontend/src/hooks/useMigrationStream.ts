import { useEffect, useState, useRef, useMemo } from "react"
import { migrationsApi } from "@/api/migrations"
import type { MigrationProgress, MigrationStatus } from "@/types/migration"

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

  const eventSourceRef = useRef<EventSource | null>(null)
  const lastUpdateRef = useRef<{ time: number; rows: number }>({
    time: 0,
    rows: initialMigratedRows,
  })

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
    }

    es.onmessage = (event) => {
      try {
        const data: MigrationProgress = JSON.parse(event.data)
        setProgress(data)
        setStreamStatus(data.state)

        // Calculate real-time throughput (Rows Per Second)
        const now = Date.now()
        const elapsedSec = (now - lastUpdateRef.current.time) / 1000
        if (elapsedSec >= 1 && lastUpdateRef.current.time > 0) {
          const deltaRows = data.migrated_rows - lastUpdateRef.current.rows
          const rps = Math.max(0, Math.round(deltaRows / elapsedSec))
          setRowsPerSecond(rps)
          lastUpdateRef.current = { time: now, rows: data.migrated_rows }
        }

        // Terminal state handling
        if (data.state === "completed") {
          setIsConnected(false)
          es.close()
          onComplete?.()
        } else if (data.state === "failed" || data.state === "cancelled") {
          setIsConnected(false)
          es.close()
          if (data.message) {
            setErrorMessage(data.message)
            onError?.(data.message)
          }
        }
      } catch (err) {
        console.error(
          "[useMigrationStream] Failed to parse SSE event data:",
          err
        )
      }
    }

    es.onerror = () => {
      setIsConnected(false)
      if (es.readyState === EventSource.CLOSED) {
        console.log("[useMigrationStream] EventSource connection closed.")
      }
    }

    return () => {
      es.close()
      setIsConnected(false)
    }
  }, [
    jobId,
    orgId,
    projectId,
    initialStatus,
    initialMigratedRows,
    onComplete,
    onError,
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
  }
}
