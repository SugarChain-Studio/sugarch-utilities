# @sugarch/bc-event-handler

A package for handling BC chat events using the EventEmitter interface. It provides a robust event system to manage custom events, making it easier to create responsive and interactive mods.

- [@sugarch/bc-event-handler](#sugarchbc-event-handler)
  - [Installation](#installation)
  - [Usage](#usage)
  - [API Reference](#api-reference)
    - [`ChatRoomEvents`](#chatroomevents)
    - [`ChatRoomMessageHandlerEvents`](#chatroommessagehandlerevents)
    - [`OrgasmEvents`](#orgasmevents)
    - [Example: `OrgasmEvents`](#example-orgasmevents)
    - [`ActivityEvents`](#activityevents)
      - [Example: `ActivityEvents`](#example-activityevents)
    - [`ChatRoomRemoteEventEmitter`](#chatroomremoteeventemitter)
      - [Example: Basic Use for`ChatRoomRemoteEventEmitter`](#example-basic-use-forchatroomremoteeventemitter)
      - [Example: Using `EventMap` to Define Event Types for `ChatRoomRemoteEventEmitter`](#example-using-eventmap-to-define-event-types-for-chatroomremoteeventemitter)


## Installation

This package requires the [`@sugarch/bc-mod-hook-manager`](../mod-hook-manager/) package to be installed. Make sure to install it before installing this package.

To install the package, use:

```bash
# Using pnpm
pnpm add @sugarch/bc-event-handler

# Using yarn
yarn add @sugarch/bc-event-handler

# Using npm
npm install @sugarch/bc-event-handler
```

> [!IMPORTANT]
> This package have a peer dependency setting, if you encounter peer dependencies error, please install the required version of packages manually (add suffix `@x.x.x` to the package name in the install command, for example `npm install @sugarch/bc-mod-hook-manager@0.2.12`)

## Usage

Here's a basic example of how to use the `@sugarch/bc-event-handler` package:

```typescript
import { ChatRoomEvents } from '@sugarch/bc-event-handler';
import { HookManager } from '@sugarch/bc-mod-hook-manager';

// Initialize the hook manager, event handler will use it to register events
// All the EventEmitter in this package are using the same hook manager instance, so don't forget to initialize it
HookManager.initWithMod(bcModSdk.registerMod(...));

// Register an event listener
ChatRoomEvents.on('Chat', (message) => {
    console.log('New chat message:', message);
});
```

## API Reference

The `@sugarch/bc-event-handler` package provides several modules to handle various events in Bondage Club. Below is a detailed description of the exported modules and their functionality:

---

### `ChatRoomEvents`

The `ChatRoomEvents` module provides an event emitter for handling chat-related events in the chat room.
The event comes from directly hooked into `ChatRoomMessage` funciton, so no filtering is happened for the event message.

This event emitter supports all events coming from `ChatRoomMessage` function, including : 
- `"Action"`: Triggered when an action is performed in the chat room.
- `"Chat"`: Triggered when a chat message is sent in the chat room.
- `"Whisper"`: Triggered when a whisper message is sent to current player. (note: other players' whisper message is undetectable)
- `"Emote"`: Triggered when an emote message is sent in the chat room.
- `"Activity"`: Triggered when an activity is performed in the chat room.
- `"Hidden"`: Triggered when a hidden message is sent in the chat room.
- `"LocalMessage"`: Triggered when a local message is sent in the chat room. Typically from `ChatRoomSendLocal` function.

Additionally, it also supports following events that related to player joining and leaving the chat room (note that the listener parameters for these events is different with those above): 
- `"PlayerJoin"`: Triggered when a player joins the chat room. When the event is triggered, player should be in the chat room already.
- `"PlayerLeave"`: Triggered when a player leaves the chat room. This event is triggered before the server sends the player out of the chat room, so the player is still in the chat room when the event is triggered.

- **Methods**:
  - `on(event: EventType, listener: (message: T) => void): void`: Registers an event listener for a specific chat event.
  - `once(event: EventType, listener: (message: T) => void): void`: Registers a one-time event listener for a specific chat event.
  - `off(event: EventType, listener: (message: T) => void): void`: Removes an event listener.

---

### `ChatRoomMessageHandlerEvents`

The `ChatRoomEvents` module provides an event emitter for handling chat-related events in the chat room.
Unlike `ChatRoomEvents`, this event comes from the `ChatRoomMessageHandler`, so if the player is sensory deprived, the event will not be triggered.

This event emitter supports all events coming from `ChatRoomMessage` function in typing, but most of them will never be trigger, possible events are: `"Action"`, `"Chat"`, `"Whisper"`, `"Emote"`

- **Methods**:
  - `on(event: EventType, listener: (message: ServerChatRoomMessage) => void): void`: Registers an event listener for a specific chat event.
  - `once(event: EventType, listener: (message: ServerChatRoomMessage) => void): void`: Registers a one-time event listener for a specific chat event.
  - `off(event: EventType, listener: (message: ServerChatRoomMessage) => void): void`: Removes an event listener.

---

### `OrgasmEvents`

The `OrgasmEvents` module provides an event emitter for handling orgasm-related events for the player.

This event emitter supports the following events: 
- `"orgasmed"`: The player successfully orgasmed.
- `"ruined"`: The player's orgasm was ruined.
- `"resisted"`: The player have resisted the orgasm.

- **Methods**:
  - `on(event: EventType, listener: (eventData: { Player: Character }) => void): void`: Registers an event listener for orgasm events.
  - `once(event: EventType, listener: (eventData: { Player: Character }) => void): void`: Registers a one-time event listener for orgasm events.
  - `off(event: EventType, listener: (eventData: { Player: Character }) => void): void`: Removes an event listener.

### Example: `OrgasmEvents`

```typescript 
import { OrgasmEvents } from '@sugarch/bc-event-handler';

// Register an event listener
OrgasmEvents.on('orgasmed', (player) => {
    console.log('Player has orgasmed:', player);
});
```

---

### `ActivityEvents`

The `ActivityEvents` module provides an event emitter for handling activity-related events.

The first parameter for registering event is the mode of the event, which can be one of the following:
- `'SelfOnOthers'`: Triggered when the player is doing an activity on others.
- `'OthersOnSelf'`: Triggered when others are doing an activity on the player.
- `'SelfOnSelf'`: Triggered when the player is doing an activity on themselves.
- `'AnyOnSelf'`: Triggered when any activity is done on the player.
- `'SelfInvolved'`: Triggered when the player is involved in an activity, regardless of whether they are the one doing it or not.

The second parameter is the activity name.

- **Methods**:
  - `on(mode: EventMode, activity: string, listener: (sender: Character, player: PlayerCharacter, info: ActivityInfo) => void): void`: Registers an event listener for activity events.
  - `once(mode: EventMode, activity: string, listener: (sender: Character, player: PlayerCharacter, info: ActivityInfo) => void): void`: Registers a one-time event listener for activity events.
  - `off(mode: EventMode, activity: string, listener: (sender: Character, player: PlayerCharacter, info: ActivityInfo) => void): void`: Removes an event listener.

#### Example: `ActivityEvents`

The `ActivityEvents` module allows you to handle activity-related events in the chat room. You can listen for specific activities and modes, such as when the player performs an activity on others or when others perform an activity on the player.

```typescript
import { ActivityEvents } from '@sugarch/bc-event-handler';

// Register an event listener for when the player performs the "Kiss" activity on others
ActivityEvents.on('SelfOnOthers', 'Kiss', (sender, player, info) => {
    console.log(`${player.Name} performed the Kiss activity on ${info.TargetCharacter}`);
});

// Register an event listener for when others perform the "Kiss" activity on the player
ActivityEvents.on('OthersOnSelf', 'Kiss', (sender, player, info) => {
    console.log(`${sender.Name} performed the Kiss activity on ${player.Name}`);
});

// Register a one-time event listener for when the player performs the "Wiggle" activity on themselves
ActivityEvents.once('SelfOnSelf', 'Wiggle', (sender, player, info) => {
    console.log(`${player.Name} performed the Wiggle activity on themselves.`);
});

// Remove a specific listener
const listener = (sender, player, info) => {
    console.log(`${sender.Name} performed the Cuddle activity on ${player.Name}`);
};
ActivityEvents.on('OthersOnSelf', 'Cuddle', listener);
ActivityEvents.off('OthersOnSelf', 'Cuddle', listener);

// Remove all listeners for a specific activity and mode
ActivityEvents.off('SelfOnOthers', 'Kiss');
```

---

### `ChatRoomRemoteEventEmitter`

The `ChatRoomRemoteEventEmitter` module provides an event emitter for handling custom remote events in the chat room system. Events are identified by a unique prefix to avoid conflicts with built-in or other custom events.

This event emitter supports the following events:

- **Custom Events**: Any event name defined by the mod developer. These events are sent using the `emitAll` or `emit` methods and can carry custom arguments.

- **Methods**:
  - `on(event: string, listener: (info: EventInfo, ...args: any[]) => void): void`: Registers an event listener for a specific custom event.
  - `once(event: string, listener: (info: EventInfo, ...args: any[]) => void): void`: Registers a one-time event listener for a specific custom event.
  - `off(event: string, listener?: (info: EventInfo, ...args: any[]) => void): void`: Removes an event listener.
  - `emitAll(event: string, ...args: any[]): void`: Emits a custom event to all players in the chat room.
  - `emit(target: Character | number, event: string, ...args: any[]): void`: Emits a custom event to a specific player.

#### Example: Basic Use for`ChatRoomRemoteEventEmitter`

```typescript
import { ChatRoomRemoteEventEmitter } from '@sugarch/bc-event-handler';

// Create a new remote event emitter with a unique prefix
const remoteEmitter = new ChatRoomRemoteEventEmitter('MyMod');

// Register an event listener for a custom event
remoteEmitter.on('CustomEvent', (info, arg1, arg2) => {
    console.log(`Event received from ${info.senderCharacter.Name}:`, arg1, arg2);
});

// Emit the event to all players in the chat room
remoteEmitter.emitAll('CustomEvent', 'Hello', 42);

// Emit the event to a specific player
const targetPlayer = ChatRoomCharacter.find(c => c.MemberNumber === 12345);
if (targetPlayer) {
    remoteEmitter.emit(targetPlayer, 'PrivateMessage', 'This is a private message', { secretValue: 54321 });
}
```

#### Example: Using `EventMap` to Define Event Types for `ChatRoomRemoteEventEmitter`

If you are using TypeScript, you can use a `EventMap` type to define the specific events and their argument types for a `ChatRoomRemoteEventEmitter`. This ensures type safety when registering and emitting events.

```typescript
import { ChatRoomRemoteEventEmitter } from '@sugarch/bc-event-handler';

// Define an EventMap for the emitter
type MyEventMap = {
    CustomEvent: [string, number]; // CustomEvent takes a string and a number as arguments
    PrivateMessage: [string, { secretValue: number }]; // PrivateMessage takes a string and an object as arguments
};

// Create a new remote event emitter with a unique prefix and the EventMap
const remoteEmitter = new ChatRoomRemoteEventEmitter<MyEventMap>('MyMod');

// Register an event listener for "CustomEvent"
remoteEmitter.on('CustomEvent', (info, message, value) => {
    console.log(`CustomEvent received from ${info.senderCharacter.Name}:`, message, value);
});

// The following line will cause a TypeScript error for incorrect argument types
remoteEmitter.emitAll('CustomEvent', 'Hello', 'Not a number'); // Error: Argument of type 'string' is not assignable to parameter of type 'number'.
```