# RestoSmart — Instructions de déploiement

## 1. Créer le projet Supabase
1. https://supabase.com → New project
2. SQL Editor → coller le contenu de `supabase/schema.sql` → Run
3. Storage → créer un bucket public nommé `plats` (pour les photos des plats)
4. Récupérer : Project URL, `anon` key, `service_role` key (Settings → API)

## 2. Créer le premier compte super_admin
Dans Supabase, Auth → Users → **Add user** (email + mot de passe, confirmer l'email).
Puis dans SQL Editor :
```sql
insert into profiles (id, role, nom)
values ('<uuid-du-user-créé>', 'super_admin', 'Votre nom');
```

## 3. Variables d'environnement (Vercel → Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_APP_URL=https://<votre-projet>.vercel.app
```
⚠️ `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être préfixée `NEXT_PUBLIC_`.

## 4. Déploiement Vercel
```bash
npm install
vercel --prod
```
Ou : connecter le repo GitHub à Vercel (import automatique, Next.js détecté).

## 5. Icônes PWA
Des icônes placeholder (monogramme "R" orange) sont dans `public/icons/`.
Remplacez-les par votre vrai logo aux mêmes dimensions (72, 96, 128, 192, 512 px).

## 6. Test du flux complet
1. Connectez-vous en super_admin → `/admin/nouveau` → créez un restaurant
2. Connectez-vous avec le compte manager créé → `/dashboard`
3. Allez dans **Tables & QR codes** → scannez un QR (ou ouvrez son URL) → `/menu/[slug]?table=1`
4. Passez une commande côté client → vérifiez qu'elle apparaît en temps réel dans **Cuisine**
5. Marquez-la "Prêt" → encaissez-la dans **Caisse**

## Notes techniques
- **Rate limiting** sur `/api/menu/commandes` : implémenté en mémoire (simple, suffisant pour un seul restaurant/instance). Sur Vercel avec plusieurs instances actives, chaque instance a son propre compteur — pour une garantie stricte, migrer vers Upstash Redis.
- **RLS** : une policy `commandes_select_anon` a été ajoutée par rapport au schéma initial fourni, car le polling de statut client (`/api/menu/statut/[id]`) doit pouvoir lire une commande sans authentification.
- **Offline** : Dexie stocke plats + commandes localement ; toute commande passée hors-ligne est mise en `sync_queue` et envoyée automatiquement au retour de connexion (écoute `online` + polling de secours 15s).
