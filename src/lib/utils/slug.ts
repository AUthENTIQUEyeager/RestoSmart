// "Chez Mamie Bobo" → "chez-mamie-bobo"
export function generateSlug(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Ajoute un suffixe numérique si le slug existe déjà (ex: "chez-mamie-2")
export function slugUnique(base: string, existants: string[]): string {
  if (!existants.includes(base)) return base
  let i = 2
  while (existants.includes(`${base}-${i}`)) i++
  return `${base}-${i}`
}

// Initiale d'un plat pour le placeholder visuel quand aucune photo n'est disponible
export function initialePlat(nom: string): string {
  return nom.trim().charAt(0).toUpperCase() || '?'
}
