import type { ReactNode } from 'react'

export default function WaitLocationPin({
  label,
  title,
  href,
  className = '',
  icon,
}: {
  label: ReactNode
  title?: string
  href?: string
  className?: string
  icon?: ReactNode
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-tight ' +
    'bg-[#f5f5f4]/95 text-[#44403c] border border-[#e7e5e4] shadow-sm hover:shadow transition-shadow'

  const content = (
    <>
      {icon != null && (
        <span aria-hidden className="text-[12px] leading-none">
          {icon}
        </span>
      )}
      <span className="leading-none">{label}</span>
    </>
  )

  if (href) {
    return (
      <a href={href} title={title} className={`${base} ${className}`}>
        {content}
      </a>
    )
  }

  return (
    <span title={title} className={`${base} ${className}`}>
      {content}
    </span>
  )
}
