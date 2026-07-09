import clsx from 'clsx'

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', className)}>
      {children}
    </span>
  )
}
