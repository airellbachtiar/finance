import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-emerald-800 text-white hover:bg-emerald-900 disabled:bg-emerald-300 dark:bg-emerald-700 dark:hover:bg-emerald-600 dark:disabled:bg-emerald-900',
  secondary:
    'border border-neutral-300 dark:border-neutral-700 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800',
  danger: 'text-red-600 hover:text-red-700 hover:underline',
  ghost: 'text-emerald-600 dark:text-emerald-400 hover:underline',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    variant === 'danger' || variant === 'ghost'
      ? 'text-sm font-medium disabled:opacity-50 disabled:pointer-events-none'
      : 'rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

  return <button className={`${base} ${variantClasses[variant]} ${className}`} {...props} />
}
