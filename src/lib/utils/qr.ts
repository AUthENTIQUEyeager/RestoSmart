import QRCode from 'qrcode'

// Détermine l'origine à utiliser pour les liens du menu.
// Priorité à window.location.origin (toujours exact, car ce code tourne
// côté client) — la variable d'env NEXT_PUBLIC_APP_URL sert seulement de
// repli si jamais la fonction est appelée hors navigateur.
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL ?? ''
}

// Génère un QR code (data URL PNG) pointant vers le menu client d'une table
export async function generateQR(slug: string, tableNumero: number): Promise<string> {
  const url = `${getBaseUrl()}/menu/${slug}?table=${tableNumero}`
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
}

// URL brute du menu (utile pour affichage/partage)
export function urlMenuTable(slug: string, tableNumero: number): string {
  return `${getBaseUrl()}/menu/${slug}?table=${tableNumero}`
}
