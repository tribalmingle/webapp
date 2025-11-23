
"use client"

import { useEffect, useRef } from "react"

interface Cluster {
  city: string
  region?: string
  members: number
  lat: number
  lng: number
}

interface TribeMapPreviewProps {
  title: string
  subtitle: string
  clusters: Cluster[]
}

export function TribeMapPreview({ title, subtitle, clusters }: TribeMapPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const rawCanvas = canvasRef.current
    if (!rawCanvas) {
      return
    }
    const context = rawCanvas.getContext("2d")
    if (!context) {
      return
    }
    const canvasEl: HTMLCanvasElement = rawCanvas
    const ctx: CanvasRenderingContext2D = context

    let animationFrame: number

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1
      const { clientWidth } = canvasEl
      const height = Math.round(clientWidth * 0.5)
      canvasEl.width = clientWidth * dpr
      canvasEl.height = height * dpr
      canvasEl.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function project(lat: number, lng: number) {
      const { clientWidth } = canvasEl
      const height = clientWidth * 0.5
      const x = ((lng + 180) / 360) * clientWidth
      const y = ((90 - lat) / 180) * height
      return { x, y }
    }

    function drawBackground() {
      const { clientWidth } = canvasEl
      const height = clientWidth * 0.5
      ctx.clearRect(0, 0, clientWidth, height)
      const gradient = ctx.createLinearGradient(0, 0, clientWidth, height)
      gradient.addColorStop(0, "rgba(103, 64, 180, 0.15)")
      gradient.addColorStop(1, "rgba(255, 246, 230, 0.4)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, clientWidth, height)

      ctx.strokeStyle = "rgba(103, 64, 180, 0.25)"
      ctx.lineWidth = 1
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = ((90 - lat) / 180) * height
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(clientWidth, y)
        ctx.stroke()
      }
    }

    function render(timestamp: number) {
      drawBackground()
      clusters.forEach((cluster) => {
        const { x, y } = project(cluster.lat, cluster.lng)
        const pulse = (Math.sin(timestamp / 600 + cluster.members) + 1) * 0.5
        const radius = 6 + (cluster.members / 7000) * 10
        ctx.beginPath()
        ctx.fillStyle = "rgba(103, 64, 180, 0.8)"
        ctx.strokeStyle = "rgba(103, 64, 180, 0.5)"
        ctx.lineWidth = 2
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, radius + pulse * 6, 0, Math.PI * 2)
        ctx.stroke()
      })

      animationFrame = requestAnimationFrame(render)
    }

    resizeCanvas()
    drawBackground()
    animationFrame = requestAnimationFrame(render)

    const handleResize = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      resizeCanvas()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrame)
    }
  }, [clusters])

  return (
    <section className="rounded-3xl border border-brand-purple/10 bg-white shadow">
      <div className="flex flex-col gap-2 border-b border-brand-purple/10 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand-purple/60">Immersive tribe map</p>
          <h2 className="text-3xl font-semibold text-brand-night">{title}</h2>
          <p className="mt-2 text-sm text-brand-night/70">{subtitle}</p>
        </div>
        <span className="rounded-full bg-brand-purple/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-purple">Preview</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} className="w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40" />
      </div>
      <div className="grid gap-4 border-t border-brand-purple/10 px-8 py-6 sm:grid-cols-3">
        {clusters.slice(0, 3).map((cluster) => (
          <div key={cluster.city} className="rounded-2xl border border-brand-purple/10 bg-brand-sand/30 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-brand-purple/70">{cluster.region ?? ""}</p>
            <p className="mt-1 text-xl font-semibold text-brand-night">{cluster.city}</p>
            <p className="text-sm text-brand-night/70">{cluster.members.toLocaleString()} members</p>
          </div>
        ))}
      </div>
    </section>
  )
}
