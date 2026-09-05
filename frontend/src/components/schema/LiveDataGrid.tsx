import {
  DatabaseDataViewer,
  type DatabaseDataViewerProps,
} from "./DatabaseDataViewer"

export type LiveDataGridProps = DatabaseDataViewerProps

/**
 * Backward-compatible wrapper alias pointing to DatabaseDataViewer
 */
export function LiveDataGrid(props: LiveDataGridProps) {
  return <DatabaseDataViewer {...props} />
}

export { DatabaseDataViewer }
