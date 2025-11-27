# Translation API Integration Guide

## Overview
TribalMingle supports real-time message translation using Google Translate and DeepL APIs, enabling cross-cultural connections.

## Supported Providers

### 1. Google Cloud Translation API
- **Pros**: Wide language support (100+), affordable, fast
- **Cons**: Lower quality for some language pairs
- **Cost**: $20 per 1M characters

### 2. DeepL API
- **Pros**: Superior quality, natural translations
- **Cons**: Limited languages (29), more expensive
- **Cost**: $25 per 1M characters (Free tier: 500k chars/month)

## Setup

### Google Cloud Translation

1. **Create GCP Project**
   - Go to [https://console.cloud.google.com](https://console.cloud.google.com)
   - Create new project
   - Enable Cloud Translation API

2. **Create Service Account**
   ```bash
   gcloud iam service-accounts create tribalmingle-translate
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:tribalmingle-translate@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/cloudtranslate.user"
   gcloud iam service-accounts keys create key.json \
     --iam-account=tribalmingle-translate@PROJECT_ID.iam.gserviceaccount.com
   ```

3. **Environment Variables**
   ```env
   GOOGLE_TRANSLATE_API_KEY=your_api_key
   # OR for service account:
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
   ```

### DeepL API

1. **Create DeepL Account**
   - Go to [https://www.deepl.com/pro-api](https://www.deepl.com/pro-api)
   - Sign up for API access
   - Get API key from account dashboard

2. **Environment Variables**
   ```env
   DEEPL_API_KEY=your_api_key
   DEEPL_API_ENDPOINT=https://api-free.deepl.com  # or https://api.deepl.com for paid
   ```

## Usage

### Translate Text
```typescript
import { translateText } from '@/lib/vendors/translation-client'

const result = await translateText({
  text: 'Hello, how are you?',
  targetLanguage: 'es',
  sourceLanguage: 'en', // Optional, auto-detect if omitted
  provider: 'google', // or 'deepl'
})

if (result.success) {
  console.log('Translated:', result.translatedText)
  console.log('Detected language:', result.detectedLanguage)
}
```

### Batch Translation
```typescript
import { translateBatch } from '@/lib/vendors/translation-client'

const texts = [
  'Hello',
  'How are you?',
  'Nice to meet you',
]

const results = await translateBatch({
  texts,
  targetLanguage: 'fr',
  provider: 'deepl',
})

results.forEach((result, index) => {
  if (result.success) {
    console.log(`${texts[index]} → ${result.translatedText}`)
  }
})
```

### Detect Language
```typescript
import { detectLanguage } from '@/lib/vendors/translation-client'

const result = await detectLanguage('Bonjour tout le monde')

if (result.success) {
  console.log('Language:', result.language) // 'fr'
  console.log('Confidence:', result.confidence) // 0.99
}
```

### Get Supported Languages
```typescript
import { getSupportedLanguages } from '@/lib/vendors/translation-client'

const result = await getSupportedLanguages('google')

if (result.success) {
  result.languages.forEach(lang => {
    console.log(`${lang.code}: ${lang.name}`)
  })
}
```

### Estimate Cost
```typescript
import { estimateTranslationCost } from '@/lib/vendors/translation-client'

const text = 'Hello, this is a sample message to translate.'
const cost = estimateTranslationCost(text, 'google')

console.log(`Estimated cost: $${cost.toFixed(6)}`)
// Output: Estimated cost: $0.000009
```

## Supported Languages

### Google Translate (100+ languages)
Includes all major languages plus:
- Regional variants (pt-BR vs pt-PT)
- Historical languages (Latin, Sanskrit)
- Constructed languages (Esperanto)

### DeepL (29 languages)
High-quality support for:
- English (US, UK)
- German, French, Spanish, Italian, Portuguese (BR, PT)
- Dutch, Polish, Russian
- Japanese, Chinese (simplified)
- And 18 more

Full list: [https://www.deepl.com/docs-api/translating-text/](https://www.deepl.com/docs-api/translating-text/)

## Caching Strategy

Implement caching to reduce costs:

```typescript
import { Redis } from 'ioredis'

const redis = new Redis()

async function getCachedTranslation(
  text: string,
  targetLang: string,
  provider: string
): Promise<string | null> {
  const cacheKey = `translate:${provider}:${targetLang}:${hashString(text)}`
  return await redis.get(cacheKey)
}

async function setCachedTranslation(
  text: string,
  targetLang: string,
  provider: string,
  translation: string
) {
  const cacheKey = `translate:${provider}:${targetLang}:${hashString(text)}`
  await redis.setex(cacheKey, 86400 * 30, translation) // Cache for 30 days
}
```

Cache hit rate of 70%+ can reduce costs by ~70%.

## Quality Comparison

### When to Use Google Translate
- High volume, cost-sensitive
- Rare language pairs
- Simple/informal content
- Real-time chat messages

### When to Use DeepL
- Marketing content
- Important messages
- European languages
- Quality > cost

### Hybrid Strategy
```typescript
async function translateMessage(text: string, targetLang: string) {
  // Use DeepL for European languages if available
  const deeplLanguages = ['de', 'fr', 'es', 'it', 'nl', 'pl', 'pt', 'ru']
  
  if (deeplLanguages.includes(targetLang)) {
    return await translateText({ text, targetLanguage: targetLang, provider: 'deepl' })
  }
  
  // Fallback to Google for other languages
  return await translateText({ text, targetLanguage: targetLang, provider: 'google' })
}
```

## Rate Limits

### Google Translate
- **Free tier**: None (pay-as-you-go)
- **Rate limit**: 100 requests/second
- **Character limit**: 30,000 chars per request

### DeepL
- **Free tier**: 500,000 chars/month
- **Rate limit**: Varies by plan
- **Character limit**: 50,000 chars per request

## Error Handling

```typescript
try {
  const result = await translateText({
    text: userMessage,
    targetLanguage: 'es',
    provider: 'deepl',
  })
  
  if (!result.success) {
    // Fallback to Google Translate
    const fallback = await translateText({
      text: userMessage,
      targetLanguage: 'es',
      provider: 'google',
    })
    
    return fallback.translatedText
  }
  
  return result.translatedText
} catch (error) {
  console.error('Translation failed:', error)
  // Return original text as last resort
  return userMessage
}
```

## Cost Optimization

### 1. Cache Aggressively
- Cache common phrases indefinitely
- Cache user messages for 30 days
- Use Redis or CDN edge caching

### 2. Batch Requests
```typescript
// Instead of translating each message individually:
// ❌ 10 API calls
for (const msg of messages) {
  await translateText({ text: msg, targetLanguage: 'es' })
}

// ✅ 1 API call
await translateBatch({ texts: messages, targetLanguage: 'es' })
```

### 3. Detect Before Translating
```typescript
const detected = await detectLanguage(text)

// Don't translate if already in target language
if (detected.language === targetLanguage) {
  return text
}
```

### 4. User Preferences
```typescript
// Only translate if recipient has translation enabled
const recipient = await getUser(recipientId)

if (recipient.preferences.autoTranslate !== true) {
  return text // Don't translate
}
```

### 5. Minimum Length
```typescript
// Skip translation for very short messages
if (text.length < 5) {
  return text
}
```

## Monitoring

Track translation metrics:

```typescript
import { AnalyticsService } from '@/lib/services/analytics-service'

await AnalyticsService.track({
  eventType: 'translation.requested',
  properties: {
    provider: 'deepl',
    sourceLang: 'en',
    targetLang: 'es',
    charCount: text.length,
    cached: false,
    duration: Date.now() - startTime,
  },
})
```

Monitor:
- **Translation volume**: Chars/day by provider
- **Cache hit rate**: % of cached translations
- **Cost**: Daily/monthly spending
- **Quality**: User feedback on translations
- **Performance**: Latency (p50, p95, p99)

## User Experience

### In-App Translation UI
```typescript
// Message component
<div className="message">
  <p>{message.text}</p>
  
  {message.text !== translatedText && (
    <div className="translation">
      <p className="translated-text">{translatedText}</p>
      <span className="translation-badge">
        Translated from {detectedLanguage}
      </span>
      <button onClick={showOriginal}>Show original</button>
    </div>
  )}
</div>
```

### Settings
Allow users to control translation:
- ✅ Auto-translate all messages
- ✅ Preferred translation language
- ✅ Show original with translation
- ✅ Never translate specific languages

## Testing

### Unit Tests
```typescript
describe('Translation Service', () => {
  it('should translate text', async () => {
    const result = await translateText({
      text: 'Hello',
      targetLanguage: 'es',
      provider: 'google',
    })
    
    expect(result.success).toBe(true)
    expect(result.translatedText).toBe('Hola')
  })
  
  it('should detect language', async () => {
    const result = await detectLanguage('Bonjour')
    
    expect(result.language).toBe('fr')
    expect(result.confidence).toBeGreaterThan(0.9)
  })
})
```

### Integration Tests
Test with real APIs using test keys/sandbox environments.

## Security

- **API Keys**: Store in environment variables, never commit
- **Rate Limiting**: Prevent abuse with rate limits per user
- **Input Validation**: Sanitize text before translation
- **PII**: Be cautious with sensitive content
- **Audit Logging**: Track all translations for compliance

## Compliance

- **GDPR**: Translations may be processed outside EU
- **Data Retention**: Check provider data policies
- **Terms of Service**: Review allowed use cases

## Support

### Google Cloud Translation
- **Docs**: [https://cloud.google.com/translate/docs](https://cloud.google.com/translate/docs)
- **Support**: GCP support plans
- **Status**: [https://status.cloud.google.com](https://status.cloud.google.com)

### DeepL
- **Docs**: [https://www.deepl.com/docs-api](https://www.deepl.com/docs-api)
- **Support**: support@deepl.com
- **Status**: [https://status.deepl.com](https://status.deepl.com)
