# @sugarch/bc-mod-hook-manager

A package that wraps the bcModSdk to provide a more flexible hook mechanism. It simplifies the creation and management of mods by offering a loose coupling of hooks and utilities.

## Installation

To install the package, use:

```bash
# Using pnpm
pnpm add @sugarch/bc-mod-hook-manager

# Using yarn
yarn add @sugarch/bc-mod-hook-manager

# Using npm
npm install @sugarch/bc-mod-hook-manager
```

## Usage

### Initialize

To initialize the hook manager, you need to provide the mod information. You can either pass the mod information directly or use the registered mod from the bcModSdk.

```typescript
import { HookManager } from '@sugarch/bc-mod-hook-manager';

// Initialize the hook manager with a mod information
HookManager.init({
  name: 'MyMod',
  fullName: 'My Mod',
  version: '1.0.0',
  repository: 'https://github.com/username/repo',
});
```

```typescript
import { HookManager } from '@sugarch/bc-mod-hook-manager';

const mod = bcModSdk.registerMod({
  name: 'MyMod',
  fullName: 'My Mod',
  version: '1.0.0',
  repository: 'https://github.com/username/repo',
});

// Initialize the hook manager with a registered mod
HookManager.initWithMod(mod);
```

### `hookFunction`
The `hookFunction` method allows you to register hooks, and can be executed before the mod initialization. This is useful for setting up necessary hooks early in the mod lifecycle.

```typescript
import { HookManager } from '@sugarch/bc-mod-hook-manager';

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
import { HookManager } from '@sugarch/bc-mod-hook-manager';

// Add a callback to be executed after initialization
HookManager.afterInit(() => {
  console.log('Mod has been initialized');
});
```

### `afterPlayerLogin`

The `afterPlayerLogin` method allows you to add callbacks that will be executed after the player logs in. If the player is already logged in, the callback will be executed immediately.

```typescript
import { HookManager } from '@sugarch/bc-mod-hook-manager';

// Add a callback to be executed after player login
HookManager.afterPlayerLogin(() => {
  console.log('Player has logged in');
});
```

### `progressiveHook`

The `progressiveHook` method allows you to assemble hooks in a chain-like manner. This allows for more complex and flexible hook management by combining multiple hook functions into a single progressive hook.

```typescript
import { HookManager } from '@sugarch/bc-mod-hook-manager';

// Create a progressive hook (priority is optional parameter)
const hook = HookManager.progressiveHook('SomeFunction');

// Add steps to the progressive hook
hook
  // inject step will not set the return value
  .inject((args, next) => {
    console.log('Inject step');
  })
  // override step will set the return value
  .override((args, next) => {
    console.log('Override step');
    return next(args);
  });
// if a chain does not set the return value, the original function will be called after the last step
```
