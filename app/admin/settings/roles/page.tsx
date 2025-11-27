'use client'

import { useState, useEffect } from 'react'
import { Shield, Users, Edit, Save, X, Plus, Trash2, Search } from 'lucide-react'
import {
  AdminRole,
  Permission,
  ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  PERMISSION_DESCRIPTIONS,
} from '@/lib/auth/roles'

interface UserWithRole {
  _id: string
  email: string
  name: string
  role: AdminRole
  lastActive?: Date
}

interface RoleAssignment {
  userId: string
  oldRole: AdminRole
  newRole: AdminRole
  reason: string
}

export default function RoleManagementPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null)
  const [reason, setReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<AdminRole | 'all'>('all')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/roles/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string) => {
    if (!selectedRole || !reason.trim()) {
      alert('Please select a role and provide a reason')
      return
    }

    const user = users.find(u => u._id === userId)
    if (!user) return

    try {
      const response = await fetch('/api/admin/roles/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newRole: selectedRole,
          reason: reason.trim(),
        }),
      })

      if (response.ok) {
        await loadUsers()
        setEditingUser(null)
        setSelectedRole(null)
        setReason('')
      } else {
        const error = await response.json()
        alert(`Failed to update role: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    }
  }

  const startEditing = (user: UserWithRole) => {
    setEditingUser(user._id)
    setSelectedRole(user.role)
    setReason('')
  }

  const cancelEditing = () => {
    setEditingUser(null)
    setSelectedRole(null)
    setReason('')
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const allRoles: AdminRole[] = ['super_admin', 'admin', 'moderator', 'support', 'analyst', 'viewer']
  const permissionEntries = Object.entries(PERMISSION_CATEGORIES) as Array<[
    string,
    Permission[],
  ]>

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Role Management</h1>
        </div>
        <p className="text-gray-600">
          Manage user roles and permissions. All role changes are audited.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email or name..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as AdminRole | 'all')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              {allRoles.map(role => (
                <option key={role} value={role}>
                  {role.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Role Hierarchy Reference */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Role Hierarchy</h3>
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <span className="font-mono bg-blue-100 px-2 py-1 rounded">SUPER_ADMIN (100)</span>
          <span>→</span>
          <span className="font-mono bg-blue-100 px-2 py-1 rounded">ADMIN (80)</span>
          <span>→</span>
          <span className="font-mono bg-blue-100 px-2 py-1 rounded">MODERATOR (60)</span>
          <span>→</span>
          <span className="font-mono bg-blue-100 px-2 py-1 rounded">SUPPORT (40)</span>
          <span>→</span>
          <span className="font-mono bg-blue-100 px-2 py-1 rounded">ANALYST (20)</span>
          <span>→</span>
          <span className="font-mono bg-blue-100 px-2 py-1 rounded">VIEWER (10)</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user._id ? (
                      <select
                        value={selectedRole || user.role}
                        onChange={(e) => setSelectedRole(e.target.value as AdminRole)}
                        className="px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                      >
                        {allRoles.map(role => (
                          <option key={role} value={role}>
                            {role.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {ROLE_PERMISSIONS[user.role]?.length || 0} permissions
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user._id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason for change..."
                          className="px-3 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateRole(user._id)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(user)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Role
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Permission Reference */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">Permission Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {permissionEntries.map(([category, permissions]) => (
            <div key={category}>
              <h3 className="font-semibold text-gray-900 mb-2 capitalize">
                {category.replace('_', ' ')}
              </h3>
              <ul className="space-y-1 text-sm">
                {permissions.map(permission => (
                  <li key={permission} className="text-gray-600">
                    • {PERMISSION_DESCRIPTIONS[permission] || permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
