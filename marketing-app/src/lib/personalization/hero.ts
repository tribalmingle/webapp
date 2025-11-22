import type { Locale } from "@/lib/i18n/config"

export type HeroVariantKey = "default" | "referral" | "geo"

export function resolveHeroVariant({ locale, referral }: { locale: Locale; referral?: string | null }): HeroVariantKey {
  if (referral) {
    return "referral"
  }
  if (locale !== "en") {
    return "geo"
  }
  return "default"
}
