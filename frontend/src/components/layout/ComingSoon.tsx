interface ComingSoonProps {
  title: string
}

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">
        {title} Page (Coming Soon)
      </h1>
    </div>
  )
}

export default ComingSoon
