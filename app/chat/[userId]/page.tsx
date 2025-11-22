'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeft, Send, Smile, Image as ImageIcon, MoreVertical } from 'lucide-react'
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

export default function ChatConversationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatUser, setChatUser] = useState<ChatUser | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                {chatUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-bold text-white">{chatUser.name}</h2>
              <p className="text-xs text-white/70">{chatUser.age} • {chatUser.city || 'Online'}</p>
            </div>
          </div>
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
                        <p className="text-sm break-words">{message.message}</p>
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
            className="p-3 hover:bg-muted rounded-lg transition flex-shrink-0"
          >
            <Smile className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="flex-1 relative">
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
          </div>

          <Button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-4 py-3 h-12 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </div>
  )
}
