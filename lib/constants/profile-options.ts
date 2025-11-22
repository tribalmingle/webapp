// Profile selection options for user registration and editing

export const NIGERIAN_TRIBES = [
  'Yoruba',
  'Igbo',
  'Hausa',
  'Fulani',
  'Ijaw',
  'Kanuri',
  'Ibibio',
  'Tiv',
  'Edo',
  'Nupe',
  'Urhobo',
  'Igala',
  'Idoma',
  'Efik',
  'Annang',
  'Itsekiri',
  'Jukun',
  'Ebira',
  'Gwari',
  'Berom'
]

export const FEATURED_TRIBES = [
  'Igbo',
  'Yoruba',
  'Hausa',
  'Fulani',
  'Ashanti',
  'Ga',
  'Dagomba',
  'Ewe',
  'Kikuyu',
  'Luo',
  'Zulu',
  'Xhosa'
]

export const AFRICAN_COUNTRIES_WITH_TRIBES: { [key: string]: string[] } = {
  'Nigeria': NIGERIAN_TRIBES,
  'Ghana': ['Akan', 'Ewe', 'Ga', 'Dagomba', 'Fante', 'Ashanti'],
  'Kenya': ['Kikuyu', 'Luhya', 'Kalenjin', 'Luo', 'Kamba', 'Kisii', 'Meru'],
  'South Africa': ['Zulu', 'Xhosa', 'Sotho', 'Tswana', 'Pedi', 'Venda', 'Tsonga', 'Swazi', 'Ndebele'],
  'Ethiopia': ['Oromo', 'Amhara', 'Tigray', 'Somali', 'Sidama', 'Gurage', 'Wolayta'],
  'Tanzania': ['Sukuma', 'Nyamwezi', 'Chagga', 'Haya', 'Makonde', 'Hehe'],
  'Uganda': ['Baganda', 'Banyankole', 'Basoga', 'Bakiga', 'Iteso', 'Langi', 'Acholi'],
  'Cameroon': ['Bamileke', 'Fulani', 'Bassa', 'Douala', 'Bamoun', 'Tikar'],
  'Ivory Coast': ['Akan', 'Baoulé', 'Bété', 'Senufo', 'Malinké', 'Dan'],
  'Senegal': ['Wolof', 'Pulaar', 'Serer', 'Jola', 'Mandinka', 'Soninke'],
  'Zimbabwe': ['Shona', 'Ndebele', 'Kalanga', 'Tonga', 'Shangaan'],
  'Mali': ['Bambara', 'Fulani', 'Songhai', 'Tuareg', 'Dogon', 'Malinke'],
  'Zambia': ['Bemba', 'Tonga', 'Chewa', 'Lozi', 'Nsenga', 'Lunda'],
  'Rwanda': ['Hutu', 'Tutsi', 'Twa'],
  'Burundi': ['Hutu', 'Tutsi', 'Twa'],
  'Mozambique': ['Makhuwa', 'Tsonga', 'Lomwe', 'Sena', 'Ndau'],
  'Angola': ['Ovimbundu', 'Kimbundu', 'Bakongo', 'Chokwe', 'Lunda'],
  'Somalia': ['Somali', 'Dir', 'Hawiye', 'Isaaq', 'Darod'],
  'Congo (DRC)': ['Luba', 'Kongo', 'Mongo', 'Lunda', 'Bembe', 'Tetela'],
  'Other': ['Other']
}

export const AFRICAN_COUNTRIES = Object.keys(AFRICAN_COUNTRIES_WITH_TRIBES)

export const COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Ethiopia',
  'Tanzania',
  'Uganda',
  'Cameroon',
  'Ivory Coast',
  'Senegal',
  'Zimbabwe',
  'Mali',
  'Zambia',
  'Rwanda',
  'Burundi',
  'Mozambique',
  'Angola',
  'Somalia',
  'Congo (DRC)',
  'Algeria',
  'Morocco',
  'Tunisia',
  'Egypt',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Other'
]

export const NIGERIAN_CITIES = [
  'Lagos',
  'Abuja',
  'Kano',
  'Ibadan',
  'Port Harcourt',
  'Benin City',
  'Kaduna',
  'Enugu',
  'Jos',
  'Ilorin',
  'Owerri',
  'Calabar',
  'Abeokuta',
  'Warri',
  'Onitsha',
  'Aba',
  'Akure',
  'Osogbo',
  'Uyo',
  'Maiduguri'
]

export const CITIES_BY_COUNTRY: { [key: string]: string[] } = {
  'Nigeria': NIGERIAN_CITIES,
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast'],
  'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
  'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
  'Other': ['Other']
}

