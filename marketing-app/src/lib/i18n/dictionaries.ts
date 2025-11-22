import type { Locale } from "./config"

const dictionaries = {
  en: {
    hero: {
      eyebrow: "A tribe-first dating experience",
      headline: "Find love rooted in culture, family, and future vision",
      body: "Tribal Mingle pairs deep cultural context with AI-powered insights so you can meet people who share your values and dreams.",
      ctaPrimary: "Join the waitlist",
      ctaSecondary: "Explore tribes",
    },
    testimonials: {
      title: "Stories from the tribe",
      quotes: [
        {
          name: "Ama & Kweku",
          tribe: "Ghanaian diaspora · Toronto",
          quote: "We bonded over diaspora traditions in minutes. Two months later, our families were already planning a joint trip.",
        },
        {
          name: "Zahra",
          tribe: "Hausa · Abuja",
          quote: "The onboarding asked about family values the way my aunties would. It finally felt like a safe, serious space.",
        },
      ],
    },
    metrics: {
      title: "Built for intentional relationships",
      items: [
        { label: "Launch cities", value: "18" },
        { label: "Verified members", value: "92%" },
        { label: "Cultural match score", value: "87" },
        { label: "Family approval rate", value: "74%" },
      ],
    },
    cta: {
      title: "Bring your tribe along",
      body: "Early members get concierge onboarding, guardian portal access, and premium boosts when we launch in their city.",
      button: "Reserve my spot",
    },
    events: {
      title: "Launch circuits",
      items: [
        {
          city: "Accra",
          region: "Ghana",
          date: "Dec 12",
          description: "Private salon with our cultural advisors and founding members.",
          status: "Limited",
          href: "/events/accra",
        },
        {
          city: "Toronto",
          region: "Canada",
          date: "Jan 18",
          description: "Guardian roundtable on diaspora matchmaking rituals.",
          status: "Filling",
          href: "/events/toronto",
        },
        {
          city: "London",
          region: "UK",
          date: "Feb 05",
          description: "Immersive AI coach preview and multi-tribe mixer.",
          status: "RSVP",
          href: "/events/london",
        },
      ],
    },
    blog: {
      title: "Signals from the tribe",
      posts: [
        {
          title: "How guardian approvals unlock safer matchmaking",
          excerpt: "We walk through the rituals families shared across Hausa, Igbo, and Yoruba communities.",
          href: "/stories/guardian-approvals",
          readTime: "6 min read",
        },
        {
          title: "The AI compatibility signal explained",
          excerpt: "Cultural context + shared future goals feed the new compatibility layer.",
          href: "/stories/compatibility-signal",
          readTime: "4 min read",
        },
        {
          title: "Designing respectful video prompts",
          excerpt: "Our creative director shares how we co-designed prompts with aunties and uncles.",
          href: "/stories/video-prompts",
          readTime: "5 min read",
        },
      ],
    },
    map: {
      title: "Diaspora heat map",
      subtitle: "Live clusters updating hourly across launch regions.",
      clusters: [
        { city: "Accra", region: "Ghana", members: 4200, lat: 5.6037, lng: -0.187 },
        { city: "Lagos", region: "Nigeria", members: 6800, lat: 6.5244, lng: 3.3792 },
        { city: "London", region: "United Kingdom", members: 5100, lat: 51.5072, lng: -0.1276 },
        { city: "Toronto", region: "Canada", members: 3600, lat: 43.6532, lng: -79.3832 },
        { city: "Paris", region: "France", members: 2900, lat: 48.8566, lng: 2.3522 },
      ],
    },
  },
  fr: {
    hero: {
      eyebrow: "Rencontres ancrées dans la culture",
      headline: "Rencontrez des personnes qui comprennent vos traditions",
      body: "Tribal Mingle relie diaspora et continent avec des profils vérifiés et un coaching culturel.",
      ctaPrimary: "Rejoindre la liste",
      ctaSecondary: "Découvrir les tribus",
    },
    testimonials: {
      title: "Histoires de la communauté",
      quotes: [
        {
          name: "Aïcha",
          tribe: "Peul · Paris",
          quote: "J'ai enfin trouvé un espace où parler de foi et d'ambitions professionnelles n'est pas contradictoire.",
        },
      ],
    },
    metrics: {
      title: "Pensé pour des relations intentionnelles",
      items: [
        { label: "Villes de lancement", value: "18" },
        { label: "Profils vérifiés", value: "92%" },
        { label: "Score de compatibilité culturelle", value: "87" },
        { label: "Portails famille", value: "74%" },
      ],
    },
    cta: {
      title: "Invitez votre cercle",
      body: "Les premiers membres reçoivent un onboarding conciergerie et des boosts premium.",
      button: "Je m'inscris",
    },
    events: {
      title: "Tournée de lancement",
      items: [
        {
          city: "Paris",
          region: "France",
          date: "12 déc",
          description: "Salon confidentiel avec nos mentors culturels.",
          status: "Limitée",
          href: "/fr/evenements/paris",
        },
        {
          city: "Abidjan",
          region: "Côte d'Ivoire",
          date: "20 jan",
          description: "Atelier famille et carrière pour la diaspora francophone.",
          status: "RSVP",
          href: "/fr/evenements/abidjan",
        },
      ],
    },
    blog: {
      title: "Histoires et conseils",
      posts: [
        {
          title: "Pourquoi impliquer les familles tôt",
          excerpt: "Nos coachs expliquent comment préparer le terrain avec les parents.",
          href: "/fr/histoires/familles",
          readTime: "5 min",
        },
        {
          title: "Comprendre l'indice culturel",
          excerpt: "Décortiquons les signaux utilisés pour matcher au-delà des centres d'intérêt.",
          href: "/fr/histoires/indice",
          readTime: "4 min",
        },
      ],
    },
    map: {
      title: "Carte des tribus",
      subtitle: "Les clusters actifs en Europe et en Afrique.",
      clusters: [
        { city: "Paris", region: "France", members: 2900, lat: 48.8566, lng: 2.3522 },
        { city: "Bruxelles", region: "Belgique", members: 1200, lat: 50.8503, lng: 4.3517 },
        { city: "Montreal", region: "Canada", members: 2100, lat: 45.5019, lng: -73.5674 },
      ],
    },
  },
  pt: {
    hero: {
      eyebrow: "Encontros guiados pela cultura",
      headline: "Conecte-se com quem valoriza raízes e futuro",
      body: "Histórias, família e planos de vida importam aqui. Descubra conexões que respeitam sua jornada.",
      ctaPrimary: "Entrar na lista",
      ctaSecondary: "Ver tribos",
    },
    testimonials: {
      title: "Vozes da tribo",
      quotes: [
        {
          name: "Joana",
          tribe: "Angolana · Lisboa",
          quote: "Os prompts me fizeram refletir sobre tradição e carreira. As conversas já começam profundas.",
        },
      ],
    },
    metrics: {
      title: "Intencionalidade primeiro",
      items: [
        { label: "Cidades", value: "18" },
        { label: "Perfis verificados", value: "92%" },
        { label: "Compatibilidade cultural", value: "87" },
        { label: "Portais familiares", value: "74%" },
      ],
    },
    cta: {
      title: "Convide sua família",
      body: "Fundadores ganham onboarding guiado e boosts quando abrirmos no Brasil.",
      button: "Garantir vaga",
    },
    events: {
      title: "Agenda de pré-lançamento",
      items: [
        {
          city: "São Paulo",
          region: "Brasil",
          date: "15 fev",
          description: "Mesa redonda sobre tradição e futuro com convidados da diáspora.",
          status: "Em breve",
          href: "/pt/eventos/sao-paulo",
        },
        {
          city: "Lisboa",
          region: "Portugal",
          date: "08 mar",
          description: "Experiência imersiva com o mapa das tribos e DJ set afro-lusófono.",
          status: "RSVP",
          href: "/pt/eventos/lisboa",
        },
      ],
    },
    blog: {
      title: "Jornal da tribo",
      posts: [
        {
          title: "Como falamos de família e carreira",
          excerpt: "Compartilhamos o roteiro usado nos encontros com pais e mães.",
          href: "/pt/historias/familia",
          readTime: "6 min",
        },
        {
          title: "Boas práticas para vídeos",
          excerpt: "Aprenda a gravar respostas autênticas respeitando tradições.",
          href: "/pt/historias/videos",
          readTime: "4 min",
        },
      ],
    },
    map: {
      title: "Mapa da diáspora",
      subtitle: "Acompanha os clusters confirmados no Atlântico.",
      clusters: [
        { city: "Luanda", region: "Angola", members: 1800, lat: -8.839, lng: 13.2894 },
        { city: "Lisboa", region: "Portugal", members: 2400, lat: 38.7223, lng: -9.1393 },
        { city: "São Paulo", region: "Brasil", members: 2600, lat: -23.5558, lng: -46.6396 },
      ],
    },
  },
  ar: {
    hero: {
      eyebrow: "منصة تعارف تراعي الجذور",
      headline: "ابحث عن شريك يشاركك القيم والعائلة والطموح",
      body: "تجمع Tribal Mingle بين الذكاء الاصطناعي والسياق الثقافي لتقديم تجارب تعارف آمنة وهادفة.",
      ctaPrimary: "انضم إلى القائمة",
      ctaSecondary: "اكتشف القبائل",
    },
    testimonials: {
      title: "قصص من المجتمع",
      quotes: [
        {
          name: "ليلى",
          tribe: "سودانية · دبي",
          quote: "أخيراً وجدت مساحة تحترم العائلة وتفهم خصوصية مجتمعنا.",
        },
      ],
    },
    metrics: {
      title: "منصة مصممة لعلاقات جادة",
      items: [
        { label: "مدن الإطلاق", value: "18" },
        { label: "أعضاء موثقون", value: "92%" },
        { label: "مؤشر الانسجام الثقافي", value: "87" },
        { label: "موافقة العائلة", value: "74%" },
      ],
    },
    cta: {
      title: "اجلب عائلتك معك",
      body: "أعضاء المرحلة المبكرة يحصلون على دعم مخصص وتجربة إطلاق أسرع.",
      button: "أرغب بالانضمام",
    },
    events: {
      title: "جولة التعريف",
      items: [
        {
          city: "دبي",
          region: "الإمارات",
          date: "10 كانون الأول",
          description: "جلسة مغلقة مع مستشاري العائلات والمهتمين بالتقنيات.",
          status: "محدود",
          href: "/ar/events/dubai",
        },
        {
          city: "الرياض",
          region: "السعودية",
          date: "25 كانون الثاني",
          description: "ورشة عن التحقق العائلي وتجارب الفيديو المحمية.",
          status: "قريباً",
          href: "/ar/events/riyadh",
        },
      ],
    },
    blog: {
      title: "مذكرات القبيلة",
      posts: [
        {
          title: "كيف نحترم صوت العائلة",
          excerpt: "دليل عملي لمشاركة الأهالي في كل خطوة من الرحلة.",
          href: "/ar/stories/family",
          readTime: "٥ دقائق",
        },
        {
          title: "شرح خوارزمية التوافق",
          excerpt: "نجمع بين البيانات الثقافية وطموحات المستقبل لاقتراح أفضل مطابقات.",
          href: "/ar/stories/ai",
          readTime: "٤ دقائق",
        },
      ],
    },
    map: {
      title: "خريطة الانتشار",
      subtitle: "مؤشرات مباشرة من الخليج وشمال إفريقيا.",
      clusters: [
        { city: "دبي", region: "الإمارات", members: 2500, lat: 25.2048, lng: 55.2708 },
        { city: "الرياض", region: "السعودية", members: 2100, lat: 24.7136, lng: 46.6753 },
        { city: "الدار البيضاء", region: "المغرب", members: 1500, lat: 33.5731, lng: -7.5898 },
      ],
    },
  },
} as const

export type MarketingDictionary = (typeof dictionaries)[Locale]

export function getDictionary(locale: Locale): MarketingDictionary {
  return dictionaries[locale] ?? dictionaries.en
}
