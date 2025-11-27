'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, MapPin, Users, CheckCircle, Clock, Plus, QrCode } from 'lucide-react'

type Event = {
  _id: string
  title: string
  description: string
  startAt: string
  endAt: string
  location: { type: string; venue?: string }
  capacity: number
  tribe?: string
  tags: string[]
  visibility: string
}

type Registration = {
  _id: string
  userId: string
  status: string
  paymentStatus?: string
  ticketType?: string
  registeredAt: string
  checkedInAt?: string
  user?: {
    _id: string
    name: string
    email: string
    profilePhoto?: string
  }
}

export default function EventsAdminPage() {
  const [view, setView] = useState<'calendar' | 'list'>('list')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    timezone: 'America/New_York',
    tribe: '',
    location: { type: 'virtual', venue: '' },
    capacity: 100,
    visibility: 'public',
  })

  const loadEvents = async () => {
    const res = await fetch('/api/admin/events?status=upcoming')
    const data = await res.json()
    setEvents(data)
  }

  const loadRegistrations = async (eventId: string) => {
    const res = await fetch(`/api/admin/events/${eventId}/registrations`)
    const data = await res.json()
    setRegistrations(data)
  }

  const createEvent = async () => {
    await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventForm),
    })
    setShowCreateDialog(false)
    setEventForm({
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      timezone: 'America/New_York',
      tribe: '',
      location: { type: 'virtual', venue: '' },
      capacity: 100,
      visibility: 'public',
    })
    loadEvents()
  }

  const checkInAttendee = async (registrationId: string) => {
    await fetch(`/api/admin/events/registrations/${registrationId}/checkin`, {
      method: 'POST',
    })
    if (selectedEvent) {
      loadRegistrations(selectedEvent._id)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      loadRegistrations(selectedEvent._id)
    }
  }, [selectedEvent])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Events Management
        </h1>
        <p className="text-muted-foreground">Create events, manage registrations, and check-in attendees</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            List View
          </Button>
          <Button 
            variant={view === 'calendar' ? 'default' : 'outline'}
            onClick={() => setView('calendar')}
          >
            Calendar View
          </Button>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {showCreateDialog && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Create Event</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Event Title</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Summer Mixer 2024"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Event details..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.startAt}
                  onChange={(e) => setEventForm({ ...eventForm, startAt: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.endAt}
                  onChange={(e) => setEventForm({ ...eventForm, endAt: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location Type</Label>
                <select
                  value={eventForm.location.type}
                  onChange={(e) => setEventForm({
                    ...eventForm,
                    location: { ...eventForm.location, type: e.target.value },
                  })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="virtual">Virtual</option>
                  <option value="in_person">In Person</option>
                </select>
              </div>
              {eventForm.location.type === 'in_person' && (
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={eventForm.location.venue}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      location: { ...eventForm.location, venue: e.target.value },
                    })}
                    placeholder="123 Main St, NYC"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Visibility</Label>
                <select
                  value={eventForm.visibility}
                  onChange={(e) => setEventForm({ ...eventForm, visibility: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="public">Public</option>
                  <option value="tribe_only">Tribe Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createEvent}>Create Event</Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Events List */}
        <div className="col-span-1 space-y-3 overflow-y-auto max-h-[800px]">
          {events.map(event => (
            <Card
              key={event._id}
              className={`p-4 cursor-pointer hover:shadow-lg transition ${
                selectedEvent?._id === event._id ? 'border-primary border-2' : ''
              }`}
              onClick={() => setSelectedEvent(event)}
            >
              <h3 className="font-bold">{event.title}</h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(event.startAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {event.location.type === 'virtual' ? 'Virtual' : event.location.venue}
              </div>
              <div className="flex gap-2 mt-2">
                <Badge>{event.visibility}</Badge>
                {event.tribe && <Badge variant="outline">{event.tribe}</Badge>}
              </div>
            </Card>
          ))}
        </div>

        {/* Right: Event Details & Registrations */}
        <div className="col-span-2">
          {selectedEvent ? (
            <>
              <Card className="p-6 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                    <p className="text-muted-foreground mt-1">{selectedEvent.description}</p>
                  </div>
                  <Badge>{selectedEvent.visibility}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label>Start</Label>
                    <div className="text-sm">{new Date(selectedEvent.startAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <Label>End</Label>
                    <div className="text-sm">{new Date(selectedEvent.endAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <div className="text-sm">{selectedEvent.capacity} attendees</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Registrations ({registrations.length})
                  </h3>
                  <Button size="sm">
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Check-in
                  </Button>
                </div>

                <div className="space-y-2">
                  {registrations.map(reg => (
                    <div key={reg._id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-3">
                        {reg.user?.profilePhoto ? (
                          <img src={reg.user.profilePhoto} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{reg.user?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{reg.user?.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{reg.status}</Badge>
                        {reg.checkedInAt ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => checkInAttendee(reg._id)}
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select an event to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
