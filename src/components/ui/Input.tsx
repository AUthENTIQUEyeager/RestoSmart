import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-textdark">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'h-11 rounded border border-border px-3 text-sm outline-none transition focus:border-brand',
          error && 'border-red',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  )
)
Input.displayName = 'Input'
