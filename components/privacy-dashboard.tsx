/**
 * Privacy Dashboard Component
 * GDPR-compliant privacy controls for users
 */

'use client'

import { useState } from 'react'
import { Download, Trash2, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react'

export interface PrivacySettings {
  profileVisibility: 'public' | 'members_only' | 'private'
  showOnlineStatus: boolean
  showLastSeen: boolean
  allowMessagesFrom: 'everyone' | 'matches_only' | 'none'
  dataSharing: {
    analytics: boolean
    marketing: boolean
    thirdParty: boolean
  }
}

interface PrivacyDashboardProps {
  userId: string
  settings: PrivacySettings
  onUpdateSettings: (settings: PrivacySettings) => Promise<void>
  onRequestDataExport: () => Promise<void>
  onRequestAccountDeletion: () => Promise<void>
}

export function PrivacyDashboard({
  userId,
  settings: initialSettings,
  onUpdateSettings,
  onRequestDataExport,
  onRequestAccountDeletion,
}: PrivacyDashboardProps) {
  const [settings, setSettings] = useState<PrivacySettings>(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      await onUpdateSettings(settings)
      alert('Privacy settings updated successfully')
    } catch (error) {
      alert('Failed to update settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    setIsLoading(true)
    try {
      await onRequestDataExport()
      alert('Data export requested. You will receive an email with a download link within 24 hours.')
    } catch (error) {
      alert('Failed to request data export. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    try {
      await onRequestAccountDeletion()
      alert('Account deletion requested. Your account will be deleted in 30 days. You can cancel this request within the grace period.')
    } catch (error) {
      alert('Failed to request account deletion. Please try again.')
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Privacy & Data</h1>
        <p className="text-gray-600">
          Manage your privacy settings and control your data
        </p>
      </div>

      {/* Profile Visibility */}
      <section className="bg-background-secondary rounded-lg border border-border-gold/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="text-purple-royal" size={24} />
          <h2 className="text-xl font-semibold text-purple-royal">Profile Visibility</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Who can see your profile?
            </label>
            <select
              value={settings.profileVisibility}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profileVisibility: e.target.value as PrivacySettings['profileVisibility'],
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="public">Everyone</option>
              <option value="members_only">Members Only</option>
              <option value="private">Private (Hidden from discovery)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-sm">Show online status</label>
              <p className="text-xs text-gray-500">
                Let others see when you're online
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showOnlineStatus}
              onChange={(e) =>
                setSettings({ ...settings, showOnlineStatus: e.target.checked })
              }
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-sm">Show last seen</label>
              <p className="text-xs text-gray-500">
                Display when you were last active
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showLastSeen}
              onChange={(e) =>
                setSettings({ ...settings, showLastSeen: e.target.checked })
              }
              className="w-5 h-5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Who can message you?
            </label>
            <select
              value={settings.allowMessagesFrom}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  allowMessagesFrom: e.target.value as PrivacySettings['allowMessagesFrom'],
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="everyone">Everyone</option>
              <option value="matches_only">Matches Only</option>
              <option value="none">No One</option>
            </select>
          </div>
        </div>
      </section>

      {/* Data Sharing */}
      <section className="bg-background-secondary rounded-lg border border-border-gold/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-purple-royal" size={24} />
          <h2 className="text-xl font-semibold text-purple-royal">Data Sharing</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-sm">Analytics</label>
              <p className="text-xs text-gray-500">
                Help us improve by sharing usage data
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.dataSharing.analytics}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dataSharing: { ...settings.dataSharing, analytics: e.target.checked },
                })
              }
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-sm">Marketing communications</label>
              <p className="text-xs text-gray-500">
                Receive personalized recommendations and offers
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.dataSharing.marketing}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dataSharing: { ...settings.dataSharing, marketing: e.target.checked },
                })
              }
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-sm">Third-party services</label>
              <p className="text-xs text-gray-500">
                Share data with trusted partners for enhanced features
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.dataSharing.thirdParty}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dataSharing: { ...settings.dataSharing, thirdParty: e.target.checked },
                })
              }
              className="w-5 h-5"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="mt-6 w-full px-6 py-3 bg-purple-royal text-white rounded-lg hover:bg-purple-royal-dark transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </section>

      {/* Data Export */}
      <section className="bg-background-secondary rounded-lg border border-border-gold/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="text-purple-royal" size={24} />
          <h2 className="text-xl font-semibold text-purple-royal">Download Your Data</h2>
        </div>

        <p className="text-text-secondary mb-4">
          Request a copy of all your personal data stored on TribalMingle.
          You'll receive an email with a download link within 24 hours.
        </p>

        <button
          onClick={handleExportData}
          disabled={isLoading}
          className="px-6 py-3 border border-purple-royal/30 text-purple-royal rounded-lg hover:bg-purple-royal/10 transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? 'Requesting...' : 'Request Data Export'}
        </button>
      </section>

      {/* Account Deletion */}
      <section className="bg-background-secondary rounded-lg border border-destructive/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="text-destructive" size={24} />
          <h2 className="text-xl font-semibold text-destructive">Delete Account</h2>
        </div>

        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-900 text-sm mb-1">
                This action cannot be undone
              </p>
              <p className="text-red-800 text-sm">
                Deleting your account will permanently remove all your data, including:
              </p>
              <ul className="list-disc list-inside text-red-800 text-sm mt-2 space-y-1">
                <li>Profile information and photos</li>
                <li>Messages and conversations</li>
                <li>Matches and connections</li>
                <li>Activity history</li>
              </ul>
              <p className="text-red-800 text-sm mt-2">
                You have 30 days to cancel this request before permanent deletion.
              </p>
            </div>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Delete My Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="font-medium text-sm">
              Are you absolutely sure? This will schedule your account for permanent deletion.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
