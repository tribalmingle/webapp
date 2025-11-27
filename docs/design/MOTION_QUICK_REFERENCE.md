# TribalMingle Phase 3: Motion Quick Reference

## 🎯 Stagger Animations

```tsx
import { StaggerGrid, StaggerContainer } from '@/components/motion'

// Grid layout (auto-responsive)
<StaggerGrid columns={3}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</StaggerGrid>

// Custom container
<StaggerContainer staggerDelay={0.15}>
  <div>Item 1</div>
  <div>Item 2</div>
</StaggerContainer>
```

---

## 🎬 Page Transitions

```tsx
import { PageTransition, FadeIn, SlideUp, ScaleIn } from '@/components/motion'

// Wrap entire page
<PageTransition variant="fade">
  <main>Content</main>
</PageTransition>

// Individual sections
<SlideUp delay={0.2}>
  <h1>Headline</h1>
</SlideUp>

<FadeIn delay={0.4}>
  <p>Description</p>
</FadeIn>

<ScaleIn delay={0.6}>
  <Button>CTA</Button>
</ScaleIn>
```

---

## ✨ Button Micro-interactions

Buttons automatically get shimmer effects and icon rotations:

```tsx
// Gold shimmer + icon rotation
<Button variant="gold">
  <Star className="w-5 h-5" />
  Premium Action
</Button>

// Purple shimmer + icon rotation
<Button variant="default">
  <Heart className="w-5 h-5" />
  Default Action
</Button>
```

---

## 🎴 Card Hover States

```tsx
// Interactive: scales + glows
<Card className="card-interactive">
  Clickable content
</Card>

// Lift: elevates with shadow
<Card className="card-lift">
  Feature content
</Card>

// Glow: strong border glow
<Card className="card-glow border-2 border-border-gold/30">
  Premium content
</Card>
```

---

## 🎨 Tailwind Animations

```tsx
<div className="animate-fade-in">Fades in</div>
<div className="animate-slide-up">Slides up from bottom</div>
<div className="animate-scale-in">Bouncy scale effect</div>
<div className="animate-glow-pulse">Pulsing gold glow</div>
<div className="animate-shimmer">Shimmer effect</div>
```

---

## ⏱️ Timing & Easing

```tsx
// Duration
<div className="transition-all duration-fast">150ms</div>
<div className="transition-all duration-normal">300ms</div>
<div className="transition-all duration-slow">500ms</div>

// Easing curves (CSS)
transition-timing-function: var(--ease-smooth);  // Default
transition-timing-function: var(--ease-bounce);  // Bouncy
transition-timing-function: var(--ease-spring);  // Spring
```

---

## 📋 Common Patterns

### Dashboard Stats Grid
```tsx
<StaggerGrid columns={4}>
  {stats.map(stat => (
    <StatCard key={stat.id} {...stat} />
  ))}
</StaggerGrid>
```

### Hero Section
```tsx
<section>
  <SlideUp>
    <h1 className="text-display-xl">Headline</h1>
  </SlideUp>
  <FadeIn delay={0.2}>
    <p className="text-body-lg">Description</p>
  </FadeIn>
  <ScaleIn delay={0.4}>
    <Button variant="gold">Get Started</Button>
  </ScaleIn>
</section>
```

### Match Cards
```tsx
<StaggerGrid columns={3}>
  {profiles.map(profile => (
    <Card key={profile.id} className="card-interactive">
      <PremiumProfileCard {...profile} />
    </Card>
  ))}
</StaggerGrid>
```

---

## 🎯 View Live Examples

**Design System Showcase**: `http://localhost:3001/design-system`

Scroll to "Phase 3: Motion & Micro-interactions" section for interactive demos.
