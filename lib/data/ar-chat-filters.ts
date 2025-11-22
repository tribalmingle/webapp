export type ArChatFilter = {
  id: string
  name: string
  description: string
  compatibility: Array<'web' | 'ios' | 'android'>
  previewUrl: string
  effectUrl: string
  tags: string[]
}

export const arChatFilters: ArChatFilter[] = [
  {
    id: 'aurora-kente',
    name: 'Aurora Kente',
    description: 'Soft neon gradients wrap around Ankara/Kente patterns to celebrate heritage while keeping modern lighting.',
    compatibility: ['web', 'ios', 'android'],
    previewUrl: '/filters/aurora-kente.jpg',
    effectUrl: 'https://cdn.tribalmingle.com/ar/aurora-kente.json',
    tags: ['heritage', 'glow', 'premium'],
  },
  {
    id: 'guardian-glow',
    name: 'Guardian Glow',
    description: 'Adds warm lantern light, soft-focus vignette, and a trust badge shimmer. Built for first guardian-approved chats.',
    compatibility: ['ios', 'android'],
    previewUrl: '/filters/guardian-glow.jpg',
    effectUrl: 'https://cdn.tribalmingle.com/ar/guardian-glow.json',
    tags: ['trust', 'guardian'],
  },
  {
    id: 'travel-holo',
    name: 'Travel Holo',
    description: 'Overlay flight path holograms + timezone clocks, perfect for long-distance planning sessions.',
    compatibility: ['web', 'ios'],
    previewUrl: '/filters/travel-holo.jpg',
    effectUrl: 'https://cdn.tribalmingle.com/ar/travel-holo.json',
    tags: ['long-distance', 'utility'],
  },
]
