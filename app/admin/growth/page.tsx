'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { TrendingUp, Users, Mail, Send, Plus, Trash2, Play, Pause } from 'lucide-react'

type Segment = {
  _id: string
  name: string
  description?: string
  filters: Array<{ field: string; operator: string; value: any }>
  memberCount?: number
  lastEvaluated?: string
}

type Campaign = {
  _id: string
  name: string
  segmentId: string
  type: 'email' | 'push' | 'sms'
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused'
  content: {
    subject?: string
    body: string
    cta?: string
    ctaUrl?: string
  }
  stats?: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    converted: number
  }
}

export default function GrowthLabPage() {
  const [view, setView] = useState<'segments' | 'campaigns'>('segments')
  const [segments, setSegments] = useState<Segment[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [showSegmentBuilder, setShowSegmentBuilder] = useState(false)
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false)
  const [segmentForm, setSegmentForm] = useState({
    name: '',
    description: '',
    filters: [{ field: 'plan', operator: 'equals', value: '' }],
  })
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    segmentId: '',
    type: 'email' as 'email' | 'push' | 'sms',
    content: {
      subject: '',
      body: '',
      cta: '',
      ctaUrl: '',
    },
    schedule: {
      startDate: new Date().toISOString().split('T')[0],
    },
  })

  const loadSegments = async () => {
    const res = await fetch('/api/admin/growth/segments')
    const data = await res.json()
    setSegments(data)
  }

  const loadCampaigns = async () => {
    const res = await fetch('/api/admin/growth/campaigns')
    const data = await res.json()
    setCampaigns(data)
  }

  const createSegment = async () => {
    await fetch('/api/admin/growth/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(segmentForm),
    })
    setShowSegmentBuilder(false)
    setSegmentForm({ name: '', description: '', filters: [{ field: 'plan', operator: 'equals', value: '' }] })
    loadSegments()
  }

  const createCampaign = async () => {
    await fetch('/api/admin/growth/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignForm),
    })
    setShowCampaignBuilder(false)
    setCampaignForm({
      name: '',
      segmentId: '',
      type: 'email',
      content: { subject: '', body: '', cta: '', ctaUrl: '' },
      schedule: { startDate: new Date().toISOString().split('T')[0] },
    })
    loadCampaigns()
  }

  const scheduleCampaign = async (campaignId: string) => {
    await fetch(`/api/admin/growth/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'schedule' }),
    })
    loadCampaigns()
  }

  const toggleCampaign = async (campaignId: string) => {
    await fetch(`/api/admin/growth/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle' }),
    })
    loadCampaigns()
  }

  const addFilter = () => {
    setSegmentForm({
      ...segmentForm,
      filters: [...segmentForm.filters, { field: '', operator: 'equals', value: '' }],
    })
  }

  const removeFilter = (index: number) => {
    const filters = [...segmentForm.filters]
    filters.splice(index, 1)
    setSegmentForm({ ...segmentForm, filters })
  }

  const updateFilter = (index: number, field: string, value: any) => {
    const filters = [...segmentForm.filters]
    filters[index] = { ...filters[index], [field]: value }
    setSegmentForm({ ...segmentForm, filters })
  }

  useEffect(() => {
    loadSegments()
    loadCampaigns()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Growth Lab
        </h1>
        <p className="text-muted-foreground">Build segments, run campaigns, and analyze experiments</p>
      </div>

      <div className="mb-6 flex gap-2">
        <Button 
          variant={view === 'segments' ? 'default' : 'outline'}
          onClick={() => setView('segments')}
        >
          <Users className="h-4 w-4 mr-2" />
          Segments ({segments.length})
        </Button>
        <Button 
          variant={view === 'campaigns' ? 'default' : 'outline'}
          onClick={() => setView('campaigns')}
        >
          <Mail className="h-4 w-4 mr-2" />
          Campaigns ({campaigns.length})
        </Button>
      </div>

      {view === 'segments' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">User Segments</h2>
            <Button onClick={() => setShowSegmentBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Segment
            </Button>
          </div>

          {showSegmentBuilder && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Segment Builder</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={segmentForm.name}
                    onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                    placeholder="Premium users in NYC"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={segmentForm.description}
                    onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                    placeholder="Optional description"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Filters</Label>
                  <div className="space-y-2 mt-2">
                    {segmentForm.filters.map((filter, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                        <select
                          value={filter.field}
                          onChange={(e) => updateFilter(idx, 'field', e.target.value)}
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select field...</option>
                          <option value="plan">Plan</option>
                          <option value="tribe">Tribe</option>
                          <option value="location">Location</option>
                          <option value="createdAt">Signup Date</option>
                          <option value="lastSeenAt">Last Active</option>
                        </select>

                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(idx, 'operator', e.target.value)}
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="contains">Contains</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                          <option value="in">In</option>
                        </select>

                        <Input
                          value={filter.value}
                          onChange={(e) => updateFilter(idx, 'value', e.target.value)}
                          placeholder="Value"
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(idx)}
                          disabled={segmentForm.filters.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={addFilter} variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Filter
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createSegment}>Create Segment</Button>
                  <Button variant="outline" onClick={() => setShowSegmentBuilder(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-4">
            {segments.map(segment => (
              <Card key={segment._id} className="p-4 hover:shadow-lg transition cursor-pointer">
                <h3 className="font-bold text-lg">{segment.name}</h3>
                {segment.description && (
                  <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    {segment.memberCount !== undefined ? segment.memberCount.toLocaleString() : '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">members</span>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">{segment.filters.length} filters</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view === 'campaigns' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Campaigns</h2>
            <Button onClick={() => setShowCampaignBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          {showCampaignBuilder && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Campaign Builder</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Campaign Name</Label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="Spring Promo 2024"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Target Segment</Label>
                  <select
                    value={campaignForm.segmentId}
                    onChange={(e) => setCampaignForm({ ...campaignForm, segmentId: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select segment...</option>
                    {segments.map(seg => (
                      <option key={seg._id} value={seg._id}>
                        {seg.name} ({seg.memberCount || 0} members)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Channel</Label>
                  <select
                    value={campaignForm.type}
                    onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value as any })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="email">Email</option>
                    <option value="push">Push Notification</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                {campaignForm.type === 'email' && (
                  <div>
                    <Label>Subject Line</Label>
                    <Input
                      value={campaignForm.content.subject}
                      onChange={(e) => setCampaignForm({
                        ...campaignForm,
                        content: { ...campaignForm.content, subject: e.target.value },
                      })}
                      placeholder="Spring is here! 🌸"
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={campaignForm.content.body}
                    onChange={(e) => setCampaignForm({
                      ...campaignForm,
                      content: { ...campaignForm.content, body: e.target.value },
                    })}
                    placeholder="Write your message..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Call-to-Action</Label>
                    <Input
                      value={campaignForm.content.cta}
                      onChange={(e) => setCampaignForm({
                        ...campaignForm,
                        content: { ...campaignForm.content, cta: e.target.value },
                      })}
                      placeholder="Upgrade Now"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>CTA URL</Label>
                    <Input
                      value={campaignForm.content.ctaUrl}
                      onChange={(e) => setCampaignForm({
                        ...campaignForm,
                        content: { ...campaignForm.content, ctaUrl: e.target.value },
                      })}
                      placeholder="/subscription"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={campaignForm.schedule.startDate}
                    onChange={(e) => setCampaignForm({
                      ...campaignForm,
                      schedule: { ...campaignForm.schedule, startDate: e.target.value },
                    })}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={createCampaign}>Create Campaign</Button>
                  <Button variant="outline" onClick={() => setShowCampaignBuilder(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            {campaigns.map(campaign => (
              <Card key={campaign._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{campaign.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge>{campaign.type}</Badge>
                      <Badge variant="outline">{campaign.status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {campaign.status === 'draft' && (
                      <Button size="sm" onClick={() => scheduleCampaign(campaign._id)}>
                        <Send className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                    )}
                    {(campaign.status === 'active' || campaign.status === 'paused') && (
                      <Button size="sm" variant="outline" onClick={() => toggleCampaign(campaign._id)}>
                        {campaign.status === 'active' ? (
                          <><Pause className="h-4 w-4 mr-1" />Pause</>
                        ) : (
                          <><Play className="h-4 w-4 mr-1" />Resume</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {campaign.stats && (
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold">{campaign.stats.sent}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{campaign.stats.delivered}</div>
                      <div className="text-xs text-muted-foreground">Delivered</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{campaign.stats.opened}</div>
                      <div className="text-xs text-muted-foreground">Opened</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{campaign.stats.clicked}</div>
                      <div className="text-xs text-muted-foreground">Clicked</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{campaign.stats.converted}</div>
                      <div className="text-xs text-muted-foreground">Converted</div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
