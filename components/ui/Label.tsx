import { LabelHTMLAttributes } from 'react'

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-sm font-medium text-neutral-700 dark:text-neutral-300 ${className}`}
      {...props}
    />
  )
}
