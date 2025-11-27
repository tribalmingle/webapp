# TribalMingle Design System - Quick Reference

## 🎨 Color Palette

### Brand Colors
```tsx
// Tailwind Classes
bg-purple-royal      // #5B2E91
bg-purple-royal-light // #7B4FB8
bg-purple-royal-dark  // #3D1E61

bg-gold-warm         // #D4AF37
bg-gold-warm-light   // #E6C968
bg-gold-warm-dark    // #B8951E
```

### Backgrounds
```tsx
bg-background-primary   // #0A0A0A (deepest dark)
bg-background-secondary // #1A1A1A (elevated)
bg-background-tertiary  // #2A2A2A (highest)
```

### Text Colors
```tsx
text-text-primary   // #F5F5DC (warm white)
text-text-secondary // #B0B0B0 (muted gray)
text-text-tertiary  // #8B7355 (brown/tan)
```

---

## 📐 Typography

### Font Families
```tsx
font-sans    // Geist (UI elements)
font-display // Playfair Display (headings)
font-mono    // Geist Mono (code)
```

### Utility Classes
```tsx
text-display-xl  // 72px/80px - Hero headings
text-display-lg  // 60px/68px - Page titles
text-display-md  // 48px/56px - Section headers
text-h1          // 36px/44px - H1
text-h2          // 30px/36px - H2
text-h3          // 24px/32px - H3
text-body-lg     // 18px/28px - Large body
text-body        // 16px/24px - Regular body
text-body-sm     // 14px/20px - Small body
```

---

## 📏 Spacing (8px Grid)

```tsx
gap-xs  // 4px
gap-sm  // 8px
gap-md  // 16px
gap-lg  // 24px
gap-xl  // 32px
gap-2xl // 48px
gap-3xl // 64px
gap-4xl // 96px

// Same for: p-, m-, space-x-, space-y-
```

---

## 🔘 Buttons

### Import
```tsx
import { Button } from '@/components/ui/button'
```

### Variants
```tsx
<Button variant="default">Default</Button>
<Button variant="gold">Gold CTA</Button>      // ⭐ Primary CTA
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Sizes
```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">★</Button>
```

---

## 🃏 Cards

### Import
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
```

### Variants
```tsx
<Card variant="default">...</Card>   // Subtle gold border
<Card variant="premium">...</Card>   // ⭐ Strong gold + glow
<Card variant="glass">...</Card>     // Glassmorphism
<Card variant="flat">...</Card>      // Minimal
```

### Padding
```tsx
<Card padding="compact">...</Card>      // 16px
<Card padding="default">...</Card>      // 24px
<Card padding="comfortable">...</Card>  // 32px
```

### Example
```tsx
<Card variant="premium" padding="comfortable">
  <CardHeader>
    <CardTitle>Welcome</CardTitle>
    <CardDescription>Get started</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content here...</p>
  </CardContent>
  <CardFooter>
    <Button variant="gold">Continue</Button>
  </CardFooter>
</Card>
```

---

## 📝 Form Inputs

### Input
```tsx
import { Input } from '@/components/ui/input'

<Input variant="default" placeholder="Email..." />
<Input variant="premium" type="password" />  // ⭐ Premium style
```

### Textarea
```tsx
import { Textarea } from '@/components/ui/textarea'

<Textarea variant="default" placeholder="Message..." />
<Textarea variant="premium" rows={6} />
```

### Label
```tsx
import { Label } from '@/components/ui/label'

<Label variant="default">Username</Label>
<Label variant="premium">Email</Label>      // ⭐ Semibold
<Label variant="muted">Optional</Label>
<Label variant="accent">Required</Label>    // Gold color
```

### Select
```tsx
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select'

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

## 🎴 Premium Profile Card

### Import
```tsx
import { PremiumProfileCard } from '@/components/premium'
```

### Usage
```tsx
<PremiumProfileCard
  name="Sarah"
  age={28}
  location="Seattle, WA"
  bio="Adventure seeker..."
  imageUrl="/profiles/sarah.jpg"
  matchScore={94}
  isVerified={true}
  interests={['Hiking', 'Photography', 'Travel']}
  onLike={() => handleLike()}
  onPass={() => handlePass()}
/>
```

---

## ⏳ Premium Loader

### Import
```tsx
import { PremiumLoader, Spinner } from '@/components/ui/premium-loader'
```

### Usage
```tsx
// Full loader with message
<PremiumLoader message="Finding matches..." />

// Inline spinner
<Spinner />
```

---

## 📱 Bottom Sheet (Mobile)

### Import
```tsx
import { BottomSheet } from '@/components/ui/bottom-sheet'
```

### Usage
```tsx
const [open, setOpen] = useState(false)

