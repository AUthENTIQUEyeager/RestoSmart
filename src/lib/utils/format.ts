// Formate un montant en FCFA : 1500 → "1 500 FCFA"
export function fmt(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(montant)) + ' FCFA'
}

// Formate une date : "09 juil. 2026 à 14:32"
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Formate uniquement l'heure : "14:32"
export function formatHeure(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d)
}

// Minutes écoulées depuis une date (pour détecter les commandes urgentes)
export function minutesEcoulees(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date
  return Math.floor((Date.now() - d.getTime()) / 60000)
}

export const LABELS_STATUT: Record<string, string> = {
  en_attente: 'En attente',
  en_preparation: 'En préparation',
  pret: 'Prêt',
  paye: 'Payé',
  annule: 'Annulé',
}

export const COULEURS_STATUT: Record<string, string> = {
  en_attente: 'bg-brand text-white',
  en_preparation: 'bg-blue text-white',
  pret: 'bg-green text-white',
  paye: 'bg-textlight text-white',
  annule: 'bg-red text-white',
}
