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

// Images Unsplash par défaut selon la catégorie
const IMAGES_CATEGORIE: Record<string, string> = {
  'Plats locaux': 'photo-1567364816519',
  Grillades: 'photo-1555939594-58d7cb561ad1',
  Boissons: 'photo-1544145945-f90425340c7e',
  Desserts: 'photo-1563729784474-d77dbb933a9e',
}
const IMAGE_DEFAULT = 'photo-1504674900247-0877df9cc836'

export function imagePlat(imageUrl: string, categorie: string): string {
  if (imageUrl) return imageUrl
  const id = IMAGES_CATEGORIE[categorie] ?? IMAGE_DEFAULT
  return `https://images.unsplash.com/${id}?w=400&q=80`
}
