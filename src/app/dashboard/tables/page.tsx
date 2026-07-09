'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { generateQR, urlMenuTable } from '@/lib/utils/qr'
import { Plus, Trash2, Download } from 'lucide-react'

interface TableResto {
  id: string
  numero: number
  nom: string | null
  capacite: number
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableResto[]>([])
  const [slug, setSlug] = useState('')
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})
  const [nouveauNumero, setNouveauNumero] = useState('')

  async function charger() {
    const res = await fetch('/api/dashboard/tables')
    const data = await res.json()
    setTables(data.tables ?? [])
    setSlug(data.slug ?? '')
  }

  useEffect(() => {
    charger()
  }, [])

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      const codes: Record<string, string> = {}
      for (const t of tables) {
        codes[t.id] = await generateQR(slug, t.numero)
      }
      setQrCodes(codes)
    })()
  }, [tables, slug])

  async function ajouterTable(e: React.FormEvent) {
    e.preventDefault()
    if (!nouveauNumero) return
    await fetch('/api/dashboard/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: Number(nouveauNumero), nom: `Table ${nouveauNumero}`, capacite: 4 }),
    })
    setNouveauNumero('')
    charger()
  }

  async function supprimerTable(id: string) {
    if (!confirm('Supprimer cette table ?')) return
    await fetch(`/api/dashboard/tables?id=${id}`, { method: 'DELETE' })
    charger()
  }

  function telecharger(qr: string, numero: number) {
    const a = document.createElement('a')
    a.href = qr
    a.download = `table-${numero}-qr.png`
    a.click()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Tables & QR codes</h1>
      </div>

      <form onSubmit={ajouterTable} className="flex items-end gap-3">
        <Input
          label="Numéro de la nouvelle table"
          type="number"
          value={nouveauNumero}
          onChange={(e) => setNouveauNumero(e.target.value)}
          className="w-48"
        />
        <Button type="submit"><Plus size={16} /> Ajouter</Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <div key={t.id} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-white p-5">
            <p className="font-display text-lg font-semibold">{t.nom ?? `Table ${t.numero}`}</p>
            {qrCodes[t.id] && <img src={qrCodes[t.id]} alt={`QR table ${t.numero}`} className="h-40 w-40" />}
            <p className="break-all text-center text-xs text-textlight">{urlMenuTable(slug, t.numero)}</p>
            <div className="flex gap-2">
              <Button size="md" variant="secondary" onClick={() => qrCodes[t.id] && telecharger(qrCodes[t.id], t.numero)}>
                <Download size={16} /> Télécharger
              </Button>
              <Button size="md" variant="danger" onClick={() => supprimerTable(t.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
