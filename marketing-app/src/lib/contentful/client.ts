import { createClient } from "contentful"

const spaceId = process.env.CONTENTFUL_SPACE_ID
const accessToken = process.env.CONTENTFUL_CDA_TOKEN
const environment = process.env.CONTENTFUL_ENVIRONMENT ?? "master"

const credentialsConfigured = Boolean(spaceId && accessToken)
type ContentfulClient = ReturnType<typeof createClient>
let cachedClient: ContentfulClient | null = null

if (process.env.NODE_ENV === "development" && !credentialsConfigured) {
  console.warn("[marketing-app] Contentful credentials are missing. Add them to .env.local to enable CMS content.")
}

function createContentfulClient() {
  if (!spaceId || !accessToken) {
    throw new Error("Contentful credentials not configured")
  }
  return createClient({ space: spaceId, accessToken, environment })
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
