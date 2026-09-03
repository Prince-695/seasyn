import { useState, useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { orgsApi } from "@/api/orgs"
import { orgKeys, projectKeys, schemaKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { CreateOrgModal } from "@/components/orgs/CreateOrgModal"
import { RoleBadge } from "@/components/orgs/RoleBadge"
import type { OrgWithRole } from "@/types/org"

export function OrgSwitcher() {
  const queryClient = useQueryClient()
  const { activeOrg, currentRole, setActiveOrg } = useWorkspaceStore()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { data: orgsRes, isLoading } = useQuery({
    queryKey: orgKeys.lists(),
    queryFn: async () => {
      const res = await orgsApi.getOrgs()
      return res.data ?? []
    },
  })

  const orgs: OrgWithRole[] = useMemo(() => orgsRes ?? [], [orgsRes])

  // Auto-sync active organization if not set or if current activeOrg was deleted/removed
  useEffect(() => {
    if (orgs.length > 0) {
      const currentExists = activeOrg && orgs.some((o) => o.id === activeOrg.id)
      if (!currentExists) {
        // Select first available organization
        const first = orgs[0]
        setActiveOrg(first, first.role)
      } else {
        // Ensure role stays synchronized with backend list
        const matched = orgs.find((o) => o.id === activeOrg?.id)
        if (matched && matched.role !== currentRole) {
          setActiveOrg(matched, matched.role)
        }
      }
    }
  }, [orgs, activeOrg, currentRole, setActiveOrg])

  const handleSelectOrg = (orgWithRole: OrgWithRole) => {
    if (activeOrg?.id === orgWithRole.id) return

    setActiveOrg(orgWithRole, orgWithRole.role)

    // Invalidate org-scoped and project-scoped caches when switching context
    queryClient.invalidateQueries({ queryKey: orgKeys.members(orgWithRole.id) })
    queryClient.invalidateQueries({ queryKey: projectKeys.all })
    queryClient.invalidateQueries({ queryKey: schemaKeys.all })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-full justify-start gap-2 border-border/70 bg-background/60 px-2.5 font-medium shadow-xs hover:bg-accent/80 hover:text-accent-foreground"
            />
          }
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="h-3.5 w-3.5" />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
            <span className="truncate text-xs font-semibold sm:text-sm">
              {isLoading ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading...
                </span>
              ) : (
                (activeOrg?.name ?? "Select Workspace")
              )}
            </span>
            {currentRole && (
              <RoleBadge role={currentRole} className="scale-90" />
            )}
          </div>

          <ChevronsUpDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {orgs.map((org) => {
              const isSelected = activeOrg?.id === org.id
              return (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSelectOrg(org)}
                  className="flex cursor-pointer items-center justify-between gap-2 px-2 py-2 text-sm"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                    </div>
                    <span className="truncate font-medium">{org.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <RoleBadge role={org.role} />
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              )
            })}
            {orgs.length === 0 && !isLoading && (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                No organizations found. Create your first workspace below.
              </div>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={() => setCreateModalOpen(true)}
            className="flex cursor-pointer items-center gap-2 px-2 py-2 text-sm font-medium text-primary focus:text-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Organization</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateOrgModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </>
  )
}

export default OrgSwitcher
