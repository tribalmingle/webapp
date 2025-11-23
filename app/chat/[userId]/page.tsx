'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeft, Send, Smile, Image as ImageIcon, MoreVertical, Mic } from 'lucide-react'
import { translate } from '@/lib/services/translation-service'
import { Button } from '@/components/ui/button'

interface Message {
  _id: string
  senderId: string
  receiverId: string
  message: string
  createdAt: string
}

interface ChatUser {
  email: string
  name: string
  profilePhoto?: string
  age: number
  city?: string
}
// Voice note: MediaRecorder types
type RecorderState = 'inactive' | 'recording' | 'stopped';

export default function ChatConversationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatUser, setChatUser] = useState<ChatUser | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  // Voice note state
  const [isRecording, setIsRecording] = useState(false)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  // Translation toggle and result
  const [showTranslation, setShowTranslation] = useState(false)
  const [translated, setTranslated] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
      // Translation handler (mock)
      const handleTranslate = async () => {
        setTranslating(true)
        setTranslated(null)
        try {
          const result = await translate(newMessage, { to: 'es' })
          setTranslated(result)
        } finally {
          setTranslating(false)
        }
      }
    // Voice note: start/stop recording handlers
    const handleStartRecording = async () => {
      setRecordingError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new window.MediaRecorder(stream)
        const chunks: BlobPart[] = []
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data)
        }
        mediaRecorder.onstop = () => {
          setAudioBlob(new Blob(chunks, { type: 'audio/webm' }))
          stream.getTracks().forEach((track) => track.stop())
        }
        setRecorder(mediaRecorder)
        mediaRecorder.start()
        setIsRecording(true)
      } catch (err) {
        setRecordingError('Could not access microphone.')
      }
    }

    const handleStopRecording = () => {
      if (recorder && isRecording) {
        recorder.stop()
        setIsRecording(false)
      }
    }
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatUserId = params.userId as string

  const emojis = ['😊', '😂', '❤️', '👍', '🙏', '😍', '🔥', '✨', '🎉', '💯', '👏', '🤔', '😎', '💪', '🌟', '💕']

  useEffect(() => {
    if (user && chatUserId) {
      fetchChatUser()
      fetchMessages()
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [user, chatUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChatUser = async () => {
    try {
      const response = await fetch(`/api/users/${chatUserId}`)
      const data = await response.json()
      if (data.success) {
        setChatUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching chat user:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${chatUserId}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || loading) return

    setLoading(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: chatUserId,
          message: newMessage.trim()
        })
      })

      const data = await response.json()
      if (data.success) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  if (!user || !chatUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-purple-900 border-b border-purple-800 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-purple-800 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            {chatUser.profilePhoto ? (
              <img src={chatUser.profilePhoto} alt={chatUser.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                {chatUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-bold text-white">{chatUser.name}</h2>
              <p className="text-xs text-white/70">{chatUser.age} • {chatUser.city || 'Online'}</p>
            </div>
          </div>
          {/* LiveKit CTA placeholder */}
          <button
            className="p-2 hover:bg-green-700 rounded-lg transition mr-2"
            title="Start video call (coming soon)"
            onClick={() => alert('LiveKit video coming soon!')}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 19h8a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </button>
          <button className="p-2 hover:bg-purple-800 rounded-lg transition">
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center justify-center my-6">
                <div className="px-4 py-1 bg-muted rounded-full text-xs text-muted-foreground font-medium">
                  {date}
                </div>
              </div>

              {/* Messages for this date */}
              {msgs.map((message) => {
                const isOwnMessage = message.senderId === user.email
                return (
                  <div
                    key={message._id}
                    className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwnMessage && chatUser.profilePhoto && (
                      <img
                        src={chatUser.profilePhoto}
                        alt={chatUser.name}
                        className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
                      />
                    )}
                    <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-accent text-accent-foreground rounded-br-none'
                            : 'bg-card border border-border rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm wrap-break-word">{message.message}</p>
                      </div>
                      <p className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-card border border-border rounded-lg p-4 shadow-lg z-50">
          <div className="grid grid-cols-8 gap-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl hover:bg-muted rounded p-2 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 hover:bg-muted rounded-lg transition shrink-0"
          >
            <Smile className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Voice Note Button */}
          <button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`p-3 rounded-lg transition shrink-0 ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'hover:bg-muted'}`}
            aria-label={isRecording ? 'Stop recording' : 'Record voice note'}
          >
            <Mic className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            {/* Translation toggle */}
            <button
              type="button"
              className="absolute right-2 top-2 text-xs text-accent underline z-10"
              style={{ fontSize: '0.8rem' }}
              onClick={() => setShowTranslation((v) => !v)}
            >
              {showTranslation ? 'Hide translation' : 'Translate'}
            </button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none max-h-32"
              style={{ minHeight: '48px' }}
            />
            {/* Translation result (scaffold) */}
            {showTranslation && (
              <div className="mt-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  disabled={translating || !newMessage.trim()}
                  onClick={handleTranslate}
                >
                  {translating ? 'Translating...' : 'Translate to Spanish'}
                </button>
                {translated && (
                  <div className="text-xs text-accent mt-1">{translated}</div>
                )}
              </div>
            )}
            {/* Voice note preview (scaffold) */}
            {audioBlob && (
              <div className="mt-2 flex items-center gap-2">
                <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
                {/* Placeholder: In future, add send/upload logic */}
              </div>
            )}
            {recordingError && (
              <div className="text-xs text-red-500 mt-1">{recordingError}</div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-4 py-3 h-12 shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </div>
  )
}
