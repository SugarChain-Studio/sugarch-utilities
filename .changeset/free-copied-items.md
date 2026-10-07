---
'@sugarch/bc-asset-manager': patch
---

`addCopyGroup` now makes the copied items free: the item definitions of a copied group get `Value: 0`, so they are always available instead of inheriting the price of the source group. The definitions are cloned in the process, the source group is left untouched. Provide the full item definitions through `defOverrides.Asset` to give the copied items a price.
