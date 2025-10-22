# Card Game WebSocket Server

This is the WebSocket server for the multiplayer card game, built with Cloudflare Workers and Durable Objects.

## Features

- Real-time WebSocket communication
- Room-based multiplayer with 6-character codes
- Game state persistence
- Player management
- Message broadcasting

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Deploy to Cloudflare Workers

```bash
npx wrangler deploy
```

### 3. Get Your Server URL

After deployment, you'll get a URL like:
`https://your-worker-name.your-subdomain.workers.dev`

### 4. Update the Card Game

In the card game's `scripts/websocket-multiplayer.js` file, update the WebSocket URL:

```javascript
// Replace this line with your deployed server URL
host = 'your-worker-name.your-subdomain.workers.dev';
```

## Development

### Local Development

```bash
npx wrangler dev
```

This will start a local development server on `localhost:1999`.

### Testing

You can test the WebSocket server by connecting to:
- Local: `ws://localhost:1999/chat/ROOM_CODE`
- Production: `wss://your-worker-name.your-subdomain.workers.dev/chat/ROOM_CODE`

## API

The server handles the following message types:

- `createRoom`: Create a new game room
- `joinRoom`: Join an existing game room
- `gameMessage`: Broadcast game events to room players
- `playerJoined`: Notify when a player joins
- `playerLeft`: Notify when a player leaves

## Game Events

The server supports all card game events:
- Card movements
- Card flips
- Card shuffles
- Deck shuffles
- Card deals
- Game resets
- Private hand updates
- Card visibility changes
