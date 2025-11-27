'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Beaker, Plus, TrendingUp, Users, BarChart3 } from 'lucide-react'

type FeatureFlag = {
  _id: string
  key: string
  name: string
  description?: string
  enabled: boolean
  rolloutPercentage: number
  targetSegments?: string[]
  variants?: Array<{
    key: string
    name: string
    weight: number
  }>
  createdAt: string
}

type ExperimentResult = {
  variant: string
  metrics: {
    users: number
    conversions: number
    conversionRate: number
  }
}

export default function LabsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null)
  const [experimentResults, setExperimentResults] = useState<ExperimentResult[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [flagForm, setFlagForm] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    rolloutPercentage: 0,
    variants: [
      { key: 'control', name: 'Control', weight: 50 },
      { key: 'treatment', name: 'Treatment', weight: 50 },
    ],
  })

  const loadFlags = async () => {
    const res = await fetch('/api/admin/labs/flags')
    const data = await res.json()
    setFlags(data)
  }

  const loadExperimentResults = async (key: string) => {
    const res = await fetch(`/api/admin/labs/experiments/${key}`)
    const data = await res.json()
    setExperimentResults(data)
  }

  const createFlag = async () => {
    await fetch('/api/admin/labs/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flagForm),
    })
    setShowCreateDialog(false)
    setFlagForm({
      key: '',
      name: '',
      description: '',
      enabled: false,
      rolloutPercentage: 0,
      variants: [
        { key: 'control', name: 'Control', weight: 50 },
        { key: 'treatment', name: 'Treatment', weight: 50 },
      ],
    })
    loadFlags()
  }

  const toggleFlag = async (key: string) => {
    await fetch(`/api/admin/labs/flags/${key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle' }),
    })
    loadFlags()
  }

  const updateRollout = async (key: string, percentage: number) => {
    await fetch(`/api/admin/labs/flags/${key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rolloutPercentage: percentage }),
    })
    loadFlags()
  }

  useEffect(() => {
    loadFlags()
  }, [])

  useEffect(() => {
    if (selectedFlag) {
      loadExperimentResults(selectedFlag.key)
    }
  }, [selectedFlag])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Beaker className="h-8 w-8" />
          Labs Dashboard
        </h1>
        <p className="text-muted-foreground">Manage feature flags and analyze experiments</p>
      </div>

      <div className="mb-6">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Feature Flag
        </Button>
      </div>

      {showCreateDialog && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Create Feature Flag</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Key</Label>
                <Input
                  value={flagForm.key}
                  onChange={(e) => setFlagForm({ ...flagForm, key: e.target.value })}
                  placeholder="new_checkout_flow"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={flagForm.name}
                  onChange={(e) => setFlagForm({ ...flagForm, name: e.target.value })}
                  placeholder="New Checkout Flow"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={flagForm.description}
                onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Initial Rollout %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={flagForm.rolloutPercentage}
                onChange={(e) => setFlagForm({ ...flagForm, rolloutPercentage: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={createFlag}>Create Flag</Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Flags List */}
        <div className="col-span-1 space-y-3 overflow-y-auto max-h-[800px]">
          {flags.map(flag => (
            <Card
              key={flag._id}
              className={`p-4 cursor-pointer hover:shadow-lg transition ${
                selectedFlag?._id === flag._id ? 'border-primary border-2' : ''
              }`}
              onClick={() => setSelectedFlag(flag)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold">{flag.name}</h3>
                  <code className="text-xs text-muted-foreground">{flag.key}</code>
                </div>
                <Badge className={flag.enabled ? 'bg-green-500' : 'bg-gray-500'}>
                  {flag.enabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
              {flag.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{flag.description}</p>
              )}
              <div className="mt-2">
                <div className="text-sm font-semibold">{flag.rolloutPercentage}% rollout</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Right: Flag Details & Results */}
        <div className="col-span-2">
          {selectedFlag ? (
            <>
              <Card className="p-6 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedFlag.name}</h2>
                    <code className="text-sm text-muted-foreground">{selectedFlag.key}</code>
                    {selectedFlag.description && (
                      <p className="text-muted-foreground mt-2">{selectedFlag.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedFlag.enabled}
                      onCheckedChange={() => toggleFlag(selectedFlag.key)}
                    />
                    <span className="text-sm">{selectedFlag.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Rollout Percentage: {selectedFlag.rolloutPercentage}%</Label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedFlag.rolloutPercentage}
                    onChange={(e) => updateRollout(selectedFlag.key, parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>

                {selectedFlag.variants && (
                  <div className="mt-4">
                    <Label>Variants</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {selectedFlag.variants.map(variant => (
                        <div key={variant.key} className="p-3 bg-muted rounded">
                          <div className="font-semibold">{variant.name}</div>
                          <div className="text-sm text-muted-foreground">{variant.weight}% weight</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Experiment Results
                </h3>

                {experimentResults.length > 0 ? (
                  <div className="space-y-4">
                    {experimentResults.map(result => (
                      <div key={result.variant} className="p-4 bg-muted rounded">
                        <h4 className="font-bold mb-2">{result.variant}</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Users</div>
                            <div className="text-2xl font-bold">{result.metrics.users}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Conversions</div>
                            <div className="text-2xl font-bold">{result.metrics.conversions}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Conv. Rate</div>
                            <div className="text-2xl font-bold">
                              {result.metrics.conversionRate.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No experiment data yet</p>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Beaker className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a feature flag to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
