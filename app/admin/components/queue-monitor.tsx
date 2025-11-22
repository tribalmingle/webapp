"use client"

import { useEffect, useState } from 'react'
import { Activity, WifiOff } from 'lucide-react'

interface QueueMetric {
  name: string
  depth: number
  lastEventAt: string
}

const FALLBACK_QUEUES: QueueMetric[] = [
  { name: 'trust-liveness', depth: 0, lastEventAt: new Date().toISOString() },
  { name: 'guardian-invites', depth: 0, lastEventAt: new Date().toISOString() },
]

export function QueueMonitorCard() {
  const [connected, setConnected] = useState(false)
  const [queues, setQueues] = useState<QueueMetric[]>(FALLBACK_QUEUES)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_QUEUE_SOCKET_URL
    if (!socketUrl) {
      return
    }

    const socket = new WebSocket(socketUrl)

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { queues?: QueueMetric[] }
        if (payload.queues?.length) {
          setQueues(payload.queues)
        }
      } catch (error) {
        console.warn('Queue monitor payload error', error)
      }
    }

    return () => socket.close()
  }, [])

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Queue Monitor</p>
          <p className="text-base font-semibold text-gray-900">Socket.IO pipeline</p>
        </div>
        {connected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Activity className="h-3.5 w-3.5" /> Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
            <WifiOff className="h-3.5 w-3.5" /> Standby
          </span>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {queues.map((queue) => (
          <div key={queue.name} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{queue.name}</p>
              <p className="text-xs text-gray-500">Last event · {new Date(queue.lastEventAt).toLocaleTimeString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">{queue.depth}</p>
              <p className="text-xs text-gray-500">messages</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
