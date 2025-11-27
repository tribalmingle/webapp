/**
 * Translation API Integration
 * Supports Google Translate and DeepL
 */

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || ''
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || ''
const TRANSLATION_PROVIDER = process.env.TRANSLATION_PROVIDER || 'google' // 'google' or 'deepl'

export interface TranslationResult {
  translatedText: string
  detectedSourceLanguage?: string
  provider: 'google' | 'deepl'
}

/**
 * Translate text using Google Translate API
 */
async function translateWithGoogle(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> {
  const url = 'https://translation.googleapis.com/language/translate/v2'

  const params = new URLSearchParams({
    key: GOOGLE_TRANSLATE_API_KEY,
    q: text,
    target: targetLanguage,
    ...(sourceLanguage && { source: sourceLanguage }),
  })

  const response = await fetch(`${url}?${params}`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[translation] Google Translate failed', { error })
    throw new Error(`Google Translate failed: ${error}`)
  }

  const data = await response.json()
  const translation = data.data.translations[0]

  return {
    translatedText: translation.translatedText,
    detectedSourceLanguage: translation.detectedSourceLanguage,
    provider: 'google',
  }
}

/**
 * Translate text using DeepL API
 */
async function translateWithDeepL(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> {
  const url = 'https://api-free.deepl.com/v2/translate'

  const body = new URLSearchParams({
    auth_key: DEEPL_API_KEY,
    text,
    target_lang: targetLanguage.toUpperCase(),
    ...(sourceLanguage && { source_lang: sourceLanguage.toUpperCase() }),
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[translation] DeepL failed', { error })
    throw new Error(`DeepL translation failed: ${error}`)
  }

  const data = await response.json()
  const translation = data.translations[0]

  return {
    translatedText: translation.text,
    detectedSourceLanguage: translation.detected_source_language?.toLowerCase(),
    provider: 'deepl',
  }
}

/**
 * Translate text (auto-selects provider)
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> {
  try {
    if (TRANSLATION_PROVIDER === 'deepl' && DEEPL_API_KEY) {
      return await translateWithDeepL(text, targetLanguage, sourceLanguage)
    } else if (GOOGLE_TRANSLATE_API_KEY) {
      return await translateWithGoogle(text, targetLanguage, sourceLanguage)
    } else {
      throw new Error('No translation API configured')
    }
  } catch (error) {
    console.error('[translation] Translation failed', { error, text, targetLanguage })
    throw error
  }
}

/**
 * Batch translate multiple texts
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult[]> {
  // Google Translate supports batch requests
  if (TRANSLATION_PROVIDER === 'google' && GOOGLE_TRANSLATE_API_KEY) {
    const url = 'https://translation.googleapis.com/language/translate/v2'

    const params = new URLSearchParams({
      key: GOOGLE_TRANSLATE_API_KEY,
      target: targetLanguage,
      ...(sourceLanguage && { source: sourceLanguage }),
    })

    // Add multiple 'q' parameters
    texts.forEach((text) => params.append('q', text))

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[translation] Google Translate batch failed', { error })
      throw new Error(`Google Translate batch failed: ${error}`)
    }

    const data = await response.json()

    return data.data.translations.map((translation: any) => ({
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage,
      provider: 'google' as const,
    }))
  } else {
    // DeepL doesn't support batch, so translate sequentially
    const results: TranslationResult[] = []

    for (const text of texts) {
      const result = await translateText(text, targetLanguage, sourceLanguage)
      results.push(result)

      // Small delay to avoid rate limits
      if (results.length < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return results
  }
}

/**
 * Detect language of text
 */
export async function detectLanguage(text: string): Promise<string> {
  if (GOOGLE_TRANSLATE_API_KEY) {
    const url = 'https://translation.googleapis.com/language/translate/v2/detect'

    const params = new URLSearchParams({
      key: GOOGLE_TRANSLATE_API_KEY,
      q: text,
    })

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[translation] Language detection failed', { error })
      throw new Error(`Language detection failed: ${error}`)
    }

    const data = await response.json()
    return data.data.detections[0][0].language
  } else {
    throw new Error('Language detection requires Google Translate API')
  }
}

/**
 * Get supported languages
 */
export async function getSupportedLanguages(): Promise<string[]> {
  if (GOOGLE_TRANSLATE_API_KEY) {
    const url = 'https://translation.googleapis.com/language/translate/v2/languages'

    const params = new URLSearchParams({
      key: GOOGLE_TRANSLATE_API_KEY,
    })

    const response = await fetch(`${url}?${params}`)

    if (!response.ok) {
      const error = await response.text()
      console.error('[translation] Failed to get supported languages', { error })
      throw new Error(`Failed to get supported languages: ${error}`)
    }

    const data = await response.json()
    return data.data.languages.map((lang: any) => lang.language)
  } else {
    // DeepL supported languages (subset)
    return [
      'bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fi', 'fr',
      'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv', 'nb', 'nl', 'pl',
      'pt', 'ro', 'ru', 'sk', 'sl', 'sv', 'tr', 'uk', 'zh',
    ]
  }
}

/**
 * Estimate translation cost (characters)
 */
export function estimateTranslationCost(text: string): number {
  const charCount = text.length

  if (TRANSLATION_PROVIDER === 'deepl') {
    // DeepL pricing: ~$20 per 1M characters
    return (charCount / 1000000) * 20
  } else {
    // Google Translate pricing: ~$20 per 1M characters
    return (charCount / 1000000) * 20
  }
}
