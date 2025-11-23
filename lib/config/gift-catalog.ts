// Phase 7: Gift catalog stub
// Replace with dynamic DB-backed config + localization.

export interface GiftItem {
  id: string
  name: string
  coinCost: number
  category: 'classic' | 'cultural' | 'premium'
  emoji: string
}

export const giftCatalog: GiftItem[] = [
  { id: 'rose', name: 'Rose', coinCost: 20, category: 'classic', emoji: '🌹' },
  { id: 'mosaic', name: 'Cultural Mosaic', coinCost: 75, category: 'cultural', emoji: '🧩' },
  { id: 'ankh', name: 'Ankh Charm', coinCost: 120, category: 'cultural', emoji: '☥' },
  { id: 'golden_drums', name: 'Golden Drums', coinCost: 300, category: 'premium', emoji: '🥁' },
]

export function getGift(id: string) {
  return giftCatalog.find(g => g.id === id)
}
