'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { UtensilsCrossed } from 'lucide-react'

const HOME_BY_ROLE: Record<string, string> = {
  super_admin: '/admin',
  manager: '/dashboard',
  patron: '/patron',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      setErreur('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      setErreur('Compte non configuré. Contactez l\'administrateur.')
      setLoading(false)
      return
    }

    router.push(HOME_BY_ROLE[profile.role] ?? '/login')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <UtensilsCrossed className="text-brand" size={32} />
          <h1 className="font-display text-2xl font-semibold">RestoSmart</h1>
          <p className="text-sm text-textmid">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
          />
          <Input
            label="Mot de passe"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {erreur && <p className="text-sm text-red">{erreur}</p>}
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </main>
  )
}
