# @sugarch/bc-asset-manager

A package for managing assets in BC. It includes functions for loading, modifying, and validating assets, as well as handling custom dialogs and image mappings.

## Installation

This package requires the [`@sugarch/bc-mod-hook-manager`](../mod-hook-manager/) package to be installed. Make sure to install it before installing this package.

To install the package, use:

```bash
# Using pnpm
pnpm add @sugarch/bc-asset-manager

# Using yarn
yarn add @sugarch/bc-asset-manager

# Using npm
npm install @sugarch/bc-asset-manager
```

> [!IMPORTANT]
> This package have a peer dependency setting, if you encounter peer dependencies error, please install the required version of packages manually (add suffix `@x.x.x` to the package name in the install command, for example `@sugarch/bc-mod-hook-manager@0.2.12`)

---

## Simple Example

Here's a quick example of how to use the `AssetManager`:

```typescript
import { AssetManager } from '@sugarch/bc-asset-manager';

// Define a simple asset
const assetDef = {
    Name: "SimpleExample",
    Left: 150,
    Top: 200,
    Priority: 40,
    DefaultColor: ["#FFFFFF"],
    Layer: [
        {
            Name: "Base",
            AllowColorize: true,
        },
    ],
};

AssetManager.init(() => {
    // Add the asset to the game
    AssetManager.addAsset("ItemHandheld", assetDef);

    // Add image mappings for the asset
    AssetManager.addImageMapping({
        "Assets/Female3DCG/ItemHandheld/SimpleExample_Base.png": "https://example.com/SimpleExample_Base.png",
        "Assets/Female3DCG/ItemHandheld/Preview/SimpleExample.png": "https://example.com/SimpleExample_Preview.png",
    });
});
```

---

## API Reference

The `AssetManager` class provides a set of methods to manage assets in Bondage Club. Below is a detailed description of each method:

### `addAsset(group: CustomGroupName, asset: CustomAssetDefinition, extended?, description?, noMirror = false): void`

Adds an asset to a specific group. If the asset belongs to `ItemTorso` or `ItemTorso2`, a mirror will be automatically added.

- **Parameters**:
  - `group`: The asset group name.
  - `asset`: The asset definition.
  - `extended` (optional): Extended asset properties.
  - `description` (optional): Translated name of the asset.
  - `noMirror` (default `false`): Whether to disable automatic mirroring.

---

### `addGroupedAssets(groupedAssets: CustomGroupedAssetDefinitions, descriptions?, extended?): void`

Adds multiple assets to multiple groups.

- **Parameters**:
  - `groupedAssets`: A mapping of groups to their respective assets.
  - `descriptions` (optional): Translations for asset names.
  - `extended` (optional): Extended asset properties.

---

### `addGroupedConfig(extendedConfig: ExtendedItemMainConfig): void`

Adds grouped configuration for assets.

- **Parameters**:
  - `extendedConfig`: The grouped configuration.

---

### `modifyAsset(group: CustomGroupName, asset: string, work: FuncWork): void`

Modifies an asset's properties.

- **Parameters**:
  - `group`: The asset group name.
  - `asset`: The asset name.
  - `work`: A function to modify the asset.

---

### `modifyAssetLayers(filter: (asset: Asset) => boolean, work: FuncWork): void`

Modifies the layers of assets that match a filter.

- **Parameters**:
  - `filter`: A function to filter assets.
  - `work`: A function to modify the asset layers.

---

### `modifyGroup(group: CustomGroupName, work: FuncWork): void`

Modifies a body group's properties.

- **Parameters**:
  - `group`: The body group name.
  - `work`: A function to modify the group.

---

### `addCustomDialog(dialog: Translation.Dialog): void`

Adds a custom dialog.

- **Parameters**:
  - `dialog`: The dialog definition.

---

### `addImageMapping(mappings: ImageMappingRecord): void`

Adds custom image mappings.

- **Parameters**:
  - `mappings`: A record of image mappings.

---

