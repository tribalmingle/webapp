import { cache } from 'react'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { FeatureCollection } from 'geojson'

import type { AppLocale } from '@/lib/i18n/locales'

const DATA_PATH = path.join(process.cwd(), 'public', 'data', 'tribal-regions.geojson')

export type TribeMeta = {
  id: string
  name: string
  headline: string
  blurb: string
  stats: {
    homeBase: string
    diasporaCities: string[]
    population: string
  }
  heroCta?: string
  photo?: string
}

let geojsonCache: FeatureCollection | null = null

async function readGeoJson(): Promise<FeatureCollection> {
  if (geojsonCache) {
    return geojsonCache
  }

  const file = await fs.readFile(DATA_PATH, 'utf-8')
  geojsonCache = JSON.parse(file) as FeatureCollection
  return geojsonCache
}

const TRIBE_METADATA: TribeMeta[] = [
  {
    id: 'igbo',
    name: 'Igbo',
    headline: 'Traditions rooted in innovation',
    blurb: 'Entrepreneurial, expressive storytellers across Nigeria and the diaspora.',
    stats: {
      homeBase: 'Southeastern Nigeria',
      diasporaCities: ['Houston', 'London', 'Johannesburg'],
      population: '32M+'
    },
    heroCta: 'Meet Igbo singles'
  },
  {
    id: 'yoruba',
    name: 'Yoruba',
    headline: 'Art, language, and Orisha heritage',
    blurb: 'Culture bearers connecting Lagos to the world through art and music.',
    stats: {
      homeBase: 'Southwestern Nigeria & Benin',
      diasporaCities: ['Toronto', 'New York', 'London'],
      population: '40M+'
    },
    heroCta: 'Discover Yoruba matches'
  },
  {
    id: 'hausa',
    name: 'Hausa',
    headline: 'Northern markets meet modern love',
    blurb: 'Community-first members across Kano, Kaduna, and Sahel trade cities.',
    stats: {
      homeBase: 'Northern Nigeria & Niger',
      diasporaCities: ['Abuja', 'Accra', 'Berlin'],
      population: '36M+'
    },
    heroCta: 'Explore Hausa connections'
  },
  {
    id: 'ashanti',
    name: 'Ashanti',
    headline: 'Royal lineages & modern creatives',
    blurb: 'Kumasi storytellers balancing legacy, entrepreneurship, and faith.',
    stats: {
      homeBase: 'Ghana – Ashanti Region',
      diasporaCities: ['London', 'Atlanta', 'Amsterdam'],
      population: '11M+'
    },
    heroCta: 'Connect with Ashanti singles'
  },
  {
    id: 'amharic',
    name: 'Amhara',
    headline: 'Highland romance & coffee ceremonies',
    blurb: 'Ethio-jazz lovers sharing heritage from Bahir Dar to Addis.',
    stats: {
      homeBase: 'Ethiopia – Amhara Region',
      diasporaCities: ['Washington DC', 'Stockholm', 'Doha'],
      population: '27M+'
    },
    heroCta: 'Meet Amhara members'
  },
  {
    id: 'oromo',
    name: 'Oromo',
    headline: 'Gadaa values, global ambitions',
    blurb: 'Community builders thriving in tech, healthcare, and creative hubs.',
    stats: {
      homeBase: 'Ethiopia – Oromia',
      diasporaCities: ['Seattle', 'Dubai', 'Melbourne'],
      population: '37M+'
    },
    heroCta: 'Find Oromo partners'
  },
  {
    id: 'somali',
    name: 'Somali',
    headline: 'Horn of Africa storytellers',
    blurb: 'Nomadic resilience meets modern entrepreneurship.',
    stats: {
      homeBase: 'Somalia & Horn of Africa',
      diasporaCities: ['Minneapolis', 'London', 'Nairobi'],
      population: '17M+'
    },
    heroCta: 'Connect with Somali singles'
  },
  {
    id: 'fulani',
    name: 'Fulani',
    headline: 'Sahel heritage, global roots',
    blurb: 'Cattle traders turned diplomats building cross-border ties.',
    stats: {
      homeBase: 'Sahel & West Africa',
      diasporaCities: ['Paris', 'Dakar', 'Lagos'],
      population: '38M+'
    },
    heroCta: 'Explore Fulani matches'
  },
  {
    id: 'zulu',
    name: 'Zulu',
    headline: 'Ngoma energy & coastal romance',
    blurb: 'Leaders in music, medicine, and culture from Durban to diaspora.',
    stats: {
      homeBase: 'KwaZulu-Natal, South Africa',
      diasporaCities: ['Durban', 'Johannesburg', 'London'],
      population: '12M+'
    },
    heroCta: 'Meet Zulu partners'
  },
  {
    id: 'xhosa',
    name: 'Xhosa',
    headline: 'Language keepers & creatives',
    blurb: 'Cape-based innovators uplifting isiXhosa traditions.',
    stats: {
      homeBase: 'Eastern & Western Cape',
      diasporaCities: ['Cape Town', 'Johannesburg', 'New York'],
      population: '8M+'
    },
    heroCta: 'Connect with Xhosa singles'
  },
  {
    id: 'berber',
    name: 'Amazigh',
    headline: 'Atlas mountains to Mediterranean coasts',
    blurb: 'Language revivalists and artisans across North Africa.',
    stats: {
      homeBase: 'Morocco, Algeria, Tunisia',
      diasporaCities: ['Paris', 'Barcelona', 'Marseille'],
      population: '25M+'
    },
    heroCta: 'Explore Amazigh matches'
  },
  {
    id: 'tuareg',
    name: 'Tuareg',
    headline: 'Saharan caravan legacies',
    blurb: 'Nomadic technologists mapping new futures.',
    stats: {
      homeBase: 'Sahara – Mali, Niger, Algeria',
      diasporaCities: ['Bamako', 'Niamey', 'Montreal'],
      population: '3.5M+'
    },
    heroCta: 'Meet Tuareg members'
  },
  {
    id: 'kikuyu',
    name: 'Kikuyu',
    headline: 'Highland farmers building tech hubs',
    blurb: 'Pan-African dreamers anchored in Mount Kenya foothills.',
    stats: {
      homeBase: 'Central Kenya',
      diasporaCities: ['Nairobi', 'Dallas', 'Doha'],
      population: '9M+'
    },
    heroCta: 'Connect with Kikuyu singles'
  },
  {
    id: 'baganda',
    name: 'Baganda',
    headline: 'Kingdom culture meet modern romance',
    blurb: 'Buganda innovators bridging Kampala and diaspora.',
    stats: {
      homeBase: 'Central Uganda',
      diasporaCities: ['Kampala', 'Boston', 'Johannesburg'],
      population: '6M+'
    },
    heroCta: 'Meet Baganda members'
  },
  {
    id: 'shona',
    name: 'Shona',
    headline: 'Mbira rhythms & entrepreneurial spirit',
    blurb: 'Zimbabwean creatives leading fintech, music, and media.',
    stats: {
      homeBase: 'Zimbabwe & Mozambique',
      diasporaCities: ['Harare', 'Johannesburg', 'London'],
      population: '14M+'
    },
    heroCta: 'Connect with Shona singles'
  },
  {
    id: 'wolof',
    name: 'Wolof',
    headline: 'Senegalese hospitality worldwide',
    blurb: 'Stylists and strategists shaping culture from Dakar outward.',
    stats: {
      homeBase: 'Senegal & The Gambia',
      diasporaCities: ['Dakar', 'Milan', 'New York'],
      population: '6.5M+'
    },
    heroCta: 'Meet Wolof matches'
  },
  {
    id: 'ewe',
    name: 'Ewe',
    headline: 'Volta storytellers & healers',
    blurb: 'Heritage keepers practicing music, medicine, and design.',
    stats: {
      homeBase: 'Ghana & Togo coast',
      diasporaCities: ['Accra', 'Berlin', 'Houston'],
      population: '7M+'
    },
    heroCta: 'Connect with Ewe singles'
  },
  {
    id: 'tutsi',
    name: 'Tutsi',
    headline: 'Great Lakes resilience & elegance',
    blurb: 'Leaders across Kigali, Bujumbura, and diaspora capitals.',
    stats: {
      homeBase: 'Rwanda & Burundi',
      diasporaCities: ['Kigali', 'Brussels', 'Toronto'],
      population: '3M+'
    },
    heroCta: 'Meet Tutsi partners'
  },
  {
    id: 'himba',
    name: 'Himba',
    headline: 'Namib desert artistry',
    blurb: 'Pastoralists spotlighting ancestral beauty rituals.',
    stats: {
      homeBase: 'Northern Namibia',
      diasporaCities: ['Windhoek', 'Cape Town', 'Munich'],
      population: '50K+'
    },
    heroCta: 'Discover Himba stories'
  },
  {
    id: 'afar',
    name: 'Afar',
    headline: 'Danakil desert explorers',
    blurb: 'Salt-caravan heritage with geothermal innovation.',
    stats: {
      homeBase: 'Ethiopia, Djibouti, Eritrea',
      diasporaCities: ['Addis Ababa', 'Jeddah', 'Doha'],
      population: '2.5M+'
    },
    heroCta: 'Connect with Afar members'
  },
  {
    id: 'ga',
    name: 'Ga-Dangme',
    headline: 'Coastal guardians of Accra',
    blurb: 'Festival planners and culture curators across Gulf of Guinea.',
    stats: {
      homeBase: 'Greater Accra, Ghana',
      diasporaCities: ['Accra', 'New York', 'Amsterdam'],
      population: '1.5M+'
    },
    heroCta: 'Meet Ga-Dangme singles'
  },
  {
    id: 'amazulu',
    name: 'AmaNdebele',
    headline: 'Geometric art, bold futures',
    blurb: 'Design-forward members turning beadwork into modern brands.',
    stats: {
      homeBase: 'Gauteng & Mpumalanga, South Africa',
      diasporaCities: ['Johannesburg', 'London', 'Perth'],
      population: '4M+'
    },
    heroCta: 'Connect with AmaNdebele creatives'
  }
]

export type TribeMapData = {
  regions: FeatureCollection
  tribes: TribeMeta[]
}

export const getTribeMapData = cache(async (_locale: AppLocale): Promise<TribeMapData> => {
  const regions = await readGeoJson()
  return {
    regions,
    tribes: TRIBE_METADATA,
  }
})

export function getTribeMetaById(id: string): TribeMeta | undefined {
  return TRIBE_METADATA.find((tribe) => tribe.id === id)
}
