const emptyPNG = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAG3RFWHRTb2Z0d2FyZQBDZWxzeXMgU3R1ZGlvIFRvb2zBp+F8AAAADUlEQVQI12P4//8/AwAI/AL+XJ/P2gAAAABJRU5ErkJggg==`;

class PathTools {
    // image/empty.png
    static get emptyImage() {
        return emptyPNG;
    }

    /**
     * Get the icon path of the asset
     * @param asset The item
     * @returns The icon path
     */
    static assetPreviewIconPath(asset: Asset | Item): string {
        const stripAsset = "Asset" in asset ? asset.Asset : asset;
        return `${AssetGetPreviewPath(stripAsset)}/${stripAsset.Name}.png`;
    }

    /**
     * Get the icon path of the activity
     * @param activity The activity
     * @returns The icon path
     */
    static activityPreviewIconPath(activity: Activity | ItemActivity): string {
        const stripActivity = "Activity" in activity ? activity.Activity : activity;
        return `Assets/Female3DCG/Activity/${stripActivity.Name}.png`;
    }
}

export { PathTools };