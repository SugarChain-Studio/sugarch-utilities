# @sugarch/bc-event-handler

A package for handling BC chat events using the EventEmitter interface. It provides a robust event system to manage custom events, making it easier to create responsive and interactive mods.

## Installation

This package requires the `@sugarch/bc-mod-hook-manager` package to be installed. Make sure to install it before installing this package.

To install the package, use:

```bash
npm add @sugarch/bc-event-handler --save-dev
```

## Usage

Here's a basic example of how to use the `@sugarch/bc-event-handler` package:

```typescript
import { ChatRoomEvents } from '@sugarch/bc-event-handler';

// Register an event listener
ChatRoomEvents.on('Chat', (message) => {
    console.log('New chat message:', message);
});

// Register a one-time event listener
ChatRoomEvents.once('Action', (message) => {
    console.log('New chat message:', message);
});
```

There is also a event handler for orgasm from the player:

```typescript 
import { OrgasmEvents } from '@sugarch/bc-event-handler';

// Register an event listener
OrgasmEvents.on('Orgasm', (player) => {
    console.log('Player has orgasmed:', player);
});
```