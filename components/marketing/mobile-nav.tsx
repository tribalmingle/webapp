"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

interface MobileNavProps {
  primaryCta: string
  dictionary: {
    footer: {
      features: string
      contact: string
    }
  }
}

export function MobileNav({ primaryCta, dictionary }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm">
        <nav className="flex flex-col gap-6 mt-8">
          <a 
            href="#features" 
            onClick={() => setOpen(false)}
            className="text-2xl font-display hover:text-purple-royal transition-colors"
          >
            {dictionary.footer.features}
          </a>
          <a 
            href="#stories" 
            onClick={() => setOpen(false)}
            className="text-2xl font-display hover:text-purple-royal transition-colors"
          >
            Stories
          </a>
          <a 
            href="#events" 
            onClick={() => setOpen(false)}
            className="text-2xl font-display hover:text-purple-royal transition-colors"
          >
            Events
          </a>
          <a 
            href="#contact" 
            onClick={() => setOpen(false)}
            className="text-2xl font-display hover:text-purple-royal transition-colors"
          >
            {dictionary.footer.contact}
          </a>
          
          <Separator className="my-4" />
          
          <Link href="/login" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full justify-start text-lg h-12">
              Log In
            </Button>
          </Link>
          <Link href="/sign-up" onClick={() => setOpen(false)}>
            <Button className="w-full justify-start text-lg bg-purple-gradient h-12">
              {primaryCta}
            </Button>
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
