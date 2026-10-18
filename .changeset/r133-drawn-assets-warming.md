---
'@sugarch/bc-activity-manager': patch
'@sugarch/bc-asset-manager': patch
'@sugarch/bc-image-mapping': patch
---

Record the remapped URL as a drawn asset on R133, so `CommonDrawWarmDrawnAssets` keeps the image that is actually loaded in the cache instead of the original path, which let it be purged while still worn. `@sugarch/bc-asset-manager` and `@sugarch/bc-activity-manager` bundle this package, so they are bumped explicitly.
