---
"@sugarch/bc-image-mapping": patch
"@sugarch/bc-activity-manager": patch
"@sugarch/bc-asset-manager": patch
---

Pass rewritten cross-origin requests using the canonical single-`Request` argument form expected by `CommonFetch`, avoiding its `Request`/options validation error.
