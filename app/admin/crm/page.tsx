'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, UserCog, Plus, CheckCircle, Clock, AlertCircle,
  ArrowLeft, MessageSquare, Phone, Mail, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface Member {
  _id: string
  email: string
  name?: string
  subscriptionPlan?: string
  createdAt: string
}

interface Task {
  _id: string
  type: string
  status: string
  priority: string
  title: string
  dueDate?: string
  relatedUserId?: string
}

interface Note {
  _id: string
  content: string
  authorName: string
  createdAt: string
}

export default function CRMPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberDetails, setMemberDetails] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({
    type: 'check_in' as const,
    priority: 'medium' as const,
    title: '',
    description: ''
  })

  useEffect(() => {
    searchMembers()
    loadTasks()
  }, [])

  const searchMembers = async (query: string = '') => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/crm/members?query=${query}`)
      const data = await res.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Error searching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMemberDetails = async (memberId: string) => {
    try {
      const res = await fetch(`/api/admin/crm/members/${memberId}`)
      const data = await res.json()
      setMemberDetails(data)
      setSelectedMember(data.user)
    } catch (error) {
      console.error('Error loading member details:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/admin/crm/tasks?assigneeId=current-admin')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const createNote = async () => {
    if (!selectedMember || !noteContent.trim()) return

    try {
      await fetch('/api/admin/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedMember._id,
          authorId: 'current-admin',
          authorName: 'Admin User',
          content: noteContent
        })
      })

      setNoteContent('')
      setShowNoteForm(false)
      loadMemberDetails(selectedMember._id)
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const createTask = async () => {
    if (!taskForm.title.trim()) return

    try {
      await fetch('/api/admin/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeId: 'current-admin',
          assigneeName: 'Admin User',
          relatedUserId: selectedMember?._id,
          ...taskForm
        })
      })

      setTaskForm({ type: 'check_in', priority: 'medium', title: '', description: '' })
      setShowTaskForm(false)
      loadTasks()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetch(`/api/admin/crm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      loadTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/overview')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <UserCog className="h-6 w-6 text-purple-600" />
              <h1 className="text-xl font-semibold text-gray-900">CRM</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member Search */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Member Search</CardTitle>
              <CardDescription>Find high-value members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email"
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchMembers(e.target.value)
                    }}
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-gray-500">No members found</p>
                  ) : (
                    members.map((member) => (
                      <button
                        key={member._id}
                        onClick={() => loadMemberDetails(member._id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedMember?._id === member._id
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{member.name || member.email}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                        {member.subscriptionPlan && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {member.subscriptionPlan}
                          </Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Member Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Member Details</CardTitle>
              <CardDescription>
                {selectedMember ? `Viewing ${selectedMember.email}` : 'Select a member to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedMember ? (
                <p className="text-center text-gray-500 py-12">
                  Search and select a member to view their details
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>

                  {/* Notes */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-900">Notes</h3>
                      <Button size="sm" onClick={() => setShowNoteForm(!showNoteForm)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add note
                      </Button>
                    </div>

                    {showNoteForm && (
                      <div className="mb-4 space-y-2">
                        <Textarea
                          placeholder="Add a note..."
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={createNote}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowNoteForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {memberDetails?.notes?.length === 0 ? (
                        <p className="text-sm text-gray-500">No notes yet</p>
                      ) : (
                        memberDetails?.notes?.map((note: Note) => (
                          <div key={note._id} className="border rounded-lg p-3 bg-gray-50">
                            <p className="text-sm text-gray-900">{note.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {note.authorName} · {new Date(note.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-900">Related Tasks</h3>
                      <Button size="sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Create task
                      </Button>
                    </div>

                    {showTaskForm && (
                      <div className="mb-4 space-y-3 border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium">Type</label>
                            <Select value={taskForm.type} onValueChange={(value: any) => setTaskForm({ ...taskForm, type: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="initial_call">Initial Call</SelectItem>
                                <SelectItem value="match_suggestion">Match Suggestion</SelectItem>
                                <SelectItem value="check_in">Check In</SelectItem>
                                <SelectItem value="renewal_discussion">Renewal Discussion</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={taskForm.priority} onValueChange={(value: any) => setTaskForm({ ...taskForm, priority: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Input
                          placeholder="Task title"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={createTask}>Create</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowTaskForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {memberDetails?.tasks?.length === 0 ? (
                        <p className="text-sm text-gray-500">No tasks</p>
                      ) : (
                        memberDetails?.tasks?.map((task: Task) => (
                          <div key={task._id} className="border rounded-lg p-3 flex items-start gap-3">
                            {getStatusIcon(task.status)}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-sm">{task.title}</p>
                                  <p className="text-xs text-gray-500">{task.type.replace('_', ' ')}</p>
                                </div>
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                              </div>
                              {task.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="mt-2"
                                  onClick={() => updateTaskStatus(task._id, 'completed')}
                                >
                                  Mark complete
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Tasks */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Tasks assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.filter(t => t.status !== 'completed').length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No pending tasks</p>
              ) : (
                tasks
                  .filter(t => t.status !== 'completed')
                  .map((task) => (
                    <div key={task._id} className="border rounded-lg p-4 flex items-start gap-3">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-gray-500">{task.type.replace('_', ' ')}</p>
                            {task.dueDate && (
                              <p className="text-xs text-gray-400 mt-1">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Due {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus(task._id, 'in_progress')}
                          >
                            Start
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task._id, 'completed')}
                          >
                            Complete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
