---
'@sugarch/bc-activity-manager': patch
'@sugarch/bc-asset-manager': patch
'@sugarch/bc-image-mapping': patch
---

Pass the rewritten cross-origin request to `CommonFetch` on its own, so cross-origin images keep loading on R134. R134 adds an `options` argument and throws when it is given both that and a request object, and the image cache always passes `{ accept: image/* }`, so every rewritten request failed and nothing was drawn for it. The headers from `options` are copied into the request instead. `@sugarch/bc-asset-manager` and `@sugarch/bc-activity-manager` bundle this package, so they are bumped explicitly.
