"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Activity, Users, TrendingUp, RefreshCw, Search, Eye, MousePointerClick } from 'lucide-react'

interface AnalyticsEvent {
  _id: string
  eventType: string
  userId?: string
  sessionId?: string
  timestamp: string
  properties?: Record<string, any>
}

interface LinkAnalytics {
  totalClicks: number
  uniqueUsers: number
  clicksByDay: Record<string, number>
  topReferrers: Array<{ referer: string; count: number }>
  deviceBreakdown: { mobile: number; tablet: number; desktop: number }
}

export default function RealtimeAnalyticsPanel() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [activeUsers, setActiveUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [linkAnalytics, setLinkAnalytics] = useState<LinkAnalytics | null>(null)
  const [linkCode, setLinkCode] = useState('')

  useEffect(() => {
    fetchRealtimeData()
    const interval = setInterval(fetchRealtimeData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchRealtimeData = async () => {
    try {
      const [eventsRes, activeRes] = await Promise.all([
        fetch('/api/analytics/track?limit=50'),
        fetch('/api/analytics/active-users'),
      ])

      const eventsData = await eventsRes.json()
      const activeData = await activeRes.json()

      if (eventsData.success) {
        setEvents(eventsData.events)
      }

      if (activeData.success) {
        setActiveUsers(activeData.count)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLinkAnalytics = async (code: string) => {
    try {
      const res = await fetch(`/api/links/${code}/analytics`)
      const data = await res.json()

      if (data.success) {
        setSelectedLink(code)
        setLinkAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching link analytics:', error)
    }
  }

  const eventTypeCount = events.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topEvents = Object.entries(eventTypeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const filteredEvents = events.filter((event) =>
    event.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.userId?.includes(searchQuery) ||
    JSON.stringify(event.properties).toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Analytics</h1>
          <p className="text-muted-foreground">Live event monitoring and deep link insights</p>
        </div>
        <Button onClick={fetchRealtimeData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">Last 50 events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(eventTypeCount).length}</div>
            <p className="text-xs text-muted-foreground">Unique types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(events.map((e) => e.sessionId).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">Active sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Real-time Event Stream</CardTitle>
            <CardDescription>Live events from your application</CardDescription>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredEvents.map((event) => (
                <div key={event._id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Activity className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{event.eventType}</span>
                      <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {event.userId && <div className="text-xs text-muted-foreground mt-1">User: {event.userId}</div>}
                    {event.properties && Object.keys(event.properties).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {Object.entries(event.properties)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {JSON.stringify(value)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No events match your search' : 'No events yet'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Events</CardTitle>
            <CardDescription>Most frequent event types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEvents.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{type}</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
              {topEvents.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No events tracked yet</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Short Link Performance</CardTitle>
          <CardDescription>Enter a short link code to view analytics (e.g., "abc123")</CardDescription>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Enter link code..."
              value={linkCode}
              onChange={(event) => setLinkCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && linkCode.trim()) {
                  fetchLinkAnalytics(linkCode.trim())
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (linkCode.trim()) {
                  fetchLinkAnalytics(linkCode.trim())
                }
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        {linkAnalytics && selectedLink && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MousePointerClick className="w-4 h-4" />
                  <span className="text-sm">Total Clicks</span>
                </div>
                <div className="text-2xl font-bold">{linkAnalytics.totalClicks}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Unique Users</span>
                </div>
                <div className="text-2xl font-bold">{linkAnalytics.uniqueUsers}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Conversion Rate</span>
                </div>
                <div className="text-2xl font-bold">
                  {linkAnalytics.totalClicks > 0 ? ((linkAnalytics.uniqueUsers / linkAnalytics.totalClicks) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Top Referrers</h4>
                <div className="space-y-2">
                  {linkAnalytics.topReferrers.slice(0, 5).map((ref) => (
                    <div key={ref.referer} className="flex justify-between text-sm">
                      <span className="truncate">{ref.referer}</span>
                      <span className="text-muted-foreground">{ref.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Device Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(linkAnalytics.deviceBreakdown).map(([device, count]) => (
                    <div key={device} className="flex justify-between text-sm">
                      <span className="capitalize">{device}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
