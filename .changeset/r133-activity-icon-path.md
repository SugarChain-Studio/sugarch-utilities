---
'@sugarch/bc-activity-manager': patch
'@sugarch/bc-asset-manager': patch
'@sugarch/bc-image-mapping': patch
'@sugarch/bc-mod-utility': patch
---

R133 moved the activity icons from `Assets/Female3DCG/Activity/` to `Icons/Activity/`; `PathTools.activityPreviewIconPath` and the activity button image fallback now build the new path. `@sugarch/bc-asset-manager` and `@sugarch/bc-activity-manager` bundle both packages, so they are bumped explicitly.
