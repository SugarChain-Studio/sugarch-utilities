# @sugarch/bc-mod-utility

A collection of utilities designed to simplify and enhance the development of mods for Bondage Club (BC). This package provides reusable tools and helpers to streamline common tasks in modding.

## Features

- **Messager**: A utility for sending custom messages.
- **Globals**: A class for managing global variables and ensuring that certain functions are executed only once.

## Installation

Install the package using your preferred package manager:

```bash
# Using pnpm
pnpm add @sugarch/bc-mod-utility --save-dev

# Using yarn
yarn add @sugarch/bc-mod-utility --dev

# Using npm
npm install @sugarch/bc-mod-utility --save-dev
```

## Usage

### Messager

The `Messager` class is the main utility provided by this package. It allows you to send various types of messages in the chat room.

```typescript
import { Messager } from '@sugarch/bc-mod-utility';

// Create a new Messager instance
const messager = new Messager();

// Send a custom action message
messager.action('This is a custom action message.');

// Send a chat message
messager.chat('Hello, everyone!');

// Send a local action message (only visible locally)
messager.localAction('This is a local action message.');

// Send a whisper to a specific player
messager.whisper(12345, 'This is a private message.');

// Send a beep notification to a specific player
messager.beep(12345, 'You have a new notification!');
```

### `Globals` and `once`

The `Globals` class provides a way to manage global variables and ensure that certain functions are only executed once.

```typescript
import { Globals, once } from '@sugarch/bc-mod-utility';

// Create a new Globals instance, or retrieve an existing one
// the first parameter is the name of the global variable, should be unique.
const globals = Globals.get("MyGlobalName", () => {
    // This function will only be executed once if the global variable 
    // is not already set
    return new MyGlobalObject();
});

// Like the `get` method, but allows for modifying the existing global 
// variable
const globals2 = Globals.getMayOverride("MyGlobalName2", (old) => {
    // if the global variable does not exist, the parameter `old` will 
    // be `undefined`.
    // Here we can create a new instance of `MyGlobalObject2`
    if(!old) return new MyGlobalObject2();

    // Here, the `old` parameter is the existing global variable
    // We can modify it as needed
    old.registerSomeData();
    return old;
});

// The `once` method allows you to register a function that will only 
// be executed once, even if called multiple times or imported 
// multiple times.
// The first parameter is a unique flag name, and the second parameter
// is the function to be executed.
once("MyOnceFlagName", () => {
    // This function will only be executed once, even if called multiple
    // times, or the script imports multiple times
    // It is useful for initializing global variables or performing setup
    // tasks
    console.log('This will only run once!');
});
```

