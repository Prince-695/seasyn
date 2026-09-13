import { useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { schemaApi } from "@/api/schema"
import { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import type { ColumnSchema, TableSchema } from "@/types/schema"

interface UseTableMutationsParams {
  orgId?: string
  effectiveProjectId: string
  effectiveConnId: string
  effectiveTableName: string | null
  activeTable: TableSchema | null
  terminology: ReturnType<typeof getDatabaseTerminology>
  refetchRows: () => void
  refetchSchema: () => void
}

export function useTableMutations({
  orgId,
  effectiveProjectId,
  effectiveConnId,
  effectiveTableName,
  activeTable,
  terminology,
  refetchRows,
  refetchSchema,
}: UseTableMutationsParams) {
  const updateCellMutation = useMutation({
    mutationFn: async ({
      row,
      col,
      newVal,
    }: {
      row: Record<string, unknown>
      col: ColumnSchema
      newVal: unknown
    }) => {
      if (
        !orgId ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      ) {
        throw new Error(
          "Unable to update cell: missing required workspace, database, or collection context. Please select a table and try again."
        )
      }
      const pkField =
        activeTable?.primary_keys[0] ||
        (terminology.paradigm === "document" ? "_id" : "id")
      const pkRecord = { [pkField]: row[pkField] }
      await schemaApi.updateRow(
        orgId,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        { [col.name]: newVal },
        pkRecord
      )
    },
    onSuccess: () => {
      refetchRows()
    },
  })

  const updateRowMutation = useMutation({
    mutationFn: async ({
      row,
      updatedRow,
    }: {
      row: Record<string, unknown>
      updatedRow: Record<string, unknown>
    }) => {
      if (
        !orgId ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      ) {
        throw new Error(
          "Unable to update record: missing database or collection context. Please select a record and try again."
        )
      }
      const pkField =
        activeTable?.primary_keys[0] ||
        (terminology.paradigm === "document" ? "_id" : "id")
      const pkRecord = { [pkField]: row[pkField] }
      await schemaApi.updateRow(
        orgId,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        updatedRow,
        pkRecord
      )
    },
    onSuccess: () => {
      refetchRows()
    },
  })

  const deleteRowMutation = useMutation({
    mutationFn: async (pkValues: Record<string, unknown>) => {
      if (
        !orgId ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      ) {
        throw new Error(
          "Unable to delete record: missing database or table context. Please try again."
        )
      }
      await schemaApi.deleteRow(
        orgId,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        pkValues
      )
    },
    onSuccess: () => {
      refetchRows()
      refetchSchema()
    },
  })

  const insertRowMutation = useMutation({
    mutationFn: async (rowData: Record<string, unknown>) => {
      if (
        !orgId ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      ) {
        throw new Error(
          "Unable to insert record: missing database or collection context. Please select a table and try again."
        )
      }
      await schemaApi.insertRow(
        orgId,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        rowData
      )
    },
    onSuccess: () => {
      refetchRows()
      refetchSchema()
    },
  })

  const updateCell = useCallback(
    async (
      row: Record<string, unknown>,
      col: ColumnSchema,
      newVal: unknown
    ) => {
      await updateCellMutation.mutateAsync({ row, col, newVal })
    },
    [updateCellMutation]
  )

  const updateRow = useCallback(
    async (
      row: Record<string, unknown>,
      updatedRow: Record<string, unknown>
    ) => {
      await updateRowMutation.mutateAsync({ row, updatedRow })
    },
    [updateRowMutation]
  )

  const deleteRow = useCallback(
    async (pkValues: Record<string, unknown>) => {
      await deleteRowMutation.mutateAsync(pkValues)
    },
    [deleteRowMutation]
  )

  const insertRow = useCallback(
    async (rowData: Record<string, unknown>) => {
      await insertRowMutation.mutateAsync(rowData)
    },
    [insertRowMutation]
  )

  return {
    updateCell,
    updateRow,
    deleteRow,
    insertRow,
  }
}