<BottomSheet 
  open={open} 
  onClose={() => setOpen(false)}
  title="Filter Options"
>
  <div className="p-6">
    {/* Your content */}
  </div>
</BottomSheet>
```

---

## 🧭 Mobile Bottom Navigation

### Import
```tsx
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'
```

### Usage
```tsx
// Add to layout
<MobileBottomNav />

// Navigation items (pre-configured):
// Home, Discover, Likes (3), Chat (5), Profile
```

---

## 🎭 Shadows

```tsx
shadow-glow-gold    // Gold glow effect
shadow-glow-purple  // Purple glow effect
shadow-premium      // Elevated card shadow
```

---

## ✨ Animations

### CSS Classes
```tsx
animate-fade-in    // Fade in 200ms
animate-slide-up   // Slide up + fade 300ms
animate-scale-in   // Scale 95% → 100%
animate-glow-pulse // Pulsing glow (infinite)
```

### Hover/Active States
```tsx
// Buttons automatically have:
hover:scale-105    // Grow on hover
active:scale-95    // Shrink on click
```

---

## 🎯 Common Patterns

### Form Section
```tsx
<div className="space-y-lg">
  <div className="space-y-2">
    <Label variant="premium">Full Name</Label>
    <Input variant="premium" placeholder="John Doe" />
  </div>
  
  <div className="space-y-2">
    <Label variant="premium">Bio</Label>
    <Textarea variant="premium" placeholder="Tell us about yourself..." />
  </div>

  <Button variant="gold" className="w-full">
    Save Changes
  </Button>
</div>
```

### Stats Card
```tsx
<Card variant="premium">
  <CardContent className="p-8 text-center">
    <div className="text-display-md font-display text-gold-warm">
      1,247
    </div>
    <div className="text-body text-text-secondary mt-2">
      Active Members
    </div>
  </CardContent>
</Card>
```

### CTA Section
```tsx
<div className="bg-purple-gradient p-12 rounded-2xl text-center">
  <h2 className="text-h1 font-display text-text-primary mb-4">
    Ready to find your match?
  </h2>
  <p className="text-body-lg text-text-secondary mb-6">
    Join thousands of verified singles today.
  </p>
  <Button variant="gold" size="lg">
    Get Started Free
  </Button>
</div>
```

---

## 🔧 Customization

### Extending Colors
Edit `tailwind.config.ts`:
```ts
colors: {
  custom: {
    blue: '#4A90E2',
  }
}
```

### Adding Typography
Edit `app/globals.css`:
```css
.text-custom {
  font-size: 2rem;
  line-height: 2.5rem;
}
```

---

## 📦 Import Shortcuts

### Single Import
```tsx
// Premium components
import { PremiumProfileCard } from '@/components/premium'

// UI components
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PremiumLoader } from '@/components/ui/premium-loader'
import { BottomSheet } from '@/components/ui/bottom-sheet'

// Layouts
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'
```

---

## 🎨 Design Tokens (CSS Variables)

```css
/* Use in custom CSS */
.custom-element {
  color: var(--purple-royal);
  background: var(--bg-secondary);
  border-color: var(--gold-warm);
  box-shadow: var(--shadow-glow-gold);
  transition-timing-function: var(--ease-smooth);
}
```

---

## 🚀 Quick Start Template

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function MyPage() {
  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-display-lg font-display text-text-primary mb-8">
          My Page Title
        </h1>
        
        <Card variant="premium" padding="comfortable">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label variant="premium">Input Label</Label>
              <Input variant="premium" placeholder="Enter text..." />
            </div>
            
            <Button variant="gold" className="w-full">
              Submit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 📚 Additional Resources

- **Full Documentation:** `/docs/design/UI_UX_ENHANCEMENT_PLAN.md`
- **Phase 1 Summary:** `/docs/design/PHASE_1_COMPLETE.md`
- **Component Showcase:** `/design-system` route
- **Tailwind Config:** `/tailwind.config.ts`
- **Global Styles:** `/app/globals.css`

---

## 💡 Tips

1. **Always use variants** - Don't apply manual styling, use component variants
2. **Spacing system** - Stick to the 8px grid (xs, sm, md, lg, xl, 2xl, 3xl, 4xl)
3. **Gold for CTAs** - Primary actions should use `variant="gold"`
4. **Premium cards** - Use `variant="premium"` for important content
5. **Focus states** - All interactive elements have gold ring focus
6. **Dark first** - All colors are optimized for dark backgrounds
7. **Accessibility** - Use semantic HTML and proper ARIA labels
8. **Responsive** - Mobile bottom nav shows on small screens automatically

---

**Last Updated:** November 27, 2024  
**Design System Version:** 1.0.0 (Phase 1)
