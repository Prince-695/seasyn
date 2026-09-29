import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Helper to determine accurate BSON / JSON type name
function getFieldType(val: unknown): string {
  if (val === null) return "null"
  if (val === undefined) return "undefined"
  if (Array.isArray(val)) return "array"
  if (typeof val === "object") {
    if ("$oid" in (val as Record<string, unknown>)) return "ObjectId"
    if ("$date" in (val as Record<string, unknown>)) return "Date"
    return "object"
  }
  if (typeof val === "string") {
    if (/^[0-9a-fA-F]{24}$/.test(val)) return "ObjectId"
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return "ISODate"
    return "string"
  }
  if (typeof val === "number") {
    return Number.isInteger(val) ? "int" : "double"
  }
  if (typeof val === "boolean") return "boolean"
  return typeof val
}

interface JsonNodeProps {
  keyName: string
  value: unknown
  depth?: number
}

// Tree node for rendering individual JSON key-values with collapsible nesting
export function JsonNode({ keyName, value, depth = 0 }: JsonNodeProps) {
  const type = getFieldType(value)
  const isExpandable =
    type === "object" ||
    type === "array" ||
    (typeof value === "object" && value !== null)
  const [isExpanded, setIsExpanded] = useState(depth < 2)

  return (
    <div className="font-mono text-xs leading-relaxed">
      <div
        className={cn(
          "hover:bg-muted/30 flex items-start gap-1.5 rounded-sm px-1 py-0.5 transition-colors",
          depth > 0 && "border-border/40 ml-4 border-l pl-2"
        )}
      >
        {isExpandable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground mt-0.5 h-auto w-auto shrink-0 cursor-pointer p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span className="text-primary/90 font-medium select-all">
          {keyName}:
        </span>

        {/* Type Badge */}
        <span
          className={cn(
            "rounded px-1 text-[10px] font-medium uppercase",
            type === "ObjectId" &&
              "border-primary/20 bg-primary/10 text-primary border",
            type === "string" && "text-success",
            (type === "int" || type === "double") && "text-warning",
            type === "boolean" && "text-info",
            type === "array" && "text-muted-foreground",
            type === "object" && "text-muted-foreground",
            type === "ISODate" && "border-info/20 bg-info/10 text-info border",
            type === "null" && "text-muted-foreground"
          )}
        >
          {type === "array"
            ? `Array(${(value as unknown[]).length})`
            : type === "object"
              ? "Object"
              : type}
        </span>

        {/* Primitive Value Representation */}
        {!isExpandable && (
          <span className="text-foreground/90 break-all select-all">
            {type === "string"
              ? `"${String(value)}"`
              : type === "boolean"
                ? value
                  ? "true"
                  : "false"
                : type === "null"
                  ? "null"
                  : String(value)}
          </span>
        )}
      </div>

      {/* Recursive Nested Children */}
      {isExpandable && isExpanded && value !== null && (
        <div className="space-y-0.5">
          {Array.isArray(value)
            ? value.map((item, idx) => (
                <JsonNode
                  key={idx}
                  keyName={String(idx)}
                  value={item}
                  depth={depth + 1}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(
                ([nestedKey, nestedVal]) => (
                  <JsonNode
                    key={nestedKey}
                    keyName={nestedKey}
                    value={nestedVal}
                    depth={depth + 1}
                  />
                )
              )}
        </div>
      )}
    </div>
  )
}
