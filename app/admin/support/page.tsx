'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_COLORS } from '@/lib/constants/admin-theme'
import {
  MessageSquare, ArrowLeft, Clock, CheckCircle, AlertCircle,
  User, Mail, Tag, Zap, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Ticket {
  _id: string
  userId: string
  userName: string
  userEmail: string
  status: string
  priority: string
  category: string
  subject: string
  description: string
  slaDeadline: string
  slaBreach: boolean
  createdAt: string
  assignedTo?: string
}

interface Message {
  _id: string
  authorName: string
  authorType: 'customer' | 'agent'
  message: string
  createdAt: string
}

interface CannedResponse {
  _id: string
  title: string
  content: string
  category: string
}

export default function AdminSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([])
  const [replyMessage, setReplyMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadQueue()
    loadCannedResponses()
  }, [statusFilter])

  const loadQueue = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/support/queue?status=${statusFilter}`)
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error loading queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCannedResponses = async () => {
    try {
      const res = await fetch('/api/admin/support/canned-responses')
      const data = await res.json()
      setCannedResponses(data.responses || [])
    } catch (error) {
      console.error('Error loading canned responses:', error)
    }
  }

  const loadTicketDetails = async (ticket: Ticket) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticket._id}`)
      const data = await res.json()
      setSelectedTicket(data.ticket)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error loading ticket details:', error)
    }
  }

  const assignTicket = async (ticketId: string) => {
    try {
      await fetch(`/api/admin/support/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'current-admin',
          agentName: 'Admin Agent'
        })
      })
      loadQueue()
      if (selectedTicket?._id === ticketId) {
        loadTicketDetails(selectedTicket)
      }
    } catch (error) {
      console.error('Error assigning ticket:', error)
    }
  }

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return

    try {
      await fetch(`/api/admin/support/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: 'current-admin',
          authorName: 'Admin Agent',
          authorType: 'agent',
          message: replyMessage
        })
      })

      setReplyMessage('')
      loadTicketDetails(selectedTicket)
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }

  const resolveTicket = async (ticketId: string) => {
    try {
      await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      })
      loadQueue()
      setSelectedTicket(null)
      setMessages([])
    } catch (error) {
      console.error('Error resolving ticket:', error)
    }
  }

  const useCannedResponse = (response: CannedResponse) => {
    setReplyMessage(response.content)
  }

  const getPriorityColor = (priority: string) => {
    const priorityKey = priority as keyof typeof ADMIN_COLORS.priority
    return ADMIN_COLORS.priority[priorityKey] || ADMIN_COLORS.priority.low
  }

  const getStatusColor = (status: string) => {
    const statusKey = status as keyof typeof ADMIN_COLORS.status
    return ADMIN_COLORS.status[statusKey] || ADMIN_COLORS.badge.neutral
  }

  const getTimeRemaining = (deadline: string) => {
    const now = new Date()
    const sla = new Date(deadline)
    const diff = sla.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (diff < 0) return 'Breached'
    if (hours < 1) return `${minutes}m remaining`
    return `${hours}h ${minutes}m remaining`
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <header className="bg-background-secondary border-b border-border-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/overview')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <MessageSquare className="h-6 w-6 text-purple-royal-light" />
              <h1 className="text-xl font-semibold text-text-primary">Support Desk</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Queue */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Support Queue</CardTitle>
              <CardDescription>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-text-tertiary">Loading...</p>
                ) : tickets.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No tickets found</p>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket._id}
                      onClick={() => loadTicketDetails(ticket)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTicket?._id === ticket._id
                          ? 'bg-purple-royal/20 border-purple-royal/40'
                          : 'bg-background-secondary border-border-gold/20 hover:bg-background-tertiary'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-1">{ticket.subject}</p>
                          <p className="text-xs text-text-tertiary">{ticket.userName}</p>
                        </div>
                        <Badge className={getPriorityColor(ticket.priority)} variant="secondary">
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">{ticket.category}</Badge>
                      </div>
                      {ticket.slaBreach ? (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          SLA Breached
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-text-tertiary">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {getTimeRemaining(ticket.slaDeadline)}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <CardDescription>
                {selectedTicket ? `#${selectedTicket._id.slice(-6)} - ${selectedTicket.subject}` : 'Select a ticket'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTicket ? (
                <p className="text-center text-text-tertiary py-12">
                  Select a ticket from the queue to view details
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Ticket Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-background-tertiary rounded-lg">
                    <div>
                      <p className="text-xs text-text-tertiary">Customer</p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedTicket.userName}
                      </p>
                      <p className="text-xs text-text-tertiary flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {selectedTicket.userEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">Category & Priority</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {selectedTicket.category}
                        </Badge>
                        <Badge className={getPriorityColor(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!selectedTicket.assignedTo && (
                    <Button className="w-full" onClick={() => assignTicket(selectedTicket._id)}>
                      Assign to me
                    </Button>
                  )}

                  {/* Messages */}
                  <div>
                    <h3 className="font-semibold mb-3">Conversation</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {messages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`p-3 rounded-lg ${
                            msg.authorType === 'customer'
                              ? 'bg-background-tertiary'
                              : 'bg-cyan-50 border border-cyan-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium">
                              {msg.authorName}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {msg.authorType}
                              </Badge>
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-text-primary">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Canned Responses */}
                  {cannedResponses.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-sm">Quick Replies</h3>
                      <div className="flex flex-wrap gap-2">
                        {cannedResponses.slice(0, 3).map((response) => (
                          <Button
                            key={response._id}
                            size="sm"
                            variant="outline"
                            onClick={() => useCannedResponse(response)}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            {response.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply Form */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type your response..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={sendReply} className="flex-1">
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => resolveTicket(selectedTicket._id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

