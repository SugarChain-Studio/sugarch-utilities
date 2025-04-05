# @sugarch/bc-event-handler

A package for handling BC chat events using the EventEmitter interface. It provides a robust event system to manage custom events, making it easier to create responsive and interactive mods.

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
HookManager.initWithMod(bcModSdk.registerMod(...));

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