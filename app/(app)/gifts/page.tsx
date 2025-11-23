import React from 'react'
import { giftCatalog } from '../../../lib/config/gift-catalog'

async function fetchGifts() {
  return giftCatalog
}

export default async function GiftsPage() {
  const gifts = await fetchGifts()
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Send a Gift</h1>
      <p className="text-sm text-neutral-500">Use coins to send themed cultural gifts. More premium tiers coming soon.</p>
      <div className="grid md:grid-cols-3 gap-4">
        {gifts.map(g => (
          <div key={g.id} className="border rounded p-4 flex flex-col gap-2">
            <div className="text-3xl">{g.emoji}</div>
            <div className="font-medium">{g.name}</div>
            <div className="text-xs text-neutral-500">{g.coinCost} coins · {g.category}</div>
            <form action="/api/gifts/send" method="post" className="flex flex-col gap-2">
              <input type="hidden" name="giftId" value={g.id} />
              <input name="recipientUserId" placeholder="Recipient user id" className="border px-2 py-1 text-sm rounded" />
              <button className="bg-indigo-600 text-white text-sm py-1 rounded hover:bg-indigo-500" type="submit">Send</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
