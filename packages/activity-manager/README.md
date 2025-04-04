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

## Usage

Here's a basic example of how to use the `@sugarch/bc-activity-manager` package:

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
// Or directly initialize the hook manager with modinfo
// HookManager.init(modInfo);

// Register the whole thing
ActivityManager.init();
```
