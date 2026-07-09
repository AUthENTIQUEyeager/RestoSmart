'use client'

import { useEffect, useState, useMemo } from 'react'
import { PlatCard, type PlatMenu } from './PlatCard'
import { DetailPlat } from './DetailPlat'
import { Panier, type ArticlePanier } from './Panier'
import { db } from '@/lib/dexie/db'
import { enqueue, flushSyncQueue, registerAutoSync } from '@/lib/dexie/sync'
import { useOffline } from '@/lib/hooks/useOffline'
import { fmt } from '@/lib/utils/format'
import { ShoppingBag, WifiOff, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  slug: string
  tableNumero: number
  restaurantNom: string
}

type Ecran = 'menu' | 'confirmation'

export function MenuClient({ slug, tableNumero, restaurantNom }: Props) {
  const [plats, setPlats] = useState<PlatMenu[]>([])
  const [chargement, setChargement] = useState(true)
  const [categorieActive, setCategorieActive] = useState('')
  const [platDetail, setPlatDetail] = useState<PlatMenu | null>(null)
  const [panierOuvert, setPanierOuvert] = useState(false)
  const [panier, setPanier] = useState<ArticlePanier[]>([])
  const [note, setNote] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [ecran, setEcran] = useState<Ecran>('menu')
  const [commandeId, setCommandeId] = useState<string | null>(null)
  const [statutCommande, setStatutCommande] = useState('en_attente')
  const isOffline = useOffline()

  // Chargement initial : réseau si possible, sinon cache Dexie
  useEffect(() => {
    registerAutoSync()
    ;(async () => {
      try {
        const res = await fetch(`/api/menu/${slug}/plats`)
        const data = await res.json()
        if (data.plats) {
          setPlats(data.plats)
          await db.plats.bulkPut(
            data.plats.map((p: PlatMenu) => ({ ...p, restaurant_id: slug }))
          )
        }
      } catch {
        const cache = await db.plats.where('restaurant_id').equals(slug).toArray()
        setPlats(cache as unknown as PlatMenu[])
      } finally {
        setChargement(false)
      }
    })()
  }, [slug])

  const categories = useMemo(() => Array.from(new Set(plats.map((p) => p.categorie))), [plats])

  useEffect(() => {
    if (categories.length && !categorieActive) setCategorieActive(categories[0])
  }, [categories, categorieActive])

  const platsFiltres = plats.filter((p) => p.categorie === categorieActive)

  function ajouterAuPanier(plat: PlatMenu) {
    setPanier((p) => {
      const existe = p.find((a) => a.plat_id === plat.id)
      if (existe) return p.map((a) => (a.plat_id === plat.id ? { ...a, quantite: a.quantite + 1 } : a))
      return [...p, { plat_id: plat.id, nom: plat.nom, prix: plat.prix, quantite: 1 }]
    })
    setPlatDetail(null)
  }

  function changerQuantite(platId: string, delta: number) {
    setPanier((p) =>
      p
        .map((a) => (a.plat_id === platId ? { ...a, quantite: a.quantite + delta } : a))
        .filter((a) => a.quantite > 0)
    )
  }

  const quantiteDansPanier = (platId: string) => panier.find((a) => a.plat_id === platId)?.quantite ?? 0

  async function envoyerCommande() {
    setEnvoiEnCours(true)
    const id = crypto.randomUUID()
    const payload = {
      restaurant_slug: slug,
      table_numero: tableNumero,
      note,
      lignes: panier.map((a) => ({
        plat_id: a.plat_id,
        plat_nom: a.nom,
        quantite: a.quantite,
        prix_unitaire: a.prix,
      })),
    }

    // Stockage offline systématique d'abord
    await db.commandes.put({
      id,
      restaurant_id: slug,
      table_id: null,
      table_numero: tableNumero,
      statut: 'en_attente',
      total: panier.reduce((s, a) => s + a.prix * a.quantite, 0),
      note,
      methode_paiement: 'especes',
      lignes: panier.map((a) => ({ plat_id: a.plat_id, plat_nom: a.nom, quantite: a.quantite, prix_unitaire: a.prix })),
      synced: 0,
      created_at: new Date().toISOString(),
    })

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/menu/commandes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.commande) {
          setCommandeId(data.commande.id)
          await db.commandes.update(id, { synced: 1 })
        } else {
          setCommandeId(id) // suivi local en attendant sync
        }
      } catch {
        await enqueue({ operation: 'insert', table: 'commandes', data: payload, created_at: new Date().toISOString() })
        setCommandeId(id)
      }
    } else {
      await enqueue({ operation: 'insert', table: 'commandes', data: payload, created_at: new Date().toISOString() })
      setCommandeId(id)
    }

    setPanier([])
    setPanierOuvert(false)
    setEnvoiEnCours(false)
    setEcran('confirmation')
  }

  // Polling statut toutes les 5s une fois la commande envoyée (si en ligne)
  useEffect(() => {
    if (ecran !== 'confirmation' || !commandeId) return
    const interval = setInterval(async () => {
      if (!navigator.onLine) return
      try {
        const res = await fetch(`/api/menu/statut/${commandeId}`)
        const data = await res.json()
        if (data.commande) setStatutCommande(data.commande.statut)
      } catch {
        // silencieux, on retentera au prochain tick
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [ecran, commandeId])

  const totalPanier = panier.reduce((s, a) => s + a.prix * a.quantite, 0)
  const nombreArticles = panier.reduce((s, a) => s + a.quantite, 0)

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    )
  }

  if (ecran === 'confirmation') {
    return <EcranConfirmation restaurantNom={restaurantNom} tableNumero={tableNumero} statut={statutCommande} total={totalPanier} />
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {isOffline && (
        <div className="flex items-center justify-center gap-2 bg-textdark py-2 text-xs text-white">
          <WifiOff size={14} /> Mode hors-ligne — votre commande sera envoyée au retour de connexion
        </div>
      )}

      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <h1 className="font-display text-lg font-semibold">{restaurantNom}</h1>
        <span className="rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand">
          Table {tableNumero}
        </span>
      </header>

      <div className="sticky top-[65px] z-10 flex gap-2 overflow-x-auto bg-bg px-4 py-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategorieActive(cat)}
            className={clsx(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium',
              categorieActive === cat ? 'bg-brand text-white' : 'bg-white text-textmid border border-border'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4 py-2">
        {platsFiltres.map((plat) => (
          <PlatCard key={plat.id} plat={plat} onClick={() => setPlatDetail(plat)} />
        ))}
      </div>

      {platDetail && (
        <DetailPlat
          plat={platDetail}
          quantiteDansPanier={quantiteDansPanier(platDetail.id)}
          onClose={() => setPlatDetail(null)}
          onAjouter={() => ajouterAuPanier(platDetail)}
          onChangerQuantite={(delta) => changerQuantite(platDetail.id, delta)}
        />
      )}

      {panierOuvert && (
        <Panier
          articles={panier}
          note={note}
          onNoteChange={setNote}
          onChangerQuantite={changerQuantite}
          onFermer={() => setPanierOuvert(false)}
          onEnvoyer={envoyerCommande}
          envoiEnCours={envoiEnCours}
        />
      )}

      {nombreArticles > 0 && !panierOuvert && (
        <button
          onClick={() => setPanierOuvert(true)}
          className="fixed bottom-4 left-4 right-4 flex h-[52px] items-center justify-between rounded-full bg-brand px-5 text-white shadow-lg"
        >
          <span className="flex items-center gap-2 font-medium">
            <ShoppingBag size={18} /> {nombreArticles} article{nombreArticles > 1 ? 's' : ''}
          </span>
          <span className="font-semibold">{fmt(totalPanier)}</span>
        </button>
      )}
    </div>
  )
}

function EcranConfirmation({
  restaurantNom,
  tableNumero,
  statut,
  total,
}: {
  restaurantNom: string
  tableNumero: number
  statut: string
  total: number
}) {
  const LABELS: Record<string, string> = {
    en_attente: 'Commande reçue, en attente de préparation',
    en_preparation: 'Votre commande est en préparation',
    pret: 'Votre commande est prête !',
    paye: 'Commande payée — merci !',
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
        <ShoppingBag size={28} />
      </div>
      <h1 className="font-display text-xl font-semibold">Merci pour votre commande !</h1>
      <p className="text-textmid">{restaurantNom} — Table {tableNumero}</p>
      <p className="text-lg font-semibold text-brand">{LABELS[statut] ?? statut}</p>
      <p className="text-sm text-textlight">Total : {fmt(total)}</p>
    </div>
  )
}
