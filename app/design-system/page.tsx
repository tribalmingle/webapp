'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PremiumLoader } from '@/components/ui/premium-loader'
import { 
  PremiumProfileCard, 
  StatCard, 
  MiniStat, 
  Avatar, 
  AvatarGroup,
  NotificationBadge,
  StatusBadge,
  MatchScoreBadge,
  toast,
  PremiumToaster
} from '@/components/premium'
import { 
  StaggerContainer, 
  StaggerGrid,
  PageTransition,
  FadeIn,
  SlideUp,
  ScaleIn
} from '@/components/motion'
import { useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'
import { 
  Users, 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  ShieldCheck,
  Crown,
  Sparkles,
  Star,
  Zap
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function DesignSystemShowcase() {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <PremiumToaster />
      
      <div className="mx-auto max-w-7xl space-y-16">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-display-lg font-display text-text-primary mb-4">
            TribalMingle Design System
          </h1>
          <p className="text-body-lg text-text-secondary">
            Phase 1: Premium Component Showcase
          </p>
        </div>

        {/* Color Palette */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="h-24 bg-purple-royal rounded-lg shadow-glow-purple" />
              <p className="text-body-sm text-text-secondary">Purple Royal</p>
              <code className="text-xs text-text-tertiary">#5B2E91</code>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-gold-warm rounded-lg shadow-glow-gold" />
              <p className="text-body-sm text-text-secondary">Gold Warm</p>
              <code className="text-xs text-text-tertiary">#D4AF37</code>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-background-primary border-2 border-background-tertiary rounded-lg" />
              <p className="text-body-sm text-text-secondary">BG Primary</p>
              <code className="text-xs text-text-tertiary">#0A0A0A</code>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-background-secondary border-2 border-background-tertiary rounded-lg" />
              <p className="text-body-sm text-text-secondary">BG Secondary</p>
              <code className="text-xs text-text-tertiary">#1A1A1A</code>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Typography</h2>
          <div className="space-y-4 bg-background-secondary p-8 rounded-xl">
            <div className="text-display-xl font-display text-text-primary">Display XL</div>
            <div className="text-display-lg font-display text-text-primary">Display Large</div>
            <div className="text-h1 font-display text-text-primary">Heading 1</div>
            <div className="text-h2 text-text-primary">Heading 2</div>
            <div className="text-body-lg text-text-secondary">Body Large Text</div>
            <div className="text-body text-text-secondary">Regular Body Text</div>
            <div className="text-body-sm text-text-tertiary">Small Body Text</div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="gold">Gold (CTA)</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button variant="gold" size="sm">Small</Button>
            <Button variant="gold" size="default">Default</Button>
            <Button variant="gold" size="lg">Large</Button>
            <Button variant="gold" size="icon">★</Button>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Elevated with subtle gold border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  This is the default card variant with standard elevation.
                </p>
              </CardContent>
            </Card>
            
            <Card variant="premium">
              <CardHeader>
                <CardTitle>Premium Card</CardTitle>
                <CardDescription>Strong gold border with glow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  Premium variant with enhanced visual impact.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>Glassmorphism effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  Frosted glass effect with backdrop blur.
                </p>
              </CardContent>
            </Card>

            <Card variant="flat">
              <CardHeader>
                <CardTitle>Flat Card</CardTitle>
                <CardDescription>Minimal elevation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  Clean and simple card without shadows.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Form Inputs */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Form Inputs</h2>
          <Card variant="premium" padding="lg">
            <CardHeader>
              <CardTitle>Premium Form Example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label variant="premium">Email Address</Label>
                <Input variant="default" type="email" placeholder="you@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label variant="premium">Premium Input</Label>
                <Input variant="premium" placeholder="Premium styled input..." />
              </div>

              <div className="space-y-2">
                <Label variant="premium">Message</Label>
                <Textarea variant="premium" placeholder="Write your message..." />
              </div>

              <div className="flex gap-4">
                <Button variant="gold" className="flex-1">Submit</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Premium Profile Card */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Premium Profile Card</h2>
          <div className="max-w-md mx-auto">
            <PremiumProfileCard
              profile={{
                name: "Sarah",
                age: 28,
                location: "Seattle, WA",
                bio: "Adventure seeker, coffee enthusiast, and weekend hiker. Looking for someone to explore the Pacific Northwest with! 🏔️",
                photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop",
                verified: true,
                interests: ['Hiking', 'Photography', 'Travel', 'Coffee', 'Music']
              }}
              matchScore={94}
              onLike={() => alert('Liked!')}
              onPass={() => alert('Passed!')}
            />
          </div>
        </section>

        {/* Loading States */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Loading States</h2>
          <Card variant="premium">
            <CardContent className="p-12">
              <div className="space-y-8">
                <div className="text-center">
                  <Button 
                    variant="gold" 
                    onClick={() => {
                      setShowLoader(true)
                      setTimeout(() => setShowLoader(false), 3000)
                    }}
                  >
                    Show Loader (3s)
                  </Button>
                </div>
                
                {showLoader && (
                  <div className="flex justify-center">
                    <PremiumLoader message="Finding your perfect match..." />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Bottom Sheet */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Bottom Sheet (Mobile)</h2>
          <Card variant="premium">
            <CardContent className="p-8 text-center">
              <Button variant="gold" onClick={() => setBottomSheetOpen(true)}>
                Open Bottom Sheet
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Mobile Navigation Preview */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Mobile Navigation</h2>
          <Card variant="glass">
            <CardContent className="p-8">
              <p className="text-text-secondary text-center mb-6">
                Scroll to the bottom of the page to see the mobile navigation bar
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Stats Cards - Phase 2 */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Stats Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Members"
              value={12847}
              trend={12.5}
              icon={<Users className="w-5 h-5" />}
              variant="premium"
            />
            <StatCard
              title="Active Matches"
              value={3456}
              trend={8.3}
              icon={<Heart className="w-5 h-5" />}
              variant="glass"
            />
            <StatCard
              title="Messages Sent"
              value={28943}
              trend={-2.4}
              trendLabel="vs last week"
              icon={<MessageCircle className="w-5 h-5" />}
            />
            <StatCard
              title="Success Rate"
              value={94.5}
              suffix="%"
              trend={3.2}
              decimals={1}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="premium"
            />
          </div>
          
          {/* Mini Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <MiniStat label="New Today" value="847" icon={<Users className="w-4 h-4" />} variant="purple" />
            <MiniStat label="Premium" value="4.2K" icon={<Crown className="w-4 h-4" />} variant="gold" />
            <MiniStat label="Verified" value="9.8K" icon={<ShieldCheck className="w-4 h-4" />} variant="purple" />
            <MiniStat label="Active Now" value="2.1K" icon={<Sparkles className="w-4 h-4" />} variant="default" />
          </div>
        </section>

        {/* Avatars - Phase 2 */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Avatars</h2>
          <Card variant="premium">
            <CardContent className="p-8 space-y-8">
              {/* Sizes */}
              <div>
                <h3 className="text-h3 text-text-primary mb-4">Sizes</h3>
                <div className="flex items-end gap-4">
                  <Avatar size="xs" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" fallback="JD" />
                  <Avatar size="sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" fallback="JD" />
                  <Avatar size="md" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" fallback="JD" />
                  <Avatar size="lg" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" fallback="JD" />
                  <Avatar size="xl" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" fallback="JD" />
                  <Avatar size="2xl" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" fallback="JD" />
                  <Avatar size="3xl" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" fallback="JD" />
                </div>
              </div>

              {/* Status Indicators */}
              <div>
                <h3 className="text-h3 text-text-primary mb-4">Status Indicators</h3>
                <div className="flex gap-4">
                  <Avatar size="xl" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" status="online" />
                  <Avatar size="xl" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" status="away" />
                  <Avatar size="xl" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" status="busy" />
                  <Avatar size="xl" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" status="offline" />
                </div>
              </div>

              {/* Badges */}
              <div>
                <h3 className="text-h3 text-text-primary mb-4">Badges</h3>
                <div className="flex gap-4">
                  <Avatar size="xl" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" verified />
                  <Avatar size="xl" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" premium />
                  <Avatar size="xl" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" tribal />
                  <Avatar size="xl" fallback="AB" verified status="online" />
                </div>
              </div>

              {/* Avatar Group */}
              <div>
                <h3 className="text-h3 text-text-primary mb-4">Avatar Group</h3>
                <AvatarGroup
                  max={5}
                  size="lg"
                  avatars={[
                    { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', alt: 'Sarah' },
                    { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', alt: 'Mike' },
                    { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', alt: 'Alex' },
                    { src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', alt: 'Emma' },
                    { fallback: 'JD' },
                    { fallback: 'AB' },
                    { fallback: 'CD' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges - Phase 2 */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Badges</h2>
          <Card variant="premium">
            <CardContent className="p-8 space-y-6">
              {/* Variants */}
              <div>
                <h3 className="text-h3 text-text-primary mb-4">Variants</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="gold">Gold</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="verified">Verified</Badge>
                  <Badge variant="premium">Premium</Badge>
                </div>
              </div>

              {/* With Icons & Dots */}
              <div>
                <h3 className="text-h3 text-text-primary mb-4">With Icons & Dots</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success" dot>Active</Badge>
                  <Badge variant="gold" icon={<Crown className="w-3 h-3" />}>Premium</Badge>
                  <Badge variant="primary" icon={<ShieldCheck className="w-3 h-3" />}>Verified</Badge>
                  <Badge variant="warning" dot>Pending</Badge>
                </div>
              </div>

              {/* Status Badges */}
              <div>
                <h3 className="text-h3 text-text-primary mb-4">Status Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="online" />
                  <StatusBadge status="away" />
                  <StatusBadge status="busy" />
                  <StatusBadge status="offline" />
                  <StatusBadge status="active" />
                  <StatusBadge status="pending" />
                </div>
              </div>

              {/* Match Score Badges */}
              <div>
                <h3 className="text-h3 text-text-primary mb-4">Match Score Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <MatchScoreBadge score={95} size="sm" />
                  <MatchScoreBadge score={82} />
                  <MatchScoreBadge score={67} size="lg" />
                  <MatchScoreBadge score={54} />
                </div>
              </div>

              {/* Notification Badges */}
              <div>
                <h3 className="text-h3 text-text-primary mb-4">Notification Badges</h3>
                <div className="flex gap-6">
                  <div className="relative">
                    <Button variant="ghost" size="icon">
                      <Heart className="w-5 h-5" />
                    </Button>
                    <NotificationBadge count={3} />
                  </div>
                  <div className="relative">
                    <Button variant="ghost" size="icon">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                    <NotificationBadge count={24} variant="gold" />
                  </div>
                  <div className="relative">
                    <Button variant="ghost" size="icon">
                      <Users className="w-5 h-5" />
                    </Button>
                    <NotificationBadge count={150} variant="default" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Toast Notifications - Phase 2 */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Toast Notifications</h2>
          <Card variant="premium">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => toast.success('Match found!', 'Sarah liked you back')}>
                  Success Toast
                </Button>
                <Button variant="outline" onClick={() => toast.error('Connection failed', 'Please try again')}>
                  Error Toast
                </Button>
                <Button variant="outline" onClick={() => toast.warning('Profile incomplete', 'Add more photos')}>
                  Warning Toast
                </Button>
                <Button variant="outline" onClick={() => toast.info('New feature', 'Try video chat')}>
                  Info Toast
                </Button>
                <Button variant="gold" onClick={() => toast.premium('Upgrade successful!', 'Welcome to Premium')}>
                  Premium Toast
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    toast.promise(
                      new Promise((resolve) => setTimeout(resolve, 2000)),
                      {
                        loading: 'Sending message...',
                        success: 'Message sent!',
                        error: 'Failed to send',
                      }
                    )
                  }}
                >
                  Promise Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dialogs - Phase 2 */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-8">Dialogs & Modals</h2>
          <Card variant="premium">
            <CardContent className="p-8">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="gold">Open Premium Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-h2 font-display text-text-primary">
                      Upgrade to Premium
                    </DialogTitle>
                    <DialogDescription className="text-text-secondary">
                      Get unlimited likes, see who viewed your profile, and stand out with our premium features.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-royal/10 border border-purple-royal/20">
                      <ShieldCheck className="w-5 h-5 text-gold-warm" />
                      <span className="text-sm text-text-primary">Verified badge on profile</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-royal/10 border border-purple-royal/20">
                      <Crown className="w-5 h-5 text-gold-warm" />
                      <span className="text-sm text-text-primary">Unlimited daily likes</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-royal/10 border border-purple-royal/20">
                      <Sparkles className="w-5 h-5 text-gold-warm" />
                      <span className="text-sm text-text-primary">Profile boost every month</span>
                    </div>
                    <Button variant="gold" className="w-full mt-4">
                      Upgrade Now - $9.99/month
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>

        {/* ============================================
            PHASE 3: MOTION & MICRO-INTERACTIONS
            ============================================ */}
        
        {/* Stagger Animations */}
        <section>
          <h2 className="text-h1 font-display text-text-primary mb-4">
            Phase 3: Motion & Micro-interactions
          </h2>
          <p className="text-body text-text-secondary mb-8">
            Buttery-smooth animations and delightful micro-interactions
          </p>

          <div className="space-y-12">
            {/* Stagger Grid Animation */}
            <div>
              <h3 className="text-h3 text-text-primary mb-4">Stagger Grid Animation</h3>
              <p className="text-body-sm text-text-secondary mb-6">
                Cards animate in with staggered delay - scroll down and back up to see
              </p>
              <StaggerGrid columns={3}>
                <Card variant="glass" className="p-6">
                  <Users className="w-8 h-8 text-gold-warm mb-3" />
                  <h4 className="text-h4 text-text-primary mb-2">Stagger Item 1</h4>
                  <p className="text-body-sm text-text-secondary">Animates in sequence</p>
                </Card>
                <Card variant="glass" className="p-6">
                  <Heart className="w-8 h-8 text-gold-warm mb-3" />
                  <h4 className="text-h4 text-text-primary mb-2">Stagger Item 2</h4>
                  <p className="text-body-sm text-text-secondary">With perfect timing</p>
                </Card>
                <Card variant="glass" className="p-6">
                  <Star className="w-8 h-8 text-gold-warm mb-3" />
                  <h4 className="text-h4 text-text-primary mb-2">Stagger Item 3</h4>
                  <p className="text-body-sm text-text-secondary">Smooth as butter</p>
                </Card>
                <Card variant="glass" className="p-6">
                  <Zap className="w-8 h-8 text-gold-warm mb-3" />
                  <h4 className="text-h4 text-text-primary mb-2">Stagger Item 4</h4>
                  <p className="text-body-sm text-text-secondary">Premium feel</p>
                </Card>
                <Card variant="glass" className="p-6">
                  <Crown className="w-8 h-8 text-gold-warm mb-3" />
                  <h4 className="text-h4 text-text-primary mb-2">Stagger Item 5</h4>
                  <p className="text-body-sm text-text-secondary">World-class UI</p>
                </Card>
                <Card variant="glass" className="p-6">
                  <Sparkles className="w-8 h-8 text-gold-warm mb-3" />
                  <h4 className="text-h4 text-text-primary mb-2">Stagger Item 6</h4>
                  <p className="text-body-sm text-text-secondary">Delightful</p>
                </Card>
              </StaggerGrid>
            </div>

            {/* Individual Animation Components */}
            <div>
              <h3 className="text-h3 text-text-primary mb-4">Individual Animations</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <FadeIn delay={0}>
                  <Card variant="premium" className="p-6 text-center">
                    <h4 className="text-h4 text-text-primary mb-2">Fade In</h4>
                    <p className="text-body-sm text-text-secondary">Simple opacity transition</p>
                  </Card>
                </FadeIn>
                
                <SlideUp delay={0.2}>
                  <Card variant="premium" className="p-6 text-center">
                    <h4 className="text-h4 text-text-primary mb-2">Slide Up</h4>
                    <p className="text-body-sm text-text-secondary">Slides from bottom</p>
                  </Card>
                </SlideUp>
                
                <ScaleIn delay={0.4}>
                  <Card variant="premium" className="p-6 text-center">
                    <h4 className="text-h4 text-text-primary mb-2">Scale In</h4>
                    <p className="text-body-sm text-text-secondary">Bouncy scale effect</p>
                  </Card>
                </ScaleIn>
              </div>
            </div>

            {/* Button Micro-interactions */}
            <div>
              <h3 className="text-h3 text-text-primary mb-4">Button Micro-interactions</h3>
              <p className="text-body-sm text-text-secondary mb-6">
                Hover over buttons to see shimmer effects and icon rotations
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="gold" size="lg">
                  <Star className="w-5 h-5" />
                  Gold Shimmer
                </Button>
                <Button variant="default" size="lg">
                  <Heart className="w-5 h-5" />
                  Purple Shimmer
                </Button>
                <Button variant="outline" size="lg">
                  <Sparkles className="w-5 h-5" />
                  Outline Hover
                </Button>
              </div>
            </div>

            {/* Card Hover States */}
            <div>
              <h3 className="text-h3 text-text-primary mb-4">Card Hover States</h3>
              <p className="text-body-sm text-text-secondary mb-6">
                Hover over cards to see different interaction patterns
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <Card variant="glass" className="p-6 card-interactive">
                  <h4 className="text-h4 text-text-primary mb-2">Interactive</h4>
                  <p className="text-body-sm text-text-secondary">Scales & glows on hover</p>
                  <Badge variant="gold" className="mt-4">Hover me</Badge>
                </Card>
                
                <Card variant="glass" className="p-6 card-lift">
                  <h4 className="text-h4 text-text-primary mb-2">Lift</h4>
                  <p className="text-body-sm text-text-secondary">Lifts up with shadow</p>
                  <Badge variant="gold" className="mt-4">Hover me</Badge>
                </Card>
                
                <Card variant="glass" className="p-6 card-glow border-2 border-border-gold/30">
                  <h4 className="text-h4 text-text-primary mb-2">Glow</h4>
                  <p className="text-body-sm text-text-secondary">Strong glow effect</p>
                  <Badge variant="gold" className="mt-4">Hover me</Badge>
                </Card>
              </div>
            </div>

            {/* Pulse & Shimmer Utilities */}
            <div>
              <h3 className="text-h3 text-text-primary mb-4">Animation Utilities</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Card variant="premium" className="p-6">
                  <h4 className="text-h4 text-text-primary mb-4">Glow Pulse</h4>
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-gold-gradient rounded-full animate-glow-pulse" />
                  </div>
                  <p className="text-body-sm text-text-secondary text-center mt-4">
                    Pulsing gold glow effect
                  </p>
                </Card>
                
                <Card variant="premium" className="p-6">
                  <h4 className="text-h4 text-text-primary mb-4">CSS Animations</h4>
                  <div className="space-y-2">
                    <div className="h-12 bg-purple-gradient rounded-lg animate-fade-in" />
                    <div className="h-12 bg-gold-gradient rounded-lg animate-slide-up" />
                    <div className="h-12 bg-royal-gradient rounded-lg animate-scale-in" />
                  </div>
                  <p className="text-body-sm text-text-secondary text-center mt-4">
                    Pure CSS animations
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Bottom Sheet Component */}
      <BottomSheet 
        open={bottomSheetOpen} 
        onClose={() => setBottomSheetOpen(false)}
        title="Filter Matches"
      >
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Label variant="premium">Age Range</Label>
            <div className="flex gap-4">
              <Input type="number" placeholder="Min" defaultValue="25" />
              <Input type="number" placeholder="Max" defaultValue="35" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label variant="premium">Distance (miles)</Label>
            <Input type="number" placeholder="Max distance" defaultValue="50" />
          </div>

          <div className="space-y-2">
            <Label variant="premium">Interests</Label>
            <Textarea placeholder="Hiking, Photography, Travel..." />
          </div>

          <Button variant="gold" className="w-full">
            Apply Filters
          </Button>
        </div>
      </BottomSheet>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
