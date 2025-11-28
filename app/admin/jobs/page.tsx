'use client'

/**
 * Admin Jobs Dashboard
 * Monitor and manage background job queues
 */

import { useState, useEffect } from 'react'
import { ADMIN_COLORS } from '@/lib/constants/admin-theme'

interface QueueMetrics {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  total: number
}

interface JobDetails {
  id: string
  name: string
  data: any
  progress: number
  attemptsMade: number
  timestamp: number
  processedOn?: number
  finishedOn?: number
  failedReason?: string
}

export default function AdminJobsPage() {
  const [metrics, setMetrics] = useState<QueueMetrics[]>([])
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null)
  const [jobs, setJobs] = useState<JobDetails[]>([])
  const [jobType, setJobType] = useState<'waiting' | 'active' | 'completed' | 'failed'>('active')
  const [loading, setLoading] = useState(true)

  // Fetch queue metrics
  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Fetch jobs when queue or type changes
  useEffect(() => {
    if (selectedQueue) {
      fetchJobs()
    }
  }, [selectedQueue, jobType])

  async function fetchMetrics() {
    try {
      const response = await fetch('/api/admin/jobs/metrics')
      const data = await response.json()
      setMetrics(data.metrics)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      setLoading(false)
    }
  }

  async function fetchJobs() {
    if (!selectedQueue) return

    try {
      const response = await fetch(`/api/admin/jobs/${selectedQueue}?type=${jobType}`)
      const data = await response.json()
      setJobs(data.jobs)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }

  async function pauseQueue(queueName: string) {
    try {
      await fetch(`/api/admin/jobs/${queueName}/pause`, { method: 'POST' })
      fetchMetrics()
    } catch (error) {
      console.error('Failed to pause queue:', error)
    }
  }

  async function resumeQueue(queueName: string) {
    try {
      await fetch(`/api/admin/jobs/${queueName}/resume`, { method: 'POST' })
      fetchMetrics()
    } catch (error) {
      console.error('Failed to resume queue:', error)
    }
  }

  async function drainQueue(queueName: string) {
    if (!confirm(`Are you sure you want to drain all waiting jobs from ${queueName}?`)) {
      return
    }

    try {
      await fetch(`/api/admin/jobs/${queueName}/drain`, { method: 'POST' })
      fetchMetrics()
    } catch (error) {
      console.error('Failed to drain queue:', error)
    }
  }

  async function retryJob(queueName: string, jobId: string) {
    try {
      await fetch(`/api/admin/jobs/${queueName}/${jobId}/retry`, { method: 'POST' })
      fetchJobs()
    } catch (error) {
      console.error('Failed to retry job:', error)
    }
  }

  async function removeJob(queueName: string, jobId: string) {
    try {
      await fetch(`/api/admin/jobs/${queueName}/${jobId}`, { method: 'DELETE' })
      fetchJobs()
    } catch (error) {
      console.error('Failed to remove job:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Background Jobs</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Background Jobs</h1>

        {/* Queue Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {metrics.map((queue) => (
            <div
              key={queue.name}
              className="bg-background-secondary rounded-lg border border-border-gold/20 p-6 cursor-pointer hover:border-border-gold/40 transition"
              onClick={() => setSelectedQueue(queue.name)}
            >
              <h3 className="font-semibold text-lg mb-4 capitalize text-purple-royal">
                {queue.name.replace(/-/g, ' ')}
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Waiting</span>
                  <span className="font-medium text-purple-royal-light">{queue.waiting}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Active</span>
                  <span className="font-medium text-purple-royal">{queue.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Completed</span>
                  <span className="font-medium text-gold-warm">{queue.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Failed</span>
                  <span className="font-medium text-destructive">{queue.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Delayed</span>
                  <span className="font-medium text-text-secondary">{queue.delayed}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    pauseQueue(queue.name)
                  }}
                  className="px-3 py-1 text-sm bg-purple-royal-light/20 text-purple-royal-light rounded hover:bg-purple-royal-light/30 border border-purple-royal-light/30"
                >
                  Pause
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    resumeQueue(queue.name)
                  }}
                  className="px-3 py-1 text-sm bg-gold-warm/20 text-gold-warm rounded hover:bg-gold-warm/30 border border-gold-warm/30"
                >
                  Resume
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    drainQueue(queue.name)
                  }}
                  className="px-3 py-1 text-sm bg-destructive/20 text-destructive rounded hover:bg-destructive/30 border border-destructive/30"
                >
                  Drain
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Job Details */}
        {selectedQueue && (
          <div className="bg-background-secondary rounded-lg border border-border-gold/20 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold capitalize text-purple-royal">
                {selectedQueue.replace(/-/g, ' ')} Jobs
              </h2>
              <button
                onClick={() => setSelectedQueue(null)}
                className="text-text-tertiary hover:text-text-primary"
              >
                ✕ Close
              </button>
            </div>

            {/* Job Type Tabs */}
            <div className="flex gap-2 mb-4">
              {(['waiting', 'active', 'completed', 'failed'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setJobType(type)}
                  className={`px-4 py-2 rounded ${
                    jobType === type
                      ? 'bg-purple-royal text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/70'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <p className="text-gray-500">No {jobType} jobs</p>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{job.name}</h4>
                        <p className="text-sm text-gray-500">ID: {job.id}</p>
                      </div>
                      <div className="flex gap-2">
                        {jobType === 'failed' && (
                          <button
                            onClick={() => retryJob(selectedQueue, job.id)}
                            className="px-3 py-1 text-sm bg-purple-royal/20 text-purple-royal rounded hover:bg-purple-royal/30 border border-purple-royal/30"
                          >
                            Retry
                          </button>
                        )}
                        <button
                          onClick={() => removeJob(selectedQueue, job.id)}
                          className="px-3 py-1 text-sm bg-destructive/20 text-destructive rounded hover:bg-destructive/30 border border-destructive/30"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {job.progress > 0 && (
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-background-tertiary rounded-full h-2">
                          <div
                            className="bg-gold-gradient h-2 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-gray-600">Attempts:</span> {job.attemptsMade}
                      </p>
                      <p>
                        <span className="text-gray-600">Created:</span>{' '}
                        {new Date(job.timestamp).toLocaleString()}
                      </p>
                      {job.processedOn && (
                        <p>
                          <span className="text-gray-600">Processed:</span>{' '}
                          {new Date(job.processedOn).toLocaleString()}
                        </p>
                      )}
                      {job.finishedOn && (
                        <p>
                          <span className="text-gray-600">Finished:</span>{' '}
                          {new Date(job.finishedOn).toLocaleString()}
                        </p>
                      )}
                      {job.failedReason && (
                        <p className="text-red-600">
                          <span className="text-gray-600">Error:</span> {job.failedReason}
                        </p>
                      )}
                    </div>

                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer">
                        Job Data
                      </summary>
                      <pre className="mt-2 p-2 bg-background-tertiary rounded text-xs overflow-auto">
                        {JSON.stringify(job.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
