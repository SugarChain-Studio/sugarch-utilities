---
'@sugarch/bc-image-mapping': patch
'@sugarch/bc-asset-manager': patch
'@sugarch/bc-activity-manager': patch
---

Remove the obsolete `GLDrawLoadImage` cross-origin patch. R133 loads images with the `fetch()`-based `ImageCache`, which requests cross-origin images in CORS mode and decodes blobs, so the patch no longer matched and only produced ModSDK "Patch not applied" warnings.
