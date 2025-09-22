# @sugarch/bc-activity-manager


## Installation

This package requires the [`@sugarch/bc-mod-hook-manager`](../mod-hook-manager/) and [`@sugarch/bc-event-handler`](../event-handler/) package to be installed. Make sure to install it before installing this package.

To install the package, use:

```bash
# Using pnpm
pnpm add @sugarch/bc-activity-manager

# Using yarn
yarn add @sugarch/bc-activity-manager

# Using npm
npm install @sugarch/bc-activity-manager
```

> [!IMPORTANT]
> This package have a peer dependency setting, if you encounter peer dependencies error, please install the required version of packages manually (add suffix `@x.x.x` to the package name in the install command, for example `@sugarch/bc-mod-hook-manager@0.2.12`)

## Example Usage

Bellow is a simple example of how to use the `@sugarch/bc-activity-manager` package:

```typescript
import { ActivityManager } from '@sugarch/bc-activity-manager';

// Add a custom activity
ActivityManager.addCustomActivity({
    activity: {
        Name: "MyKneelDown",
        Prerequisite: ["CantUseFeet"],
        MaxProgress: 0,
        Target: [],
        TargetSelf: ["ItemLegs"],
    },
    useImage: "Wiggle",
    labelSelf: { EN: "Kneel Down" },
    dialogSelf: { EN: "SourceCharacter kneels down gently." },
});

// Check if an activity is custom
console.log(ActivityManager.activityIsCustom("MyKneelDown")); // true

// Remove a custom activity
ActivityManager.removeCustomActivity("MyKneelDown");
```

## API Reference

The `ActivityManager` class provides a set of methods to manage custom activities in Bondage Club. Below is a detailed description of each method:

### `addPrerequisites(prereqs: CustomActivityPrerequisiteItem<CustomPrereq>[]): void`

Adds custom activity prerequisites.

- **Parameters**:
  - `prereqs`: An array of custom prerequisites to add.

---

### `checkActivityAvailability(name: string): boolean`

Checks if an activity name is available.

- **Parameters**:
  - `name`: The name of the activity to check.
- **Returns**: `true` if the activity name is available, otherwise `false`.

---

### `addCustomActivity(act: CustomActivity<CustomAct, CustomPrereq>): void`

Adds a custom activity to the activity manager.

- **Parameters**:
  - `act`: The custom activity definition.

---

### `removeCustomActivity(name: string): void`

Removes a custom activity from the activity manager.

- **Parameters**:
  - `name`: The name of the activity to remove.

---

### `activityIsCustom(name: string): boolean`

Checks if an activity is custom.

- **Parameters**:
  - `name`: The name of the activity to check.
- **Returns**: `true` if the activity is custom, otherwise `false`.

---

### `addCustomActivities(acts: CustomActivity<CustomAct, CustomPrereq>[]): void`

Adds multiple custom activities to the activity manager.

- **Parameters**:
  - `acts`: An array of custom activities to add.

---

### `activityTrigger(modifier: ActivityExtendedEvent): void`

Adds an additional trigger function for an existing activity.

- **Parameters**:
  - `modifier`: The activity modifier definition.

---

### `setLogger(logger: ILogger): void`

Sets the logger for the activity manager.

- **Parameters**:
  - `logger`: The logger instance to use.

---

### `typePrerequisiteNames<T extends string>(): _ActivityManager<CustomAct, T>`

Retypes the `ActivityManager` to customize prerequisite names and ensure type safety.

- **Returns**: A retyped `ActivityManager` instance.

---

### `typeActivityNames<T extends string>(): _ActivityManager<T, CustomPrereq>`

Retypes the `ActivityManager` to customize activity names and ensure type safety.

- **Returns**: A retyped `ActivityManager` instance.

---

## Detailed Usage

Here's a detailed example of how to use the `@sugarch/bc-activity-manager` package:

```typescript
import { ActivityManager, CustomActivity } from '@sugarch/bc-activity-manager';
import { HookManager } from '@sugarch/bc-mod-hook-manager';

const activityDef: CustomActivity = {
    activity: {
        // The name of the activity, must be unique
        Name: "KneelDown",
        // Prerequisites for the activity,
        Prerequisite: ["CantUseFeet", 
            // this is a extension to the base game activity definition
            // you can define a custom function to check if the activity can be performed
            (prereq, acting, acted, target) => {
                return acting.CanKneel();
            }
        ],
        // Activities would raise arousal, this is the maximum value can be 
        // raised to with this activity (optional)
        MaxProgress: 50,
        // Where the activity can be performed, empty array means no where
        Target: [],
        // If where the activity can be performed is different when the activity is performed on self,
        // provide the target for self here (optional)
        TargetSelf: ["ItemLegs"],
    },

    // How the `run` function should be called, self on self means the activity is performed on self
    // see @sugarch/bc-event-handler for more details
    mode: "SelfOnSelf",
    run: (player, sender, info) => {
        // The function to run when the activity is performed
        // This is where you can define the behavior of the activity
        // For example, you can use the following code to make the acting character kneel down
        PoseSetActive(acted, "Kneel");
    },

    // The image to use for the activity, may use URL, data:image, or reuse the base game image
    // here we reuse the base game image for "Wiggle" activity
    useImage: "Wiggle",
    // The label for the activity, this is the text that will be displayed in activity dialog
    labelSelf: {
        CN: "跪下",
        EN: "Kneel Down",
    },
    // The text for the activity, this is the text that will be displayed in chat log
    dialogSelf: {
        CN: "SourceCharacter轻轻地跪了下来.",
        EN: "SourceCharacter kneels down gently.",
    },
};

// Add the custom activity to the activity manager
ActivityManager.addCustomActivity(activityDef);

// Mod info for the mod, this is used to register the mod to bc mod sdk
const modInfo = ...;

// Initialize the hook manager, ActivityManager will use it to hook essential functions
HookManager.initWithMod(bcModSdk.registerMod(modInfo));

// Register the whole thing
ActivityManager.init();
```