export const HEIGHTS_IN_FEET = [
  '4\'0" (122 cm)',
  '4\'1" (124 cm)',
  '4\'2" (127 cm)',
  '4\'3" (130 cm)',
  '4\'4" (132 cm)',
  '4\'5" (135 cm)',
  '4\'6" (137 cm)',
  '4\'7" (140 cm)',
  '4\'8" (142 cm)',
  '4\'9" (145 cm)',
  '4\'10" (147 cm)',
  '4\'11" (150 cm)',
  '5\'0" (152 cm)',
  '5\'1" (155 cm)',
  '5\'2" (157 cm)',
  '5\'3" (160 cm)',
  '5\'4" (163 cm)',
  '5\'5" (165 cm)',
  '5\'6" (168 cm)',
  '5\'7" (170 cm)',
  '5\'8" (173 cm)',
  '5\'9" (175 cm)',
  '5\'10" (178 cm)',
  '5\'11" (180 cm)',
  '6\'0" (183 cm)',
  '6\'1" (185 cm)',
  '6\'2" (188 cm)',
  '6\'3" (191 cm)',
  '6\'4" (193 cm)',
  '6\'5" (196 cm)',
  '6\'6" (198 cm)',
  '6\'7" (201 cm)',
  '6\'8" (203 cm)',
  '6\'9" (206 cm)',
  '6\'10" (208 cm)',
  '6\'11" (211 cm)',
  '7\'0" (213 cm)'
]

export const EDUCATION_LEVELS = [
  'High School',
  'Some College',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'MBA',
  'PhD/Doctorate',
  'Professional Degree (MD, JD, etc.)',
  'Trade/Technical School',
  'Prefer not to say'
]

export const RELIGIONS = [
  'Christianity',
  'Islam',
  'Traditional African Religion',
  'Hinduism',
  'Buddhism',
  'Judaism',
  'Sikhism',
  'Atheist',
  'Agnostic',
  'Spiritual but not religious',
  'Prefer not to say',
  'Other'
]

export const LOOKING_FOR_OPTIONS = [
  'Long-term relationship',
  'Marriage',
  'Friendship',
  'Dating',
  'Life partner'
]

export const INTERESTS_OPTIONS = [
  'Travel',
  'Music',
  'Movies',
  'Cooking',
  'Reading',
  'Sports',
  'Fitness',
  'Dancing',
  'Photography',
  'Art',
  'Fashion',
  'Gaming',
  'Technology',
  'Business',
  'Politics',
  'Religion',
  'Nature',
  'Animals',
  'Food',
  'Wine',
  'Coffee',
  'Yoga',
  'Meditation',
  'Volunteering',
  'Writing',
  'Poetry',
  'Theatre',
  'Comedy',
  'Adventure',
  'Beach',
  'Hiking',
  'Camping',
  'Shopping',
  'Cars',
  'Motorcycles'
]

export const BODY_TYPES = [
  'Slim',
  'Athletic',
  'Average',
  'Curvy',
  'Plus-size',
  'Muscular',
  'Prefer not to say'
]

export const MARITAL_STATUS_OPTIONS = [
  'Single',
  'Divorced',
  'Widowed',
  'Separated',
  'Prefer not to say'
]

export const WORK_TYPES = [
  "I don't mind",
  'Full-time',
  'Part-time',
  'Volunteer',
  'Student'
]

// Helper function to get tribes based on country
export function getTribesForCountry(country: string): string[] {
  return AFRICAN_COUNTRIES_WITH_TRIBES[country] || AFRICAN_COUNTRIES_WITH_TRIBES['Other']
}

// Helper function to get cities based on country
export function getCitiesForCountry(country: string): string[] {
  return CITIES_BY_COUNTRY[country] || CITIES_BY_COUNTRY['Other']
}

// Helper function to calculate match percentage based on profile similarity
export function calculateMatchPercentage(user1: any, user2: any): number {
  let score = 0
  let maxScore = 0

  // Tribe match (30 points)
  maxScore += 30
  if (user1.tribe === user2.tribe) {
    score += 30
  }

  // Country of origin match (20 points)
  maxScore += 20
  if (user1.countryOfOrigin === user2.countryOfOrigin) {
    score += 20
  }

  // Religion match (15 points)
  maxScore += 15
  if (user1.religion === user2.religion) {
    score += 15
  }

  // Interests match (25 points)
  maxScore += 25
  if (user1.interests && user2.interests) {
    const user1Interests = Array.isArray(user1.interests) ? user1.interests : []
    const user2Interests = Array.isArray(user2.interests) ? user2.interests : []
    const commonInterests = user1Interests.filter((interest: string) => 
      user2Interests.includes(interest)
    )
    const interestScore = (commonInterests.length / Math.max(user1Interests.length, user2Interests.length)) * 25
    score += interestScore
  }

  // Looking for match (10 points)
  maxScore += 10
  if (user1.lookingFor === user2.lookingFor) {
    score += 10
  }

  return Math.round((score / maxScore) * 100)
}
