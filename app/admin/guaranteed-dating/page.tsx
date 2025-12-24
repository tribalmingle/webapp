'use client'

import { useState, useEffect } from 'react'
import { Heart, Clock, MapPin, Calendar, CheckCircle, XCircle, RefreshCw, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GuaranteedDatingRequest {
  _id: string
  userEmail: string
  userName: string
  userGender: string
  userAge: number
  userCity: string
  userCountry: string
  userTribe: string
  userProfilePhoto: string
  loveLanguages: string[]
  idealDateActivities: string[]
  dealBreakers: string[]
  communicationStyle: string
  conflictResolutionStyle: string
  familyPlans: string
  religiousPracticeLevel: string
  datingGoals: string
  idealFirstDate: string
  mustHaveQualities: string[]
  additionalNotes: string
  paymentAmount: number
  status: 'pending' | 'matched' | 'completed' | 'expired' | 'refund_requested' | 'refunded'
  requestDate: string
  expiryDate: string
  matchedUserEmail?: string
  matchedUserName?: string
  venue?: string
  venueAddress?: string
  dateTime?: string
  matchedAt?: string
  refundRequested: boolean
  refundRequestedAt?: string
}

export default function GuaranteedDatingAdmin() {
  const [requests, setRequests] = useState<GuaranteedDatingRequest[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<GuaranteedDatingRequest | null>(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchingRequest1, setMatchingRequest1] = useState<GuaranteedDatingRequest | null>(null)
  const [matchingRequest2, setMatchingRequest2] = useState<GuaranteedDatingRequest | null>(null)
  const [matchDetails, setMatchDetails] = useState({
    venue: '',
    venueAddress: '',
    dateTime: '',
  })
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCity, setFilterCity] = useState<string>('all')
  const [filterTribe, setFilterTribe] = useState<string>('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadRequests()
  }, [filterStatus, filterCity, filterTribe])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus)
      if (filterCity && filterCity !== 'all') params.set('city', filterCity)
      if (filterTribe && filterTribe !== 'all') params.set('tribe', filterTribe)
      
      const response = await fetch(`/api/admin/guaranteed-dating/requests?${params.toString()}`, {
        credentials: 'include',
      })
      const data = await response.json()
      
      if (data.success) {
        setRequests(data.requests)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
      setMessage({ type: 'error', text: 'Failed to load requests' })
    } finally {
      setLoading(false)
    }
  }

  const selectForMatching = (request: GuaranteedDatingRequest) => {
    if (!matchingRequest1) {
      setMatchingRequest1(request)
      setMessage({ type: 'success', text: `Selected ${request.userName} as first person. Now select a match.` })
    } else if (matchingRequest1._id === request._id) {
      setMatchingRequest1(null)
      setMessage({ type: 'success', text: 'Unselected' })
    } else {
      setMatchingRequest2(request)
      setShowMatchModal(true)
    }
  }

  const submitMatch = async () => {
    if (!matchingRequest1 || !matchingRequest2 || !matchDetails.venue || !matchDetails.venueAddress || !matchDetails.dateTime) {
      setMessage({ type: 'error', text: 'Please fill all match details' })
      return
    }

    try {
      const response = await fetch('/api/admin/guaranteed-dating/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          request1Id: matchingRequest1._id,
          request2Id: matchingRequest2._id,
          ...matchDetails,
        }),
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to match users')
      }

      setMessage({ type: 'success', text: `Successfully matched ${matchingRequest1.userName} and ${matchingRequest2.userName}!` })
      setShowMatchModal(false)
      setMatchingRequest1(null)
      setMatchingRequest2(null)
      setMatchDetails({ venue: '', venueAddress: '', dateTime: '' })
      loadRequests()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const uniqueCities = Array.from(new Set(requests.map(r => r.userCity))).sort()
  const uniqueTribes = Array.from(new Set(requests.map(r => r.userTribe))).sort()

  const daysRemaining = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Guaranteed Dating Management</h1>
        <p className="text-muted-foreground">Match users and manage dating requests</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">Matched</p>
            <p className="text-2xl font-bold text-green-800">{stats.matched}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">Completed</p>
            <p className="text-2xl font-bold text-blue-800">{stats.completed}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-800">Expired</p>
            <p className="text-2xl font-bold text-gray-800">{stats.expired}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">Refund Req</p>
            <p className="text-2xl font-bold text-orange-800">{stats.refundRequested}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">Refunded</p>
            <p className="text-2xl font-bold text-red-800">{stats.refunded}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="matched">Matched</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
              <option value="refund_requested">Refund Requested</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">City</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Tribe</label>
            <select
              value={filterTribe}
              onChange={(e) => setFilterTribe(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            >
              <option value="all">All Tribes</option>
              {uniqueTribes.map(tribe => (
                <option key={tribe} value={tribe}>{tribe}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={loadRequests} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Matching UI */}
      {matchingRequest1 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="font-medium text-purple-900">
            <Heart className="w-4 h-4 inline mr-2" />
            Selected for matching: {matchingRequest1.userName} ({matchingRequest1.userGender}, {matchingRequest1.userAge}, {matchingRequest1.userCity})
          </p>
          <p className="text-sm text-purple-700 mt-1">Now select another person of opposite gender from same city/tribe to create a match</p>
          <Button onClick={() => setMatchingRequest1(null)} variant="outline" size="sm" className="mt-2">
            Cancel Selection
          </Button>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
          <p className="mt-4 text-lg font-medium">No requests found</p>
          <p className="text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div 
              key={request._id} 
              className={`bg-card border rounded-lg p-6 ${matchingRequest1?._id === request._id ? 'ring-2 ring-purple-500' : ''}`}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* User Info */}
                <div className="flex-shrink-0">
                  {request.userProfilePhoto ? (
                    <img src={request.userProfilePhoto} alt={request.userName} className="w-24 h-24 rounded-lg object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                      {request.userName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{request.userName}</h3>
                      <p className="text-muted-foreground">
                        {request.userGender} · {request.userAge} years old · {request.userTribe}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.userCity}, {request.userCountry}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'matched' ? 'bg-green-100 text-green-800' :
                        request.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        request.status === 'refund_requested' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {request.status === 'pending' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {daysRemaining(request.expiryDate)} days left
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1">Love Languages</p>
                      <p className="text-muted-foreground">{request.loveLanguages.join(', ')}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Dating Goals</p>
                      <p className="text-muted-foreground">{request.datingGoals}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Ideal Activities</p>
                      <p className="text-muted-foreground">{request.idealDateActivities.slice(0, 3).join(', ')}{request.idealDateActivities.length > 3 ? '...' : ''}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Must-Have Qualities</p>
                      <p className="text-muted-foreground">{request.mustHaveQualities.slice(0, 3).join(', ')}{request.mustHaveQualities.length > 3 ? '...' : ''}</p>
                    </div>
                  </div>

                  {request.status === 'matched' && request.matchedUserName && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-900">Matched with {request.matchedUserName}</p>
                      <p className="text-sm text-green-800 mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {request.venue}, {request.venueAddress}
                      </p>
                      <p className="text-sm text-green-800">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {request.dateTime && new Date(request.dateTime).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button 
                      onClick={() => setSelectedRequest(request)}
                      variant="outline"
                      size="sm"
                    >
                      View Full Details
                    </Button>
                    {request.status === 'pending' && (
                      <Button
                        onClick={() => selectForMatching(request)}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        {matchingRequest1?._id === request._id ? 'Unselect' : 'Select for Matching'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match Modal */}
      {showMatchModal && matchingRequest1 && matchingRequest2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Create Match</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="font-medium">{matchingRequest1.userName}</p>
                <p className="text-sm text-muted-foreground">{matchingRequest1.userGender}, {matchingRequest1.userAge}</p>
              </div>
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <p className="font-medium">{matchingRequest2.userName}</p>
                <p className="text-sm text-muted-foreground">{matchingRequest2.userGender}, {matchingRequest2.userAge}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Venue Name *</label>
                <input
                  type="text"
                  value={matchDetails.venue}
                  onChange={(e) => setMatchDetails(prev => ({ ...prev, venue: e.target.value }))}
                  className="w-full p-2 border rounded-lg bg-background"
                  placeholder="e.g., The Terrace Restaurant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Venue Address *</label>
                <input
                  type="text"
                  value={matchDetails.venueAddress}
                  onChange={(e) => setMatchDetails(prev => ({ ...prev, venueAddress: e.target.value }))}
                  className="w-full p-2 border rounded-lg bg-background"
                  placeholder="Full address with street, city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={matchDetails.dateTime}
                  onChange={(e) => setMatchDetails(prev => ({ ...prev, dateTime: e.target.value }))}
                  className="w-full p-2 border rounded-lg bg-background"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowMatchModal(false)
                  setMatchingRequest2(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitMatch}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Create Match & Notify Users
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold">Full Request Details</h3>
              <Button onClick={() => setSelectedRequest(null)} variant="ghost" size="sm">
                ×
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold mb-2">User Information</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedRequest.userName}</div>
                  <div><span className="font-medium">Email:</span> {selectedRequest.userEmail}</div>
                  <div><span className="font-medium">Gender:</span> {selectedRequest.userGender}</div>
                  <div><span className="font-medium">Age:</span> {selectedRequest.userAge}</div>
                  <div><span className="font-medium">City:</span> {selectedRequest.userCity}</div>
                  <div><span className="font-medium">Tribe:</span> {selectedRequest.userTribe}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">Preferences</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Love Languages:</span>
                    <p className="text-muted-foreground">{selectedRequest.loveLanguages.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Dating Goals:</span>
                    <p className="text-muted-foreground">{selectedRequest.datingGoals}</p>
                  </div>
                  <div>
                    <span className="font-medium">Ideal Date Activities:</span>
                    <p className="text-muted-foreground">{selectedRequest.idealDateActivities.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Communication Style:</span>
                    <p className="text-muted-foreground">{selectedRequest.communicationStyle}</p>
                  </div>
                  <div>
                    <span className="font-medium">Conflict Resolution:</span>
                    <p className="text-muted-foreground">{selectedRequest.conflictResolutionStyle}</p>
                  </div>
                  <div>
                    <span className="font-medium">Family Plans:</span>
                    <p className="text-muted-foreground">{selectedRequest.familyPlans}</p>
                  </div>
                  <div>
                    <span className="font-medium">Religious Practice:</span>
                    <p className="text-muted-foreground">{selectedRequest.religiousPracticeLevel}</p>
                  </div>
                  <div>
                    <span className="font-medium">Deal Breakers:</span>
                    <p className="text-muted-foreground">{selectedRequest.dealBreakers.join(', ') || 'None specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Must-Have Qualities:</span>
                    <p className="text-muted-foreground">{selectedRequest.mustHaveQualities.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Ideal First Date:</span>
                    <p className="text-muted-foreground">{selectedRequest.idealFirstDate}</p>
                  </div>
                  {selectedRequest.additionalNotes && (
                    <div>
                      <span className="font-medium">Additional Notes:</span>
                      <p className="text-muted-foreground">{selectedRequest.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">Request Status</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Status:</span> {selectedRequest.status}</div>
                  <div><span className="font-medium">Payment:</span> ${selectedRequest.paymentAmount}</div>
                  <div><span className="font-medium">Request Date:</span> {new Date(selectedRequest.requestDate).toLocaleDateString()}</div>
                  <div><span className="font-medium">Expiry Date:</span> {new Date(selectedRequest.expiryDate).toLocaleDateString()}</div>
                  {selectedRequest.matchedUserName && (
                    <>
                      <div><span className="font-medium">Matched With:</span> {selectedRequest.matchedUserName}</div>
                      <div><span className="font-medium">Venue:</span> {selectedRequest.venue}</div>
                      <div className="md:col-span-2"><span className="font-medium">Address:</span> {selectedRequest.venueAddress}</div>
                      <div><span className="font-medium">Date/Time:</span> {selectedRequest.dateTime && new Date(selectedRequest.dateTime).toLocaleString()}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
