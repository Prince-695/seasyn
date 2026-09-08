import { cn } from "@/lib/utils"
import {
  SchemaTree,
  SchemaStudioHeader,
  SchemaStudioContent,
} from "@/components/schema"
import { useSchemaExplorer } from "@/hooks/useSchemaExplorer"

export function SchemaExplorerPage() {
  const {
    projects,
    effectiveProjectId,
    connections,
    activeConnection,
    effectiveConnId,
    targetConnection,
    isConnectionsLoading,
    tables,
    effectiveTableName,
    activeTable,
    isSchemaLoading,
    terminology,
    queryResult,
    isRowsLoading,
    setQueryParams,
    schemaDiff,
    isDiffLoading,
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    selectTable,
    selectProject,
    selectConnection,
    refreshAll,
    updateCell,
    updateRow,
    deleteRow,
    insertRow,
  } = useSchemaExplorer()

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* ── Studio Top Toolbar ── */}
      <SchemaStudioHeader
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        projects={projects}
        effectiveProjectId={effectiveProjectId}
        onSelectProject={selectProject}
        connections={connections}
        effectiveConnId={effectiveConnId}
        onSelectConnection={selectConnection}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        terminology={terminology}
        onRefresh={refreshAll}
        isRefreshing={isSchemaLoading || isRowsLoading}
      />

      {/* ── Main Studio Split Workspace ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Collapsible Schema Tree */}
        {activeTab !== "diff" && (
          <aside
            className={cn(
              "shrink-0 transition-all duration-200",
              isSidebarCollapsed ? "w-0 overflow-hidden" : "w-64 sm:w-72"
            )}
          >
            <SchemaTree
              tables={tables}
              selectedTable={effectiveTableName}
              onSelectTable={selectTable}
              databaseName={activeConnection?.name || "database"}
              dbType={activeConnection?.db_type || "postgres"}
              isLoading={isSchemaLoading}
            />
          </aside>
        )}

        {/* Right Pane: Active Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6">
          <SchemaStudioContent
            connections={connections}
            isConnectionsLoading={isConnectionsLoading}
            activeConnection={activeConnection}
            targetConnection={targetConnection}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            effectiveTableName={effectiveTableName}
            activeTable={activeTable}
            queryResult={queryResult}
            isRowsLoading={isRowsLoading}
            isDiffLoading={isDiffLoading}
            schemaDiff={schemaDiff}
            terminology={terminology}
            onRefreshRows={refreshAll}
            setQueryParams={setQueryParams}
            onUpdateCell={updateCell}
            onUpdateRow={updateRow}
            onDeleteRow={deleteRow}
            onInsertRow={insertRow}
          />
        </main>
      </div>
    </div>
  )
}

export default SchemaExplorerPage
