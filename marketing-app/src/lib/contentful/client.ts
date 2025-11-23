import { createClient } from "contentful"

const spaceId = process.env.CONTENTFUL_SPACE_ID
const accessToken = process.env.CONTENTFUL_CDA_TOKEN
const environment = process.env.CONTENTFUL_ENVIRONMENT ?? "master"

const credentialsConfigured = Boolean(spaceId && accessToken)

// Minimal typed client surface for marketing `getEntries<T>` usage in this repo
type ContentfulClient = {
  getEntries: <T = any>(opts: any) => Promise<{ items: T[] }>
}

let cachedClient: ContentfulClient | null = null

if (process.env.NODE_ENV === "development" && !credentialsConfigured) {
  console.warn("[marketing-app] Contentful credentials are missing. Add them to .env.local to enable CMS content.")
}

function createContentfulClient() {
  if (!spaceId || !accessToken) {
    throw new Error("Contentful credentials not configured")
  }
  return createClient({ space: spaceId, accessToken, environment }) as unknown as ContentfulClient
}

export function getContentfulClient() {
  if (!cachedClient) {
    cachedClient = createContentfulClient()
  }
  return cachedClient
}

export function getOptionalContentfulClient() {
  if (!credentialsConfigured) {
    return null
  }
  return getContentfulClient()
}

export function isContentfulEnabled() {
  return credentialsConfigured
}
