'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface PatronExistant {
  id: string
  nom: string
}

export function FormulaireRestaurant() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [patrons, setPatrons] = useState<PatronExistant[]>([])
  const [typeProprietaire, setTypeProprietaire] = useState<'nouveau' | 'existant' | 'aucun'>('nouveau')

  const [form, setForm] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    date_fin_abo: '',
    manager_email: '',
    manager_password: '',
    manager_nom: '',
    patron_nom: '',
    patron_email: '',
    patron_password: '',
    patron_existant_id: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('id, nom')
      .eq('role', 'patron')
      .then(({ data }) => setPatrons(data ?? []))
  }, [])

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setLoading(true)

    const res = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, proprietaire_type: typeProprietaire }),
    })
    const data = await res.json()

    if (!res.ok) {
      setErreur(data.error ?? 'Une erreur est survenue')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Restaurant</h2>
        <Input label="Nom de la boutique *" required value={form.nom} onChange={(e) => update('nom', e.target.value)} />
        <Input label="Adresse" value={form.adresse} onChange={(e) => update('adresse', e.target.value)} />
        <Input label="Téléphone" value={form.telephone} onChange={(e) => update('telephone', e.target.value)} />
        <Input
          label="Date de fin d'abonnement *"
          type="date"
          required
          value={form.date_fin_abo}
          onChange={(e) => update('date_fin_abo', e.target.value)}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Manager</h2>
        <Input
          label="Email du manager *"
          type="email"
          required
          value={form.manager_email}
          onChange={(e) => update('manager_email', e.target.value)}
        />
        <Input
          label="Mot de passe *"
          type="password"
          required
          minLength={8}
          value={form.manager_password}
          onChange={(e) => update('manager_password', e.target.value)}
        />
        <Input
          label="Nom complet du manager *"
          required
          value={form.manager_nom}
          onChange={(e) => update('manager_nom', e.target.value)}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Propriétaire</h2>
        <div className="flex gap-4">
          {[
            { value: 'nouveau', label: 'Nouveau propriétaire' },
            { value: 'existant', label: 'Propriétaire existant' },
            { value: 'aucun', label: 'Aucun' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="typeProprietaire"
                checked={typeProprietaire === opt.value}
                onChange={() => setTypeProprietaire(opt.value as typeof typeProprietaire)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {typeProprietaire === 'nouveau' && (
          <div className="flex flex-col gap-4 rounded border border-border bg-bg p-4">
            <Input
              label="Nom du propriétaire *"
              required
              value={form.patron_nom}
              onChange={(e) => update('patron_nom', e.target.value)}
            />
            <Input
              label="Email du patron (optionnel)"
              type="email"
              value={form.patron_email}
              onChange={(e) => update('patron_email', e.target.value)}
            />
            {form.patron_email && (
              <Input
                label="Mot de passe du patron"
                type="password"
                minLength={8}
                value={form.patron_password}
                onChange={(e) => update('patron_password', e.target.value)}
              />
            )}
          </div>
        )}

        {typeProprietaire === 'existant' && (
          <select
            className="h-11 rounded border border-border px-3 text-sm"
            value={form.patron_existant_id}
            onChange={(e) => update('patron_existant_id', e.target.value)}
          >
            <option value="">Sélectionner un patron</option>
            {patrons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        )}
      </section>

      {erreur && <p className="text-sm text-red">{erreur}</p>}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Création en cours...' : 'Créer le restaurant'}
      </Button>
    </form>
  )
}
