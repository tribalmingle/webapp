"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FeatureCollection } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'

import type { TribeMeta } from '@/lib/marketing/tribes'
import { trackClientEvent } from '@/lib/analytics/client'
import { TribeCard } from '@/components/marketing/tribe-card'

export type MapSectionCopy = {
  title: string
  description: string
  cta: string
  fallbackTitle: string
  fallbackDescription: string
}

type TribeMapProps = {
  regions: FeatureCollection
  tribes: TribeMeta[]
  locale: string
  copy: MapSectionCopy
}

type InteractionType = 'hover' | 'click' | 'list'

export function TribeMap({ regions, tribes, locale, copy }: TribeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const hoverFilterRef = useRef<string | null>(null)
  const trackedInteractionsRef = useRef(new Set<string>())
  const [selectedId, setSelectedId] = useState<string | null>(tribes[0]?.id ?? null)
  const [isPointerCoarse, setIsPointerCoarse] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(false)

  const selectedTribe = useMemo(() => tribes.find((tribe) => tribe.id === selectedId) ?? tribes[0], [selectedId, tribes])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const query = window.matchMedia('(pointer: coarse)')
    const updatePointer = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsPointerCoarse(Boolean(event.matches))
    }
    updatePointer(query)
    query.addEventListener?.('change', updatePointer as EventListener)

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    setHasWebGL(Boolean(gl))

    return () => {
      query.removeEventListener?.('change', updatePointer as EventListener)
    }
  }, [])

  const emitAnalytics = useCallback((tribeId: string, interactionType: InteractionType) => {
    const key = `${interactionType}-${tribeId}`
    if (interactionType === 'hover' && trackedInteractionsRef.current.has(key)) {
      return
    }
    trackedInteractionsRef.current.add(key)
    trackClientEvent('tribe_map_interaction', {
      tribeId,
      interactionType,
      locale,
    })
  }, [locale])

  useEffect(() => {
    if (!hasWebGL || isPointerCoarse) {
      return
    }
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    let isMounted = true

    const initMap = async () => {
      const maplibregl = (await import('maplibre-gl')).default
      if (!isMounted || !mapContainerRef.current) {
        return
      }

      const mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [17.0, 4.0],
        zoom: 2.2,
        attributionControl: false,
      })

      mapRef.current = mapInstance

      mapInstance.on('load', () => {
        if (!mapInstance.getSource('tribes')) {
          mapInstance.addSource('tribes', {
            type: 'geojson',
            data: regions,
          })
        }

        mapInstance.addLayer({
          id: 'tribe-fill',
          type: 'fill',
          source: 'tribes',
          paint: {
            'fill-color': ['coalesce', ['get', 'color'], '#a855f7'],
            'fill-opacity': 0.32,
          },
        })

        mapInstance.addLayer({
          id: 'tribe-outline',
          type: 'line',
          source: 'tribes',
          paint: {
            'line-color': '#7c3aed',
            'line-width': 1.2,
          },
        })

        mapInstance.addLayer({
          id: 'tribe-outline-active',
          type: 'line',
          source: 'tribes',
          paint: {
            'line-color': '#f97316',
            'line-width': 3,
          },
          filter: ['==', ['get', 'id'], selectedId ?? ''],
        })

        mapInstance.addLayer({
          id: 'tribe-outline-hover',
          type: 'line',
          source: 'tribes',
          paint: {
            'line-color': '#22d3ee',
            'line-width': 2,
            'line-opacity': 0.8,
          },
          filter: ['==', ['get', 'id'], ''],
        })

        mapInstance.on('mousemove', 'tribe-fill', (event: any) => {
          if (!event.features?.length) {
            mapInstance.getCanvas().style.cursor = ''
            return
          }
          mapInstance.getCanvas().style.cursor = 'pointer'
          const tribeId = event.features[0].properties?.id as string
          if (tribeId && hoverFilterRef.current !== tribeId) {
            hoverFilterRef.current = tribeId
            mapInstance.setFilter('tribe-outline-hover', ['==', ['get', 'id'], tribeId])
            emitAnalytics(tribeId, 'hover')
          }
        })

        mapInstance.on('mouseleave', 'tribe-fill', () => {
          mapInstance.getCanvas().style.cursor = ''
          hoverFilterRef.current = null
          mapInstance.setFilter('tribe-outline-hover', ['==', ['get', 'id'], ''])
        })

        mapInstance.on('click', 'tribe-fill', (event: any) => {
          if (!event.features?.length) {
            return
          }
          const tribeId = event.features[0].properties?.id as string
          if (tribeId) {
            setSelectedId(tribeId)
            emitAnalytics(tribeId, 'click')
          }
        })
      })
    }

    initMap()

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [emitAnalytics, hasWebGL, isPointerCoarse, regions])

  useEffect(() => {
    if (!mapRef.current || !selectedId) {
      return
    }
    if (mapRef.current.getLayer('tribe-outline-active')) {
      mapRef.current.setFilter('tribe-outline-active', ['==', ['get', 'id'], selectedId])
    }
  }, [selectedId])

  const handleListSelect = useCallback((tribeId: string) => {
    setSelectedId(tribeId)
    emitAnalytics(tribeId, 'list')
  }, [emitAnalytics])

  const shouldRenderMap = hasWebGL && !isPointerCoarse

  return (
    <div className="grid gap-8 lg:grid-cols-[360px,1fr]">
      <div className="space-y-6">
        {selectedTribe ? <TribeCard tribe={selectedTribe} active ctaLabel={copy.cta} /> : null}
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
          {tribes.map((tribe) => (
            <button
              key={tribe.id}
              type="button"
              onClick={() => handleListSelect(tribe.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                selectedId === tribe.id ? 'border-accent bg-accent/10 text-accent-foreground' : 'border-purple-100 hover:border-accent/50'
              }`}
              aria-pressed={selectedId === tribe.id}
            >
              <div className="flex items-center justify-between">
                <span>{tribe.name}</span>
                <span className="text-xs text-muted-foreground">{tribe.stats.population}</span>
              </div>
              <p className="text-xs text-muted-foreground">{tribe.stats.homeBase}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-purple-100 bg-white/40 p-4 shadow-inner">
        {shouldRenderMap ? (
          <div
            ref={mapContainerRef}
            className="h-[480px] w-full overflow-hidden rounded-2xl"
            aria-label="Interactive tribal regions map"
          />
        ) : (
          <div className="flex h-[480px] flex-col items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-linear-to-br from-purple-50 to-blue-50 p-6 text-center">
            <p className="text-lg font-semibold text-foreground">{copy.fallbackTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">{copy.fallbackDescription}</p>
            <div className="mt-6 grid w-full gap-3 text-left md:grid-cols-2">
              {tribes.slice(0, 6).map((tribe) => (
                <div key={tribe.id} className="rounded-xl border border-purple-100 bg-white/70 p-4">
                  <p className="text-sm font-semibold text-foreground">{tribe.name}</p>
                  <p className="text-xs text-muted-foreground">{tribe.headline}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