### `addGroup(groupDef: CustomGroupDefinition, description?): void`

Adds a new body group.

- **Parameters**:
  - `groupDef`: The group definition.
  - `description` (optional): Translated name of the group.

---

### `addCopyGroup(newGroup: CustomGroupName, copyFrom: AssetGroupName, description?): void`

Adds a new body group by copying configuration from an existing group.

- **Parameters**:
  - `newGroup`: The new group name.
  - `copyFrom`: The existing group to copy from.
  - `description` (optional): Translated name of the new group.

---

### `addLayerNames(group: CustomGroupName, assetDef: CustomAssetDefinition, entries: Translation.CustomRecord): void`

Adds custom layer names based on the asset definition.

- **Parameters**:
  - `group`: The body group name.
  - `assetDef`: The asset definition.
  - `entries`: Layer names grouped by language.

---

### `addLayerNamesByEntry(group: CustomGroupName, assetName: string, entries: Translation.CustomRecord): void`

Adds custom layer names based on entries.

- **Parameters**:
  - `group`: The body group name.
  - `assetName`: The asset name.
  - `entries`: Layer names grouped by language.

---

### `assetIsCustomed(asset: Asset): boolean`

Checks if an asset is custom.

- **Parameters**:
  - `asset`: The asset to check.
- **Returns**: `true` if the asset is custom, otherwise `false`.

---

### `assetNameIsStrictCustomed(assetName: string): boolean`

Checks if an asset name is strictly custom.

- **Parameters**:
  - `assetName`: The name of the asset.
- **Returns**: `true` if the asset name is strictly custom, otherwise `false`.

---

### `afterLoad(wk: () => void): void`

Adds an event to be executed after loading is complete.

- **Parameters**:
  - `wk`: The function to execute.

---

### `init(componentSetup: FuncWork): void`

Initializes the asset manager and adds custom components.

- **Parameters**:
  - `componentSetup`: A function to set up custom components.

---

### `enableValidation(fromModUserTest: FromModUserTestFunc): void`

Enables validation for non-mod removal.

- **Parameters**:
  - `fromModUserTest`: A function to determine if the user is from a mod.

---

### `setLogger(logger: ILogger): void`

Sets the logger for the asset manager.

- **Parameters**:
  - `logger`: The logger instance.

---

### `typeBodyGroupNames<T extends string>(): _AssetManager<T>`

Retypes the `AssetManager` to customize body group names and ensure type safety.

- **Returns**: A retyped `AssetManager` instance.

---

## Detailed Example

For a more detailed example, including how to register mods and initialize the `AssetManager`, see below:

```typescript
import { AssetManager } from '@sugarch/bc-asset-manager';
import { HookManager } from '@sugarch/bc-mod-hook-manager';

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
            // it will be drawn at [Left, Top] position relative to character canvas
            Name: "Base",
            AllowColorize: true,
        },
    ],
};

// Assembling an asset registration function
// Tips: I like to pack asset in separate files, and each file will have a function like this. 
//   With custom assets piling up, it's easier to manage them this way.
function registerSimpleExample() {
    // Add the asset to the game
    AssetManager.addAsset("ItemHandheld", assetDef);
    // Mapping the images
    AssetManager.addImageMapping({
        // the image for the Base layer
        "Assets/Female3DCG/ItemHandheld/SimpleExample_Base.png": `${yourBaseURL}/SimpleExample_Base.png`,
        // the image for the dialog preview icon
        "Assets/Female3DCG/ItemHandheld/Preview/SimpleExample.png": `${yourBaseURL}/SimpleExample_Preview.png`,
    })
}

// Mod info for the mod, this is used to register the mod to bc mod sdk
const modInfo = ...;

// Initialize the hook manager, AssetManager will use it to hook essential functions
HookManager.initWithMod(bcModSdk.registerMod(modInfo));
// Or directly initialize the hook manager with modinfo
// HookManager.init(modInfo);

// Register the whole thing
AssetManager.init(() => {
    registerSimpleExample();
});
```
