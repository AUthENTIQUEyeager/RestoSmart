'use client'

import { useEffect, useState } from 'react'
import { PlatCard, type Plat } from '@/components/dashboard/PlatCard'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

const CATEGORIES = ['Plats locaux', 'Grillades', 'Boissons', 'Desserts']

const VIDE = { nom: '', description: '', prix: 0, image_url: '', categorie: 'Plats locaux', disponible: true, temps_prep: 15 }

export default function PlatsPage() {
  const [plats, setPlats] = useState<Plat[]>([])
  const [modalOuvert, setModalOuvert] = useState(false)
  const [platEdite, setPlatEdite] = useState<Plat | null>(null)
  const [form, setForm] = useState(VIDE)
  const [uploading, setUploading] = useState(false)

  async function charger() {
    const res = await fetch('/api/dashboard/plats')
    const data = await res.json()
    setPlats(data.plats ?? [])
  }

  useEffect(() => {
    charger()
  }, [])

  function ouvrirNouveau() {
    setPlatEdite(null)
    setForm(VIDE)
    setModalOuvert(true)
  }

  function ouvrirEdition(plat: Plat) {
    setPlatEdite(plat)
    setForm({ ...plat })
    setModalOuvert(true)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/dashboard/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setForm((f) => ({ ...f, image_url: data.url }))
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (platEdite) {
      await fetch('/api/dashboard/plats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: platEdite.id, ...form }),
      })
    } else {
      await fetch('/api/dashboard/plats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setModalOuvert(false)
    charger()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce plat ?')) return
    await fetch(`/api/dashboard/plats?id=${id}`, { method: 'DELETE' })
    charger()
  }

  async function handleToggle(plat: Plat, disponible: boolean) {
    setPlats((p) => p.map((x) => (x.id === plat.id ? { ...x, disponible } : x)))
    await fetch('/api/dashboard/plats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plat.id, disponible }),
    })
  }

  const parCategorie = CATEGORIES.map((cat) => ({ cat, items: plats.filter((p) => p.categorie === cat) }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Plats</h1>
        <Button onClick={ouvrirNouveau}>
          <Plus size={16} /> Ajouter un plat
        </Button>
      </div>

      {parCategorie.map(({ cat, items }) => (
        <div key={cat}>
          <h2 className="mb-3 text-sm font-semibold text-textmid">{cat}</h2>
          <div className="flex flex-col gap-3">
            {items.map((plat) => (
              <PlatCard
                key={plat.id}
                plat={plat}
                onEdit={() => ouvrirEdition(plat)}
                onDelete={() => handleDelete(plat.id)}
                onToggle={(v) => handleToggle(plat, v)}
              />
            ))}
            {items.length === 0 && <p className="text-sm text-textlight">Aucun plat dans cette catégorie</p>}
          </div>
        </div>
      ))}

      <Modal open={modalOuvert} onClose={() => setModalOuvert(false)} title={platEdite ? 'Modifier le plat' : 'Nouveau plat'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom *" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Prix (FCFA) *"
            type="number"
            required
            value={form.prix}
            onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Catégorie</label>
            <select
              className="h-11 rounded border border-border px-3 text-sm"
              value={form.categorie}
              onChange={(e) => setForm({ ...form, categorie: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Input
            label="Temps de préparation (min)"
            type="number"
            value={form.temps_prep}
            onChange={(e) => setForm({ ...form, temps_prep: Number(e.target.value) })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Photo</label>
            <input type="file" accept="image/*" onChange={handleUpload} className="text-sm" />
            {uploading && <span className="text-xs text-textlight">Envoi en cours...</span>}
            {form.image_url && <img src={form.image_url} alt="" className="h-20 w-20 rounded object-cover" />}
          </div>
          <Button type="submit" size="lg">{platEdite ? 'Enregistrer' : 'Créer le plat'}</Button>
        </form>
      </Modal>
    </div>
  )
}
