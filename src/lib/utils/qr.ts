import QRCode from 'qrcode'

// Génère un QR code (data URL PNG) pointant vers le menu client d'une table
export async function generateQR(slug: string, tableNumero: number): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/menu/${slug}?table=${tableNumero}`
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
}

// URL brute du menu (utile pour affichage/partage)
export function urlMenuTable(slug: string, tableNumero: number): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/menu/${slug}?table=${tableNumero}`
}
