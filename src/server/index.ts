import {
  type Connection,
  Server,
  type WSMessage,
  routePartykitRequest,
} from "partyserver";

import type { ChatMessage, Message, CardGameMessage } from "../shared";

export class Chat extends Server<Env> {
  static options = { hibernate: true };

  messages = [] as ChatMessage[];
  gameMessages = [] as CardGameMessage[];
  rooms = new Map<string, Set<string>>(); // roomCode -> Set of playerIds
  playerRooms = new Map<string, string>(); // playerId -> roomCode

  broadcastMessage(message: Message, exclude?: string[]) {
    this.broadcast(JSON.stringify(message), exclude);
  }

  onStart() {
    // this is where you can initialize things that need to be done before the server starts
    // for example, load previous messages from a database or a service

    // create the messages table if it doesn't exist
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, user TEXT, role TEXT, content TEXT)`,
    );

    // create the game messages table if it doesn't exist
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS game_messages (id TEXT PRIMARY KEY, type TEXT, data TEXT, playerId TEXT, timestamp INTEGER, roomCode TEXT)`,
    );

    // load the messages from the database
    this.messages = this.ctx.storage.sql
      .exec(`SELECT * FROM messages`)
      .toArray() as ChatMessage[];

    // load the game messages from the database
    this.gameMessages = this.ctx.storage.sql
      .exec(`SELECT * FROM game_messages`)
      .toArray() as CardGameMessage[];
  }

  onConnect(connection: Connection) {
    connection.send(
      JSON.stringify({
        type: "all",
        messages: this.messages,
      } satisfies Message),
    );
  }

  onClose(connection: Connection) {
    // Handle player disconnection
    const playerId = connection.id;
    const roomCode = this.playerRooms.get(playerId);
    
    if (roomCode) {
      const room = this.rooms.get(roomCode);
      if (room) {
        room.delete(playerId);
        if (room.size === 0) {
          this.rooms.delete(roomCode);
        } else {
          // Notify other players that a player left
          this.broadcastMessage({
            type: "playerLeft",
            playerId,
            roomCode,
          } satisfies Message);
        }
      }
      this.playerRooms.delete(playerId);
    }
  }

  saveMessage(message: ChatMessage) {
    // check if the message already exists
    const existingMessage = this.messages.find((m) => m.id === message.id);
    if (existingMessage) {
      this.messages = this.messages.map((m) => {
        if (m.id === message.id) {
          return message;
        }
        return m;
      });
    } else {
      this.messages.push(message);
    }

    this.ctx.storage.sql.exec(
      `INSERT INTO messages (id, user, role, content) VALUES ('${
        message.id
      }', '${message.user}', '${message.role}', ${JSON.stringify(
        message.content,
      )}) ON CONFLICT (id) DO UPDATE SET content = ${JSON.stringify(
        message.content,
      )}`,
    );
  }

  saveGameMessage(message: CardGameMessage) {
    // check if the message already exists
    const existingMessage = this.gameMessages.find((m) => m.id === message.id);
    if (existingMessage) {
      this.gameMessages = this.gameMessages.map((m) => {
        if (m.id === message.id) {
          return message;
        }
        return m;
      });
    } else {
      this.gameMessages.push(message);
    }

    this.ctx.storage.sql.exec(
      `INSERT INTO game_messages (id, type, data, playerId, timestamp, roomCode) VALUES ('${
        message.id
      }', '${message.type}', '${JSON.stringify(message.data)}', '${message.playerId}', ${message.timestamp}, '${message.roomCode}') ON CONFLICT (id) DO UPDATE SET data = '${JSON.stringify(message.data)}'`,
    );
  }

  onMessage(connection: Connection, message: WSMessage) {
    const parsed = JSON.parse(message as string) as Message;
    
    // Handle different message types
    switch (parsed.type) {
      case "add":
      case "update":
        // Handle chat messages
        this.broadcast(message);
        this.saveMessage(parsed);
        break;
        
      case "createRoom":
        // Handle room creation
        const roomCode = parsed.roomCode;
        const playerId = connection.id;
        
        if (!this.rooms.has(roomCode)) {
          this.rooms.set(roomCode, new Set());
        }
        
        this.rooms.get(roomCode)!.add(playerId);
        this.playerRooms.set(playerId, roomCode);
        
        connection.send(JSON.stringify({
          type: "roomCreated",
          roomCode,
        } satisfies Message));
        break;
        
      case "joinRoom":
        // Handle room joining
        const joinRoomCode = parsed.roomCode;
        const joinPlayerId = connection.id;
        
        if (this.rooms.has(joinRoomCode)) {
          this.rooms.get(joinRoomCode)!.add(joinPlayerId);
          this.playerRooms.set(joinPlayerId, joinRoomCode);
          
          connection.send(JSON.stringify({
            type: "roomJoined",
            roomCode: joinRoomCode,
          } satisfies Message));
          
          // Notify other players in the room
          this.broadcastMessage({
            type: "playerJoined",
            playerId: joinPlayerId,
            roomCode: joinRoomCode,
          } satisfies Message, [joinPlayerId]);
        } else {
          connection.send(JSON.stringify({
            type: "error",
            message: "Room not found",
          } satisfies Message));
        }
        break;
        
      case "gameMessage":
        // Handle game messages
        const gameMessage = parsed.data as CardGameMessage;
        this.saveGameMessage(gameMessage);
        
        // Broadcast to all players in the same room
        const targetRoom = this.playerRooms.get(connection.id);
        if (targetRoom) {
          const roomPlayers = this.rooms.get(targetRoom);
          if (roomPlayers) {
            // Send to all players in the room except the sender
            this.broadcastMessage({
              type: "gameMessage",
              data: gameMessage,
            } satisfies Message, [connection.id]);
          }
        }
        break;
        
      default:
        // Default behavior: broadcast to everyone
        this.broadcast(message);
        break;
    }
  }
}

export default {
  async fetch(request, env) {
    return (
      (await routePartykitRequest(request, { ...env })) ||
      env.ASSETS.fetch(request)
    );
  },
} satisfies ExportedHandler<Env>;
