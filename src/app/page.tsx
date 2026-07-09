import Link from 'next/link'
import { UtensilsCrossed, QrCode, Zap, WifiOff } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="text-brand" size={26} />
          <span className="font-display text-xl font-semibold">RestoSmart</span>
        </div>
        <Link
          href="/login"
          className="rounded bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Connexion
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
        <h1 className="font-display text-4xl font-semibold leading-tight text-textdark md:text-5xl">
          Le menu papier n&apos;a plus sa place dans votre restaurant
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-textmid">
          Vos clients commandent en scannant un QR code. Votre cuisine reçoit tout en temps réel.
          Votre caisse encaisse en un clic. Fonctionne même sans connexion.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-[52px] items-center justify-center rounded bg-brand px-8 font-medium text-white hover:bg-brand-dark"
        >
          Accéder à mon espace
        </Link>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-3">
        {[
          { icon: QrCode, titre: 'QR code par table', texte: 'Chaque table a son propre QR code, généré automatiquement.' },
          { icon: Zap, titre: 'Temps réel', texte: 'La cuisine et la caisse voient les commandes instantanément.' },
          { icon: WifiOff, titre: 'Fonctionne hors-ligne', texte: 'Coupure internet ? Tout continue, la synchro se fait au retour.' },
        ].map(({ icon: Icon, titre, texte }) => (
          <div key={titre} className="rounded-lg border border-border bg-white p-6">
            <Icon className="text-brand" size={24} />
            <h3 className="mt-3 font-semibold">{titre}</h3>
            <p className="mt-1 text-sm text-textmid">{texte}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
