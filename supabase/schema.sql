-- ══════════════════════════════════════════════
-- RESTOSMART — SCHÉMA SUPABASE COMPLET
-- ══════════════════════════════════════════════

-- PROFILES (étendu depuis auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('super_admin','manager','patron')),
  nom         TEXT NOT NULL,
  telephone   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RESTAURANTS
CREATE TABLE restaurants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  adresse         TEXT,
  telephone       TEXT,
  logo_url        TEXT,
  date_fin_abo    DATE NOT NULL,
  actif           BOOLEAN DEFAULT true,
  manager_id      UUID REFERENCES profiles(id),
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- RELATION PATRON <-> RESTAURANTS (many-to-many)
CREATE TABLE patron_restaurants (
  patron_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id  UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  PRIMARY KEY (patron_id, restaurant_id)
);

-- PLATS
CREATE TABLE plats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  description   TEXT DEFAULT '',
  prix          NUMERIC(10,2) NOT NULL,
  image_url     TEXT DEFAULT '',
  categorie     TEXT DEFAULT 'Plats',
  disponible    BOOLEAN DEFAULT true,
  temps_prep    INTEGER DEFAULT 15,
  ordre         INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- TABLES DU RESTAURANT
CREATE TABLE tables_resto (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  numero        INTEGER NOT NULL,
  nom           TEXT,
  capacite      INTEGER DEFAULT 4,
  UNIQUE(restaurant_id, numero)
);

-- COMMANDES
CREATE TABLE commandes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id      UUID REFERENCES tables_resto(id),
  table_numero  INTEGER NOT NULL,
  statut        TEXT DEFAULT 'en_attente'
                CHECK (statut IN ('en_attente','en_preparation','pret','paye','annule')),
  total         NUMERIC(10,2) DEFAULT 0,
  note          TEXT DEFAULT '',
  methode_paiement TEXT DEFAULT 'especes',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- LIGNES DE COMMANDE
CREATE TABLE lignes_commande (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id   UUID NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  plat_id       UUID REFERENCES plats(id),
  plat_nom      TEXT NOT NULL,
  quantite      INTEGER NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(10,2) NOT NULL
);

-- PAIEMENTS
CREATE TABLE paiements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id   UUID NOT NULL REFERENCES commandes(id),
  montant       NUMERIC(10,2) NOT NULL,
  methode       TEXT DEFAULT 'especes',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- INDEX
CREATE INDEX idx_plats_restaurant       ON plats(restaurant_id);
CREATE INDEX idx_tables_restaurant      ON tables_resto(restaurant_id);
CREATE INDEX idx_commandes_restaurant   ON commandes(restaurant_id);
CREATE INDEX idx_commandes_statut       ON commandes(statut);
CREATE INDEX idx_commandes_date         ON commandes(created_at);
CREATE INDEX idx_lignes_commande        ON lignes_commande(commande_id);
CREATE INDEX idx_restaurants_slug       ON restaurants(slug);

-- TRIGGER updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_commandes_updated_at
  BEFORE UPDATE ON commandes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE restaurants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE plats            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables_resto     ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_commande  ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;

-- Helpers SECURITY DEFINER (évite la récursion RLS)
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_restaurant_id()
RETURNS UUID AS $$
  SELECT id FROM restaurants WHERE manager_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles_self"   ON profiles FOR SELECT USING (id = auth.uid() OR auth_role() = 'super_admin');
CREATE POLICY "profiles_admin"  ON profiles FOR ALL    USING (auth_role() = 'super_admin');

-- RESTAURANTS
CREATE POLICY "restaurants_manager" ON restaurants FOR SELECT
  USING (manager_id = auth.uid() OR auth_role() = 'super_admin');
CREATE POLICY "restaurants_patron"  ON restaurants FOR SELECT
  USING (id IN (SELECT restaurant_id FROM patron_restaurants WHERE patron_id = auth.uid()));
CREATE POLICY "restaurants_admin"   ON restaurants FOR ALL USING (auth_role() = 'super_admin');

-- PLATS (lecture publique pour menu client)
CREATE POLICY "plats_public"   ON plats FOR SELECT USING (true);
CREATE POLICY "plats_manager"  ON plats FOR ALL
  USING (restaurant_id = auth_restaurant_id() OR auth_role() = 'super_admin');

-- TABLES
CREATE POLICY "tables_public"  ON tables_resto FOR SELECT USING (true);
CREATE POLICY "tables_manager" ON tables_resto FOR ALL
  USING (restaurant_id = auth_restaurant_id() OR auth_role() = 'super_admin');

-- COMMANDES (insertion anonyme = commande client)
CREATE POLICY "commandes_insert_anon" ON commandes FOR INSERT WITH CHECK (true);
CREATE POLICY "commandes_manager"     ON commandes FOR ALL
  USING (restaurant_id = auth_restaurant_id() OR auth_role() = 'super_admin');
CREATE POLICY "commandes_patron"      ON commandes FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM patron_restaurants WHERE patron_id = auth.uid()));
-- Statut visible publiquement pour le polling client (lecture par id uniquement côté appli)
CREATE POLICY "commandes_select_anon" ON commandes FOR SELECT USING (true);

-- LIGNES
CREATE POLICY "lignes_insert_anon" ON lignes_commande FOR INSERT WITH CHECK (true);
CREATE POLICY "lignes_select"      ON lignes_commande FOR SELECT USING (true);

-- PAIEMENTS
CREATE POLICY "paiements_manager" ON paiements FOR ALL
  USING (commande_id IN (SELECT id FROM commandes WHERE restaurant_id = auth_restaurant_id())
         OR auth_role() = 'super_admin');

-- ══════════════════════════════════════════════
-- CORRECTIF : lecture publique du restaurant par slug
-- (nécessaire pour que le menu client anonyme fonctionne)
-- ══════════════════════════════════════════════
CREATE POLICY "restaurants_public" ON restaurants FOR SELECT USING (true);

-- ══════════════════════════════════════════════
-- CORRECTIF : Storage — bucket "plats" + policies
-- (sans ça, l'upload échoue silencieusement : RLS bloque
-- storage.objects par défaut tant qu'aucune policy n'existe)
-- ══════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('plats', 'plats', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "plats_images_lecture_publique" ON storage.objects
  FOR SELECT USING (bucket_id = 'plats');

CREATE POLICY "plats_images_ecriture_authentifie" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'plats' AND auth.role() = 'authenticated');

CREATE POLICY "plats_images_modification_authentifie" ON storage.objects
  FOR UPDATE USING (bucket_id = 'plats' AND auth.role() = 'authenticated');

CREATE POLICY "plats_images_suppression_authentifie" ON storage.objects
  FOR DELETE USING (bucket_id = 'plats' AND auth.role() = 'authenticated');
