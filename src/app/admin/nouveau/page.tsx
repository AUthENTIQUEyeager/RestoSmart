import { FormulaireRestaurant } from '@/components/admin/FormulaireRestaurant'

export default function NouveauRestaurantPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-semibold">Créer un restaurant</h1>
      <FormulaireRestaurant />
    </div>
  )
}
