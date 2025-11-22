type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RestClientOptions {
  baseUrl?: string
  defaultHeaders?: Record<string, string>
}

export function adminRestClient(options: RestClientOptions = {}) {
  const baseUrl = options.baseUrl ?? ''
  const defaultHeaders = {
    'x-admin-rbac': 'true',
    ...(options.defaultHeaders ?? {}),
  }

  async function request<T>(path: string, method: HttpMethod, body?: any): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Admin REST request failed: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  return {
    get: <T>(path: string) => request<T>(path, 'GET'),
    post: <T>(path: string, body: any) => request<T>(path, 'POST', body),
  }
}

export function adminGraphQLClient(endpoint = '/api/admin/graphql-proxy') {
  return async function execute<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    })

    const payload = await response.json()
    if (!response.ok || payload.errors) {
      throw new Error(payload.errors?.[0]?.message ?? 'GraphQL request failed')
    }

    return payload.data as T
  }
}
