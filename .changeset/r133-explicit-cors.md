---
'@sugarch/bc-image-mapping': patch
'@sugarch/bc-asset-manager': patch
'@sugarch/bc-activity-manager': patch
---

Request cross-origin images explicitly in CORS mode. R133 loads images through the fetch()-based `ImageCache`, so `CommonFetch` calls for other origins now use `mode: "cors"` and `credentials: "omit"`, with conditional headers removed since they would fail the preflight. Same-origin requests are untouched.
