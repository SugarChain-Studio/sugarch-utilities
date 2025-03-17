# BC Mod Manager

## Key Features

### `hookFunction`
The `hookFunction` method allows you to register hooks that can be executed before the mod initialization. This is useful for setting up necessary hooks early in the mod lifecycle.

```typescript
import { ModManager } from '@sugarchain/bc-mod-manager';

// Register a hook function
ModManager.hookFunction('SomeFunction', 1, (args, next) => {
  console.log('Hook before SomeFunction');
  next(args);
});

const bcmod = bcModSdk.registerMod(...);

// initialize the mod after registering the hook, then the hook will be executed
ModManager.initWithMod(bcmod);
```

### `afterInit`
The `afterInit` method lets you add callbacks that will be executed after the mod has been initialized. If the mod is already initialized, the callback will be executed immediately.

```typescript
import { ModManager } from '@sugarchain/bc-mod-manager';

// Add a callback to be executed after initialization
ModManager.afterInit(() => {
  console.log('Mod has been initialized');
});
```

### `afterPlayerLogin`
The `afterPlayerLogin` method allows you to add callbacks that will be executed after the player logs in. If the player is already logged in, the callback will be executed immediately.

```typescript
import { ModManager } from '@sugarchain/bc-mod-manager';

// Add a callback to be executed after player login
ModManager.afterPlayerLogin(() => {
  console.log('Player has logged in');
});
```

### `progressiveHook`
The `progressiveHook` method enables you to assemble hooks in a chain-like manner. This allows for more complex and flexible hook management by combining multiple hook functions into a single progressive hook.

```typescript
import { ModManager } from '@sugarchain/bc-mod-manager';

// Create a progressive hook
const hook = ModManager.progressiveHook('SomeFunction');

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

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.