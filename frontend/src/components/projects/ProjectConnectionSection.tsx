import type { LucideIcon } from "lucide-react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectionCard } from "@/components/connections/ConnectionCard"
import { ConnectionWizardModal } from "@/components/connections/ConnectionWizardModal"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import type { PublicDatabaseConnection } from "@/types"
import { cn } from "@/lib/utils"

interface ProjectConnectionSectionProps {
  title: string
  description: string
  icon: LucideIcon
  iconBadgeClass: string
  connections: PublicDatabaseConnection[]
  isLoading: boolean
  isSource: boolean
  projectId: string
  addBtnText: string
  emptyTitle: string
  emptyDesc: string
  emptyBtnText: string
  onDelete: (conn: PublicDatabaseConnection) => void
  onInspectSchema: (conn: PublicDatabaseConnection) => void
  className?: string
}

export function ProjectConnectionSection({
  title,
  description,
  icon: Icon,
  iconBadgeClass,
  connections,
  isLoading,
  isSource,
  projectId,
  addBtnText,
  emptyTitle,
  emptyDesc,
  emptyBtnText,
  onDelete,
  onInspectSchema,
  className,
}: ProjectConnectionSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border",
              iconBadgeClass
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              {title} ({connections.length})
            </h3>
            <p className="text-muted-foreground text-[11px]">{description}</p>
          </div>
        </div>

        <PermissionGuard allowedRoles={["owner", "admin"]}>
          <ConnectionWizardModal
            projectId={projectId}
            defaultIsSource={isSource}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{addBtnText}</span>
              </Button>
            }
          />
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="border-border/60 bg-muted/10 flex h-32 items-center justify-center rounded-xl border">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
        </div>
      ) : connections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              onDelete={onDelete}
              onInspectSchema={onInspectSchema}
            />
          ))}
        </div>
      ) : (
        <div className="border-border/80 bg-muted/10 flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <Icon className="text-muted-foreground/60 h-8 w-8" />
          <h4 className="text-foreground mt-2 text-xs font-semibold">
            {emptyTitle}
          </h4>
          <p className="text-muted-foreground mt-1 max-w-sm text-[11px]">
            {emptyDesc}
          </p>
          <PermissionGuard allowedRoles={["owner", "admin"]}>
            <div className="mt-3">
              <ConnectionWizardModal
                projectId={projectId}
                defaultIsSource={isSource}
                trigger={
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    <span>{emptyBtnText}</span>
                  </Button>
                }
              />
            </div>
          </PermissionGuard>
        </div>
      )}
    </div>
  )
}
