import { LucideIcon } from 'lucide-react'

export function CardStat({
  icon: Icon,
  label,
  valeur,
  couleur = 'text-brand',
}: {
  icon: LucideIcon
  label: string
  valeur: string | number
  couleur?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <Icon className={couleur} size={20} />
      <p className="mt-2 text-2xl font-semibold">{valeur}</p>
      <p className="text-sm text-textmid">{label}</p>
    </div>
  )
}
