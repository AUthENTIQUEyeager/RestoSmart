import { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  const sizes = { md: 'h-11 px-4 text-sm', lg: 'h-[52px] px-6 text-base' }
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'bg-white text-textdark border border-border hover:bg-bg',
    ghost: 'bg-transparent text-textmid hover:bg-bg',
    danger: 'bg-red text-white hover:opacity-90',
    success: 'bg-green text-white hover:opacity-90',
  }
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  )
}
