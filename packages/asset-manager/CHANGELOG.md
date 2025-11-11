# @sugarch/bc-asset-manager

## 1.0.11

### Patch Changes

-   Updated dependencies [fe0497e]
    -   @sugarch/bc-mod-hook-manager@0.3.4

## 1.0.10

### Patch Changes

-   Updated dependencies [aa850fe]
    -   @sugarch/bc-mod-types@0.6.4
    -   @sugarch/bc-mod-hook-manager@0.3.3

## 1.0.9

### Patch Changes

-   bae42c5: add CustomAssetDefinitionBase to exports in asset-manager

## 1.0.8

### Patch Changes

-   Updated dependencies [cc921fb]
    -   @sugarch/bc-mod-types@0.6.3
    -   @sugarch/bc-mod-hook-manager@0.3.2

## 1.0.7

### Patch Changes

-   63508f6: update dependencies

## 1.0.6

### Patch Changes

-   32db87c: update image source validation to include blob and data URIs

## 1.0.5

### Patch Changes

-   352d364: refine type check in addAssetWithConfigTyping function

## 1.0.4

### Patch Changes

-   5239284: correct type check in addAssetWithConfigTyping function

## 1.0.2

### Patch Changes

-   Updated dependencies [954af75]
    -   @sugarch/bc-mod-hook-manager@0.3.1

## 1.0.1

### Patch Changes

-   Updated dependencies

## 1.0.0

### Patch Changes

-   Updated dependencies
    -   @sugarch/bc-mod-hook-manager@0.3.0

## 0.8.0

### Minor Changes

-   Make `layerNames` not mandatory for `addAssetWithConfig`, and enable array input for `addAssetWithConfig`.

## 0.7.4

### Patch Changes

-   d5962c5: Compatibility with bcx search

## 0.7.3

### Patch Changes

-   4afc5b4: Simplify the InventoryAvailable hook logic to avoid excessive recursive calls.

## 0.7.2

### Patch Changes

-   6d405dc: Add a second stage check for item availability.

## 0.7.1

### Patch Changes

-   9001eaa: Fix layer names translation for mutiple assets that shares layer names

## 0.7.0

### Minor Changes

-   07299b0: Add supplyExtended function to manage extended asset configurations.

## 0.6.0

### Minor Changes

-   85c69d5: Remove deprecated asset dialogs method and fields.

### Patch Changes

-   1918822: `addCopyGroup` now supports overrides some props to make the copied group different with original one.

## 0.5.16

### Patch Changes

-   Fix possible errors in @nomap processing

## 0.5.15

### Patch Changes

-   dbbee12: Use value >= 0 as a flag to indicate whether the asset is displayed in dialog

## 0.5.14

### Patch Changes

-   13bc9fb: Fix asset being added to dialog for a second time in permission mode.

## 0.5.13

### Patch Changes

-   Updated dependencies
    -   @sugarch/bc-mod-hook-manager@0.2.16

## 0.5.12

### Patch Changes

-   Repack the image mapping and related package

## 0.5.11

### Patch Changes

-   689a4ed: Update image mapping dependency.

## 0.5.10

### Patch Changes

-   7f55c8d: Support adding layer names without asset definition

## 0.5.9

### Patch Changes

-   make names for items with Craft consistent

## 0.5.8

### Patch Changes

-   fix craft name display for used asset

## 0.5.7

### Patch Changes

-   Updated dependencies
    -   @sugarch/bc-mod-types@0.6.2
    -   @sugarch/bc-mod-hook-manager@0.2.15

## 0.5.6

### Patch Changes

-   handle `ExtendedItemManualRegister` related extended config

## 0.5.5

### Patch Changes

-   rename translation-related functions and types for clarity
-   Updated dependencies
    -   @sugarch/bc-mod-types@0.6.1
    -   @sugarch/bc-mod-hook-manager@0.2.14

## 0.5.4

### Patch Changes

-   Rename 'description' parameter to 'translation'

## 0.5.3

### Patch Changes

-   The extended config in params of addAsset should be optional

## 0.5.2

### Patch Changes

-   a383ae8: Add a `addGroupedAssetsWithConfig` as a grouped flavor of `addAssetWithConfig`
-   b7501b7: Fix switching language result in missing description
-   4c99fd5: Fix layer name resolve

## 0.5.1

### Patch Changes

-   23333ad: Provide a new method to add asset `addAssetWithConfig`, it supports more configs in a single call.

## 0.5.0

### Minor Changes

-   Implements emoticon image mapping, finalize support for R114Beta changes

## 0.4.10

### Patch Changes

-   Supports alpha texture mapping

## 0.4.9

### Patch Changes

-   eda2362: Allow group parameter in modifyAsset to accept an array
-   17f2b3b: Support for R115 preview change

## 0.4.8

### Patch Changes

-   a04df7c: Fix migrate imageMapping

## 0.4.7

### Patch Changes

-   ba3f209: Export storage property in image mapping

## 0.4.6

### Patch Changes

-   Enhance ImageMappingStorage with migration method

## 0.4.5

### Patch Changes

-   c16f7e9: Improve image mapping tools setup

## 0.4.4

### Patch Changes

-   Update dependencies

## 0.4.3

### Patch Changes

-   Updated dependencies
    -   @sugarch/bc-mod-hook-manager@0.2.13

## 0.4.2

### Patch Changes

-   Fix parameter typing for `modifyGroup`.

## 0.4.1

### Patch Changes

-   Add package info in dist files
-   Updated dependencies
    -   @sugarch/bc-mod-hook-manager@0.2.12

## 0.4.0

### Minor Changes

-   Add a `assetNameIsStrictCustomed` interface

## 0.3.1

### Patch Changes

-   Fix layerName processing.

## 0.3.0

### Minor Changes

-   Fix that some patch need to be handled globally.

## 0.2.16

### Patch Changes

-   Updated dependencies
    -   @sugarch/bc-mod-types@0.6.0
    -   @sugarch/bc-mod-hook-manager@0.2.11

## 0.2.15

### Patch Changes

-   Adjust type export for easier use.

## 0.2.14

### Patch Changes

-   Updated dependencies
    -   @sugarch/bc-mod-types@0.5.0
    -   @sugarch/bc-mod-hook-manager@0.2.10

## 0.2.13

### Patch Changes

-   Updated dependencies
    -   @sugarch/bc-mod-hook-manager@0.2.9

## 0.2.12

### Patch Changes

-   Updated dependencies
    -   @sugarch/bc-mod-types@0.4.0
    -   @sugarch/bc-mod-hook-manager@0.2.8

## 0.2.11

### Patch Changes

-   Implement activity related events, types, and activity manager
-   Updated dependencies
    -   @sugarch/bc-mod-types@0.3.0
    -   @sugarch/bc-mod-hook-manager@0.2.7
