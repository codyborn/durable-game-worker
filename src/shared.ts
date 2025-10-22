export type ChatMessage = {
  id: string;
  content: string;
  user: string;
  role: "user" | "assistant";
};

export type CardGameMessage = {
  id: string;
  type: string;
  data: any;
  playerId: string;
  timestamp: number;
  roomCode: string;
};

export type Message =
  | {
      type: "add";
      id: string;
      content: string;
      user: string;
      role: "user" | "assistant";
    }
  | {
      type: "update";
      id: string;
      content: string;
      user: string;
      role: "user" | "assistant";
    }
  | {
      type: "all";
      messages: ChatMessage[];
    }
  | {
      type: "gameMessage";
      data: CardGameMessage;
    }
  | {
      type: "createRoom";
      roomCode: string;
    }
  | {
      type: "joinRoom";
      roomCode: string;
    }
  | {
      type: "roomCreated";
      roomCode: string;
    }
  | {
      type: "roomJoined";
      roomCode: string;
    }
  | {
      type: "playerJoined";
      playerId: string;
      roomCode: string;
    }
  | {
      type: "playerLeft";
      playerId: string;
      roomCode: string;
    }
  | {
      type: "error";
      message: string;
    };

export const names = [
  "Alice",
  "Bob",
  "Charlie",
  "David",
  "Eve",
  "Frank",
  "Grace",
  "Heidi",
  "Ivan",
  "Judy",
  "Kevin",
  "Linda",
  "Mallory",
  "Nancy",
  "Oscar",
  "Peggy",
  "Quentin",
  "Randy",
  "Steve",
  "Trent",
  "Ursula",
  "Victor",
  "Walter",
  "Xavier",
  "Yvonne",
  "Zoe",
];
