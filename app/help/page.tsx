'use client'

import { ChevronDown, Search, MessageSquare, Ticket } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type Faq = {
  id: number
  category: string
  question: string
  answer: string
}

const FAQS: Faq[] = [
  {
    id: 1,
    category: 'Getting started',
    question: 'How do I create an account?',
    answer:
      'Tap “Join now” and complete the onboarding flow. Guardians verify identity with government ID, selfie, and concierge interview.',
  },
  {
    id: 2,
    category: 'Getting started',
    question: 'What tribes exist today?',
    answer: 'We prioritize real communities like Igbo, Yoruba, Hausa, Fulani, Ashanti, Ga, Dagomba, Ewe, Zulu, Xhosa, Kikuyu, Luo, and more diaspora tribes.',
  },
  {
    id: 3,
    category: 'Messaging',
    question: 'Can I message anyone?',
    answer: 'Free members have one intro per match. Premium tiers unlock unlimited threads plus concierge-crafted outreach templates.',
  },
  {
    id: 4,
    category: 'Messaging',
    question: 'How do I block someone?',
    answer: 'Open their profile, tap the ••• menu, then choose “Block”. Manage all blocked profiles inside Settings → Safety.',
  },
  {
    id: 5,
    category: 'Verification',
    question: 'Why is verification required?',
    answer: 'Verification keeps every tribe real. It reduces scams and protects the guardian network.',
  },
  {
    id: 6,
    category: 'Verification',
    question: 'How long does it take?',
    answer: 'Most profiles clear automated checks in under 24 hours. Concierge outreach happens if we need additional context.',
  },
  {
    id: 7,
    category: 'Safety',
    question: 'How do I report someone?',
    answer: 'Tap “Report member” from their profile or any message thread. Attach screenshots or context and our trust team reviews 24/7.',
  },
  {
    id: 8,
    category: 'Safety',
    question: 'Is my data secure?',
    answer: 'Yes—data is encrypted at rest and in transit. We never sell personal info and comply with GDPR + SOC2 controls.',
  },
]

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [openFaqId, setOpenFaqId] = useState<number | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [ticketForm, setTicketForm] = useState({
    category: 'general',
    subject: '',
    description: ''
  })

  const categories = useMemo(() => ['All', ...new Set(FAQS.map((faq) => faq.category))], [])

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory
    const matchesQuery = !query || faq.question.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      // Mock user ID - in production, get from auth context
      const userId = 'mock-user-id'
      const res = await fetch(`/api/admin/support/tickets?userId=${userId}`)
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    }
  }

  const handleCreateTicket = async () => {
    try {
      const res = await fetch('/api/admin/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'mock-user-id',
          userEmail: 'user@example.com',
          userName: 'Mock User',
          ...ticketForm
        })
      })

      if (res.ok) {
        setShowTicketDialog(false)
        setTicketForm({ category: 'general', subject: '', description: '' })
        fetchTickets()
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
    }
  }

  return (
    <MemberAppShell
      title="Concierge help"
      description="Search FAQs, ping live chat, or open a trust ticket. We respond within minutes."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">
            <MessageSquare className="h-4 w-4 mr-2" />
            Live chat
          </Button>
          <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
            <DialogTrigger asChild>
              <Button>
                <Ticket className="h-4 w-4 mr-2" />
                Create ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create support ticket</DialogTitle>
                <DialogDescription>
                  Our team will respond within 24 hours
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={ticketForm.category}
                    onValueChange={(value) => setTicketForm({ ...ticketForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    placeholder="Brief summary of your issue"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    placeholder="Please provide details about your issue"
                    rows={5}
                  />
                </div>
                <Button onClick={handleCreateTicket} className="w-full">
                  Submit ticket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="rounded-3xl border border-border bg-card/80 p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search help articles"
              className="pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <section className="space-y-3">
          {filteredFaqs.map((faq) => (
            <FaqItem
              key={faq.id}
              faq={faq}
              isOpen={openFaqId === faq.id}
              onToggle={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
            />
          ))}
          {!filteredFaqs.length && (
            <p className="rounded-2xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">
              Nothing found. Try another search term or contact concierge.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-linear-to-r from-blue-50 to-purple-50 p-8 text-center">
          <h2 className="text-2xl font-semibold">Need more help?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Concierge responds within 5 minutes during peak hours and under 30 minutes overnight.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline">Schedule call</Button>
            <Button>Contact support</Button>
          </div>
        </section>
      </div>
    </MemberAppShell>
  )
}

function FaqItem({ faq, isOpen, onToggle }: { faq: Faq; isOpen: boolean; onToggle: () => void }) {
  return (
    <article className="rounded-3xl border border-border bg-card/80">
      <button className="flex w-full items-center justify-between px-6 py-4 text-left" onClick={onToggle}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{faq.category}</p>
          <p className="text-sm font-semibold">{faq.question}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-accent transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="border-t border-border px-6 py-4 text-sm text-muted-foreground">{faq.answer}</div>
      )}
    </article>
  )
}
