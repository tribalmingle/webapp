"use client"

import { useState } from 'react'
import { ChevronDown, Camera, Heart, MapPin, Briefcase, GraduationCap, Users, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProfileSection {
  id: string
  title: string
  icon: React.ElementType
  content: React.ReactNode
  badge?: string
}

interface MobileProfileAccordionProps {
  sections: ProfileSection[]
  defaultExpanded?: string
}

export function MobileProfileAccordion({ sections, defaultExpanded }: MobileProfileAccordionProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(defaultExpanded || sections[0]?.id || null)

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  return (
    <div className="space-y-3 lg:hidden">
      {sections.map((section) => {
        const Icon = section.icon
        const isExpanded = expandedSection === section.id

        return (
          <Card key={section.id} className="overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 text-left transition-colors touch-target tap-highlight-none",
                isExpanded ? "bg-purple-50" : "hover:bg-neutral-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  isExpanded ? "bg-purple-royal text-white" : "bg-neutral-100 text-neutral-600"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">{section.title}</span>
                  {section.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-neutral-400 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
            
            <div
              className={cn(
                "transition-all duration-200 overflow-hidden",
                isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="p-4 pt-0 border-t">
                {section.content}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// Example usage component
export function MobileProfileView({ profile }: { profile: any }) {
  const sections: ProfileSection[] = [
    {
      id: 'photos',
      title: 'Photos & Media',
      icon: Camera,
      badge: `${profile.photos?.length || 0} photos`,
      content: (
        <div className="grid grid-cols-3 gap-2">
          {profile.photos?.map((photo: any, idx: number) => (
            <div key={idx} className="aspect-square rounded-lg bg-neutral-200 overflow-hidden">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          <button className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center hover:border-purple-royal transition-colors">
            <Camera className="w-6 h-6 text-neutral-400" />
          </button>
        </div>
      )
    },
    {
      id: 'about',
      title: 'About Me',
      icon: Heart,
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-600 mb-1 block">Bio</label>
            <p className="text-sm text-neutral-700 leading-relaxed">{profile.bio || 'No bio added yet'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Age</label>
              <p className="text-sm font-semibold">{profile.age}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Height</label>
              <p className="text-sm font-semibold">{profile.height}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'location',
      title: 'Location & Heritage',
      icon: MapPin,
      content: (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Current Location</label>
            <p className="text-sm font-semibold">{profile.city}, {profile.country}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Tribe</label>
            <Badge variant="outline" className="text-sm">{profile.tribe}</Badge>
          </div>
        </div>
      )
    },
    {
      id: 'career',
      title: 'Career & Education',
      icon: Briefcase,
      content: (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Profession</label>
            <p className="text-sm font-semibold">{profile.profession || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Education</label>
            <p className="text-sm font-semibold">{profile.education || 'Not specified'}</p>
          </div>
        </div>
      )
    },
    {
      id: 'interests',
      title: 'Interests & Values',
      icon: Users,
      content: (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">Interests</label>
            <div className="flex flex-wrap gap-2">
              {profile.interests?.map((interest: string, idx: number) => (
                <Badge key={idx} variant="secondary">{interest}</Badge>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Looking For</label>
            <p className="text-sm font-semibold">{profile.lookingFor || 'Not specified'}</p>
          </div>
        </div>
      )
    },
    {
      id: 'verification',
      title: 'Verification & Safety',
      icon: Shield,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-600">ID Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-600">Photo Verified</span>
          </div>
          <Button variant="outline" className="w-full mt-2">
            View Safety Center
          </Button>
        </div>
      )
    }
  ]

  return <MobileProfileAccordion sections={sections} defaultExpanded="photos" />
}
