'use client'

import { Heart, Star, MessageCircle, Zap, TrendingUp, Users, Crown, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PremiumProfileCard, StatCard } from '@/components/premium'
import { StaggerGrid, SlideUp, FadeIn } from '@/components/motion'
import { PremiumLoader } from '@/components/ui/premium-loader'

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <PremiumLoader />
      </div>
    )
  }

  const userName = user?.name?.split(' ')[0] || 'there'
  
  // Get time-based greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Morning'
    if (hour < 18) return 'Afternoon'
    return 'Evening'
  }

  // Mock data - replace with real API data
  const stats = [
    { 
      icon: Heart, 
      label: 'Likes Received', 
      value: 12, 
      trend: '+3 today',
      gradient: 'from-red-500 to-pink-500'
    },
    { 
      icon: MessageCircle, 
      label: 'Active Chats', 
      value: 5, 
      trend: '2 unread',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: Star, 
      label: 'Profile Views', 
      value: 28, 
      trend: '+12 this week',
      gradient: 'from-yellow-500 to-orange-500'
    },
    { 
      icon: Zap, 
      label: 'New Matches', 
      value: 3, 
      trend: 'See profiles',
      gradient: 'from-purple-royal to-gold-warm'
    }
  ]

  const dailyMatches = [
    { 
      name: 'Emma', 
      age: 32, 
      tribe: 'Igbo', 
      location: 'Lagos, Nigeria',
      bio: 'Love hiking, coffee, and meaningful conversations. Looking for someone to explore the city with.',
      photo: '/woman-portrait.jpg',
      verified: true,
      interests: ['Hiking', 'Coffee', 'Travel', 'Art'],
      matchScore: 94
    },
    { 
      name: 'Jessica', 
      age: 29, 
      tribe: 'Ashanti', 
      location: 'Accra, Ghana',
      bio: 'Fitness enthusiast and entrepreneur. Love trying new restaurants and weekend adventures.',
      photo: '/woman-fitness.png',
      verified: true,
      interests: ['Fitness', 'Food', 'Business', 'Music'],
      matchScore: 88
    },
    { 
      name: 'Lisa', 
      age: 35, 
      tribe: 'Ga', 
      location: 'New York, USA',
      bio: 'Artist and creative soul. Looking for deep connections and shared values.',
      photo: '/woman-artist.jpg',
      verified: false,
      interests: ['Art', 'Photography', 'Culture', 'Yoga'],
      matchScore: 85
    }
  ]
  
  return (
    <MemberAppShell
      title={`Good ${getTimeOfDay()}, ${userName} 👋`}
      description={`You have ${stats[3].value} new matches waiting for you`}
    >
      <div className="space-y-12">
        {/* Premium Stats Grid with Animation */}
        <SlideUp>
          <StaggerGrid columns={4}>
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                trend={stat.trend}
                gradient={stat.gradient}
              />
            ))}
          </StaggerGrid>
        </SlideUp>

        {/* Premium Match Carousel */}
        <section>
          <FadeIn delay={0.2}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <Badge variant="gold" className="mb-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Daily Spotlight
                </Badge>
                <h2 className="text-h2 font-display text-text-primary">Handpicked Matches</h2>
                <p className="text-body-sm text-text-secondary mt-1">
                  Curated by AI based on your preferences and values
                </p>
              </div>
              
              <Link href="/discover">
                <Button variant="ghost" className="group">
                  See All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </FadeIn>

          {/* Horizontal scroll carousel */}
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {dailyMatches.map((match, index) => (
              <FadeIn key={match.name} delay={0.3 + index * 0.1}>
                <div className="shrink-0 w-80 snap-start">
                  <PremiumProfileCard
                    profile={{
                      name: match.name,
                      age: match.age,
                      tribe: match.tribe,
                      location: match.location,
                      bio: match.bio,
                      photo: match.photo,
                      verified: match.verified,
                      interests: match.interests
                    }}
                    matchScore={match.matchScore}
                    onLike={() => console.log('Liked', match.name)}
                    onPass={() => console.log('Passed', match.name)}
                  />
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Who Likes You - Premium Section */}
        <section>
          <FadeIn delay={0.5}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <Badge variant="purple" className="mb-2">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium Feature
                </Badge>
                <h2 className="text-h2 font-display text-text-primary">Who Likes You</h2>
                <p className="text-body-sm text-text-secondary mt-1">
                  See everyone who liked your profile
                </p>
              </div>
              
              <Link href="/likes">
                <Button variant="secondary" className="group">
                  View All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </FadeIn>

          <StaggerGrid columns={2}>
            {[
              { 
                name: 'Michelle', 
                age: 28,
                tribe: 'Yoruba', 
                bio: 'Love hiking and coffee',
                location: 'Lagos, Nigeria',
                photo: '/woman-portrait.jpg',
                verified: true
              },
              { 
                name: 'Rachel', 
                age: 31,
                tribe: 'Zulu', 
                bio: 'Artist and yoga enthusiast',
                location: 'Cape Town, South Africa',
                photo: '/woman-fitness.png',
                verified: false
              }
            ].map(liker => (
              <Card key={liker.name} variant="glass" className="group cursor-pointer card-interactive">
                <div className="flex items-center gap-4 p-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden">
                      <img 
                        src={liker.photo || "/placeholder.svg"} 
                        alt={liker.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-linear-to-br from-purple-royal to-gold-warm flex items-center justify-center border-2 border-background-primary">
                      <Heart className="w-3 h-3 text-white" fill="currentColor" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-h4 text-text-primary font-semibold">
                        {liker.name}, {liker.age}
                      </h3>
                      {liker.verified && (
                        <Badge variant="gold" className="px-1.5 py-0.5">
                          <Crown className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                    <Badge variant="purple" className="mb-2">
                      {liker.tribe}
                    </Badge>
                    <p className="text-body-sm text-text-secondary line-clamp-1">{liker.bio}</p>
                    <p className="text-body-xs text-text-tertiary mt-1">{liker.location}</p>
                  </div>
                  
                  <Button variant="primary" size="sm" className="shrink-0">
                    View
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </StaggerGrid>
        </section>
      </div>
    </MemberAppShell>
  )
}
