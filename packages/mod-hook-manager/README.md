# @sugarchain/bc-mod-manager

A package that wraps the bcModSdk to provide a more flexible hook mechanism. It simplifies the creation and management of mods by offering a loose coupling of hooks and utilities.

## Installation

To install the package, use pnpm:

```bash
pnpm add @sugarchain/bc-mod-manager --save-dev
```

## Usage

### `hookFunction`
The `hookFunction` method allows you to register hooks that can be executed before the mod initialization. This is useful for setting up necessary hooks early in the mod lifecycle.

```typescript
import { HookManager } from '@sugarchain/bc-mod-manager';

// Register a hook function
HookManager.hookFunction('SomeFunction', 1, (args, next) => {
  console.log('Hook before SomeFunction');
  next(args);
});

const bcmod = bcModSdk.registerMod(...);

// initialize the mod after registering the hook, then the hook will be executed
HookManager.initWithMod(bcmod);
```

### `afterInit`

The `afterInit` method lets you add callbacks that will be executed after the mod has been initialized. Which means all the hooks registered before `initWithMod` will be executed before the callback.

If the mod is already initialized, the callback will be executed immediately.

```typescript
import { HookManager } from '@sugarchain/bc-mod-manager';

// Add a callback to be executed after initialization
HookManager.afterInit(() => {
  console.log('Mod has been initialized');
});
```

### `afterPlayerLogin`

The `afterPlayerLogin` method allows you to add callbacks that will be executed after the player logs in. If the player is already logged in, the callback will be executed immediately.

```typescript
import { HookManager } from '@sugarchain/bc-mod-manager';

// Add a callback to be executed after player login
HookManager.afterPlayerLogin(() => {
  console.log('Player has logged in');
});
```

### `progressiveHook`

The `progressiveHook` method allows you to assemble hooks in a chain-like manner. This allows for more complex and flexible hook management by combining multiple hook functions into a single progressive hook.

```typescript
import { HookManager } from '@sugarchain/bc-mod-manager';

// Create a progressive hook
const hook = HookManager.progressiveHook('SomeFunction');

// Add steps to the progressive hook
hook
  .inject((args, next) => {
    console.log('Inject step');
  })
  .override((args, next) => {
    console.log('Override step');
    return next(args);
  });
```
