# @sugarch/bc-asset-manager

A package for managing assets in BC. It includes functions for loading, modifying, and validating assets, as well as handling custom dialogs and image mappings.

## Installation

This package requires the `@sugarch/bc-mod-hook-manager` package to be installed. Make sure to install it before installing this package.

To install the package, use pnpm:

```bash
pnpm add @sugarch/bc-asset-manager --save-dev
```

## Usage

Here's a basic example of how to use the `@sugarch/bc-asset-manager` package:

```typescript
import { AssetManager } from '@sugarch/bc-asset-manager';

// write a AssetDefinition for your asset, just like vanilla BC definition
const assetDef: AssetDefinition = {
    // The name of the asset, must be unique in the body group
    Name: "SimpleExample",

    // Position properties, typical player canvas size is 500x1000 (width x height)
    // With character centered in the canvas ( a little bit to the top actually )
    Left: 150,
    Top: 200,

    // if the item needs to adapt to different body type ( large/small/normal, etc )
    ParentGroup: {},

    // the drawing order of the item, higher number means drawn later, and on top of other items
    Priority: 40,

    // the default color
    DefaultColor: ["#FFFFFF"],

    // Asset layers, technically picture resource names
    Layer: [
        {
            // this means a picture resouce located at "Assets/ItemMisc/SimpleExample_Base.png"
            // it will be drawn at [Left, Top] position related to character canvas
            Name: "Base",
            AllowColorize: true,
        },
    ],
};

// Assembling an asset registration function
// I like to pack asset in separate files, and each file will have a function like this. For me, t's easier to manage the massing assets.
function registerSimpleExample() {
    // Add the asset to the game
    AssetManager.addAsset("ItemHandHeld", assetDef);
    // Mapping the images
    AssetManager.addImageMapping({
        // the image for the Base layer
        "Assets/ItemMisc/SimpleExample_Base.png": `${yourBaseURL}/SimpleExample_Base.png`,
        // the image for the dialog preview icon
        "Assets/ItemMisc/Preview/SimpleExample.png": `${yourBaseURL}/SimpleExample_Preview.png`,
    })
}


// Register the whole thing
AssetManager.init(() => {
    registerSimpleExample();
});
```

This `addAsset` method also accepts three optional parameters:

- `extended`: You can provide `ExtendedAssetDefinition` with this parameter to add more features to the asset. Also you can skip this with `null` or `undefined`.
- `description`: Actually it's not a "description". It's translated name. (The property for this in BC is `Description`) Here you can provide a `Record<Language, string>` to add translations, e.g. : `{ EN: "Simple Example", DE: "Einfaches Beispiel" }`.
  - The name will fallback to `assetDef.Name` if not provided, so there should be no `missing description` appearing in the game with this method.
- `noMirror` (default `false`): There are some "mirror groups" in BC, like `ItemTorso` and `ItemTorso2`, adding the asset to one group will automatically add it to the other group. If you don't want this behavior, you can set this parameter to `true`.