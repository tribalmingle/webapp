'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Shield, CheckCircle, XCircle, Clock, User, Image } from 'lucide-react'

type Report = {
  _id: string
  reportedUserId: string
  reporterId: string
  category: string
  subcategory: string
  description: string
  evidence: any[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved'
  assignedTo?: string
  createdAt: string
  reportedUser?: {
    _id: string
    name: string
    email: string
    profilePhoto?: string
  }
  reporter?: {
    _id: string
    name: string
  }
}

type VerificationSession = {
  _id: string
  userId: string
  status: string
  detectionConfidence?: number
  referenceImageUrl?: string
  auditImageUrl?: string
  createdAt: string
  user?: {
    _id: string
    name: string
    email: string
    profilePhoto?: string
  }
}

type ModerationAction = {
  _id: string
  action: string
  reason: string
  evidence: any[]
  createdAt: string
  expiresAt?: string
  moderator?: {
    _id: string
    name: string
    email: string
  }
}

export default function TrustDeskPage() {
  const [activeView, setActiveView] = useState<'reports' | 'verification' | 'content'>('reports')
  const [reports, setReports] = useState<Report[]>([])
  const [verificationQueue, setVerificationQueue] = useState<VerificationSession[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedSession, setSelectedSession] = useState<VerificationSession | null>(null)
  const [userHistory, setUserHistory] = useState<ModerationAction[]>([])
  const [actionForm, setActionForm] = useState({
    action: '',
    reason: '',
    duration: '',
  })

  // Load reports
  const loadReports = async () => {
    const res = await fetch('/api/admin/trust/reports?status=open')
    const data = await res.json()
    setReports(data)
  }

  // Load verification queue
  const loadVerificationQueue = async () => {
    const res = await fetch('/api/admin/trust/verification')
    const data = await res.json()
    setVerificationQueue(data)
  }

  // Load user trust history
  const loadUserHistory = async (userId: string) => {
    const res = await fetch(`/api/admin/trust/history/${userId}`)
    const data = await res.json()
    setUserHistory(data)
  }

  // Apply moderation action
  const applyAction = async () => {
    if (!selectedReport && !selectedSession) return

    const targetUserId = selectedReport?.reportedUserId || selectedSession?.userId
    const reportId = selectedReport?._id

    await fetch('/api/admin/trust/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: actionForm.action,
        targetUserId,
        reportId,
        reason: actionForm.reason,
        evidence: selectedReport?.evidence || [],
        duration: actionForm.duration ? parseInt(actionForm.duration) : null,
      }),
    })

    // Reset and reload
    setActionForm({ action: '', reason: '', duration: '' })
    if (activeView === 'reports') loadReports()
    if (activeView === 'verification') loadVerificationQueue()
  }

  useEffect(() => {
    loadReports()
    loadVerificationQueue()
  }, [])

  useEffect(() => {
    if (selectedReport) {
      loadUserHistory(selectedReport.reportedUserId)
    }
    if (selectedSession) {
      loadUserHistory(selectedSession.userId)
    }
  }, [selectedReport, selectedSession])

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-gray-500 text-white',
    }
    return <Badge className={colors[priority as keyof typeof colors]}>{priority}</Badge>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Trust & Safety Desk
        </h1>
        <p className="text-muted-foreground">Monitor reports, verify identities, and moderate content</p>
      </div>

      {/* View Tabs */}
      <div className="mb-6 flex gap-2">
        <Button 
          variant={activeView === 'reports' ? 'default' : 'outline'}
          onClick={() => setActiveView('reports')}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Reports ({reports.length})
        </Button>
        <Button 
          variant={activeView === 'verification' ? 'default' : 'outline'}
          onClick={() => setActiveView('verification')}
        >
          <Image className="h-4 w-4 mr-2" />
          Photo Verification ({verificationQueue.length})
        </Button>
        <Button 
          variant={activeView === 'content' ? 'default' : 'outline'}
          onClick={() => setActiveView('content')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Content Moderation
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Queue */}
        <div className="col-span-1 space-y-3 overflow-y-auto max-h-[800px]">
          {activeView === 'reports' && reports.map(report => (
            <Card
              key={report._id}
              className={`p-4 cursor-pointer hover:shadow-lg transition ${
                selectedReport?._id === report._id ? 'border-primary border-2' : ''
              }`}
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {report.reportedUser?.profilePhoto ? (
                    <img src={report.reportedUser.profilePhoto} alt="" className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{report.reportedUser?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{report.category}</div>
                  </div>
                </div>
                {getPriorityBadge(report.priority)}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(report.createdAt).toLocaleString()}
              </div>
            </Card>
          ))}

          {activeView === 'verification' && verificationQueue.map(session => (
            <Card
              key={session._id}
              className={`p-4 cursor-pointer hover:shadow-lg transition ${
                selectedSession?._id === session._id ? 'border-primary border-2' : ''
              }`}
              onClick={() => setSelectedSession(session)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {session.user?.profilePhoto ? (
                    <img src={session.user.profilePhoto} alt="" className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{session.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{session.user?.email}</div>
                  </div>
                </div>
                <Badge>{session.status}</Badge>
              </div>
              {session.detectionConfidence && (
                <div className="text-sm">
                  Confidence: {(session.detectionConfidence * 100).toFixed(1)}%
                </div>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(session.createdAt).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>

        {/* Middle: Details */}
        <div className="col-span-1">
          {selectedReport && (
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Report Details</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Reported User</Label>
                  <div className="flex items-center gap-3 mt-2">
                    {selectedReport.reportedUser?.profilePhoto && (
                      <img 
                        src={selectedReport.reportedUser.profilePhoto} 
                        alt="" 
                        className="h-12 w-12 rounded-full" 
                      />
                    )}
                    <div>
                      <div className="font-semibold">{selectedReport.reportedUser?.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedReport.reportedUser?.email}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Category</Label>
                  <div className="mt-1">{selectedReport.category} - {selectedReport.subcategory}</div>
                </div>

                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-sm">{selectedReport.description}</p>
                </div>

                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedReport.priority)}</div>
                </div>

                <div>
                  <Label>Reporter</Label>
                  <div className="mt-1">{selectedReport.reporter?.name || 'Anonymous'}</div>
                </div>

                {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                  <div>
                    <Label>Evidence</Label>
                    <div className="mt-2 space-y-2">
                      {selectedReport.evidence.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          {item.type === 'screenshot' && (
                            <img src={item.url} alt="Evidence" className="w-full rounded" />
                          )}
                          {item.type === 'message' && (
                            <div className="p-2 bg-muted rounded">{item.content}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {selectedSession && (
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Verification Session</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>User</Label>
                  <div className="flex items-center gap-3 mt-2">
                    {selectedSession.user?.profilePhoto && (
                      <img 
                        src={selectedSession.user.profilePhoto} 
                        alt="" 
                        className="h-12 w-12 rounded-full" 
                      />
                    )}
                    <div>
                      <div className="font-semibold">{selectedSession.user?.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedSession.user?.email}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <div className="mt-1"><Badge>{selectedSession.status}</Badge></div>
                </div>

                {selectedSession.detectionConfidence && (
                  <div>
                    <Label>Detection Confidence</Label>
                    <div className="mt-1">{(selectedSession.detectionConfidence * 100).toFixed(1)}%</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedSession.referenceImageUrl && (
                    <div>
                      <Label>Reference Photo</Label>
                      <img 
                        src={selectedSession.referenceImageUrl} 
                        alt="Reference" 
                        className="mt-2 w-full rounded border"
                      />
                    </div>
                  )}
                  {selectedSession.auditImageUrl && (
                    <div>
                      <Label>Liveness Check</Label>
                      <img 
                        src={selectedSession.auditImageUrl} 
                        alt="Liveness" 
                        className="mt-2 w-full rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Action + History */}
        <div className="col-span-1 space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Take Action</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Action</Label>
                <select
                  value={actionForm.action}
                  onChange={(e) => setActionForm({ ...actionForm, action: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select action...</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="warn">Warn User</option>
                  <option value="suspend">Suspend Account</option>
                  <option value="ban">Ban Account</option>
                </select>
              </div>

              {(actionForm.action === 'suspend' || actionForm.action === 'ban') && (
                <div>
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={actionForm.duration}
                    onChange={(e) => setActionForm({ ...actionForm, duration: e.target.value })}
                    placeholder="86400 = 24 hours"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label>Reason</Label>
                <Textarea
                  value={actionForm.reason}
                  onChange={(e) => setActionForm({ ...actionForm, reason: e.target.value })}
                  placeholder="Explain your decision..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={applyAction}
                disabled={!actionForm.action || !actionForm.reason}
                className="w-full"
              >
                Apply Action
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">User History</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {userHistory.map(action => (
                <div key={action._id} className="p-3 bg-muted rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Badge>{action.action}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(action.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs">{action.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {action.moderator?.name || 'System'}
                  </p>
                </div>
              ))}
              {userHistory.length === 0 && (
                <div className="text-sm text-muted-foreground">No history</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
