# LiveKit Integration Guide

## Overview
LiveKit provides real-time video and audio communication for TribalMingle, enabling video dates, voice calls, and live events.

## Setup

### 1. Create LiveKit Cloud Account
1. Go to [https://livekit.io](https://livekit.io)
2. Sign up for LiveKit Cloud (or self-host)
3. Create a new project

### 2. Get Credentials
From the LiveKit dashboard:
- **API Key**: Used for server-side operations
- **API Secret**: Used to sign tokens
- **WebSocket URL**: Connection endpoint for clients

### 3. Environment Variables
Add these to your `.env.local`:

```env
LIVEKIT_API_KEY=APIxxxxxxxxxxxxx
LIVEKIT_API_SECRET=your_secret_key
LIVEKIT_WS_URL=wss://your-project.livekit.cloud
```

### 4. Configure Webhooks
Set up webhook URL in LiveKit dashboard:
- **Webhook URL**: `https://yourdomain.com/api/webhooks/livekit`
- **Events**: Enable room_started, room_finished, participant_joined, participant_left

## Usage

### Create a Room
```typescript
import { createRoom } from '@/lib/vendors/livekit-client'

const result = await createRoom({
  roomName: 'video-date-user123-user456',
  maxParticipants: 2,
  emptyTimeout: 300, // Auto-close after 5 min if empty
})

if (result.success) {
  console.log('Room created:', result.roomName)
}
```

### Generate Access Token
```typescript
import { generateAccessToken } from '@/lib/vendors/livekit-client'

const result = await generateAccessToken({
  roomName: 'video-date-user123-user456',
  participantName: 'user123',
  participantMetadata: JSON.stringify({
    userId: 'user123',
    displayName: 'John Doe',
  }),
  permissions: {
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  },
})

if (result.success) {
  // Send token to client
  return result.token
}
```

### List Active Rooms
```typescript
import { listRooms } from '@/lib/vendors/livekit-client'

const result = await listRooms()

if (result.success) {
  console.log('Active rooms:', result.rooms)
  // rooms = [{ name, sid, numParticipants, creationTime }]
}
```

### End a Room
```typescript
import { endRoom } from '@/lib/vendors/livekit-client'

const result = await endRoom('video-date-user123-user456')

if (result.success) {
  console.log('Room ended')
}
```

### Get Room Info
```typescript
import { getRoomInfo } from '@/lib/vendors/livekit-client'

const result = await getRoomInfo('video-date-user123-user456')

if (result.success) {
  console.log('Participants:', result.participants)
  console.log('Duration:', result.duration)
}
```

## Client-Side Integration

### Install LiveKit Client SDK
```bash
pnpm add livekit-client
```

### Connect to Room (React)
```typescript
import { Room, RoomEvent } from 'livekit-client'

async function connectToRoom(token: string) {
  const room = new Room()

  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    // Handle remote participant track
    if (track.kind === 'video') {
      const videoElement = document.getElementById('remote-video')
      track.attach(videoElement)
    }
  })

  await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!, token)

  // Publish local tracks
  await room.localParticipant.enableCameraAndMicrophone()
}
```

## Webhook Events

LiveKit sends webhook events to `/api/webhooks/livekit`:

- **room_started**: Room created and first participant joined
- **room_finished**: All participants left
- **participant_joined**: User joined room
- **participant_left**: User left room
- **recording_finished**: Recording completed (if enabled)

## Recording

### Enable Recording
```typescript
import { startRoomRecording } from '@/lib/vendors/livekit-client'

await startRoomRecording({
  roomName: 'video-date-user123-user456',
  output: {
    s3: {
      bucket: 'tribalmingle-recordings',
      region: 'us-east-1',
    },
  },
})
```

Recordings are automatically uploaded to S3 when complete.

## Cost Estimation

LiveKit Cloud pricing (as of 2024):
- **Free Tier**: 10,000 participant minutes/month
- **Paid**: $0.005 per participant minute
- **Egress (Recording)**: $0.10 per GB

Example: 1000 video calls/month × 10 min average × 2 participants = 20,000 minutes = $100/month

For self-hosted, see [LiveKit Deployment Guide](https://docs.livekit.io/deploy/).

## Testing

### Local Development
For local testing, use a tunneling service (ngrok) or LiveKit Cloud's test environment:

```bash
# Use ngrok for webhooks
ngrok http 3000
```

Then update webhook URL to your ngrok URL.

### Test Token
Generate a test token:
```typescript
const token = await generateAccessToken({
  roomName: 'test-room',
  participantName: 'test-user',
})
```

Use [LiveKit's test tool](https://meet.livekit.io) to verify connectivity.

## Monitoring

Monitor LiveKit usage:
- **Dashboard**: Real-time room stats
- **Webhook Logs**: Event history
- **Analytics**: Usage trends, quality metrics
- **Alerts**: Set up for high usage or errors

## Troubleshooting

### Cannot Connect to Room
1. Verify WebSocket URL is correct
2. Check token is valid (not expired)
3. Ensure network allows WebSocket connections
4. Check firewall/proxy settings

### Poor Video Quality
1. Check network bandwidth
2. Adjust video resolution/bitrate
3. Enable simulcast for better adaptation
4. Check CPU usage on client

### Webhook Not Receiving Events
1. Verify webhook URL is publicly accessible
2. Check webhook signature validation
3. Review webhook logs in LiveKit dashboard
4. Ensure HTTPS is used (required for production)

## Security

- **Token Expiry**: Set short expiration (1 hour recommended)
- **Room Permissions**: Limit who can publish/subscribe
- **End-to-End Encryption**: Enable E2EE for sensitive calls
- **Webhook Signature**: Always validate webhook signatures
- **Access Control**: Verify user permissions before generating tokens

## Advanced Features

### Screen Sharing
```typescript
await room.localParticipant.setScreenShareEnabled(true)
```

### Data Channels
```typescript
// Send custom data to participants
const encoder = new TextEncoder()
const data = encoder.encode(JSON.stringify({ type: 'emoji', value: '❤️' }))
await room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE)
```

### Simulcast
Automatically enabled for better quality adaptation:
```typescript
await room.localParticipant.setCameraEnabled(true, {
  simulcast: true, // Enable simulcast
})
```

### Noise Cancellation
```typescript
const track = await createLocalAudioTrack({
  noiseCancellation: true,
  echoCancellation: true,
})
```

## Support

- **Documentation**: [https://docs.livekit.io](https://docs.livekit.io)
- **Community**: [https://livekit.io/community](https://livekit.io/community)
- **GitHub**: [https://github.com/livekit/livekit](https://github.com/livekit/livekit)
