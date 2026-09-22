interface ComingSoonProps {
  title: string
}

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="bg-background text-foreground flex min-h-[60vh] items-center justify-center">
      <h1 className="text-3xl font-medium">{title} Page (Coming Soon)</h1>
    </div>
  )
}

export default ComingSoon
