const emptyPNG = `data:img/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAC4jAAAuIwF4pT92AAAA
G3RFWHRTb2Z0d2FyZQBDZWxzeXMgU3R1ZGlvIFRvb2zBp+F8AAAADUlEQVQI12P4//8/AwAI/AL+
XJ/P2gAAAABJRU5ErkJggg==`;

class Paths {
    // image/empty.png
    static get EmptyImage() {
        return emptyPNG;
    }

    /**
     * Get the icon path of the asset
     * @param asset The item
     * @returns The icon path
     */
    static AssetPreviewIconPath(asset: Asset | Item): string {
        const _asset = "Asset" in asset ? asset.Asset : asset;
        return `${AssetGetPreviewPath(_asset)}/${_asset.Name}.png`;
    }

    /**
     * Get the icon path of the activity
     * @param activity The activity
     * @returns The icon path
     */
    static ActivityPreviewIconPath(activity: Activity | ItemActivity): string {
        const _activity = "Activity" in activity ? activity.Activity : activity;
        return `Assets/Female3DCG/Activity/${_activity.Name}.png`;
    }
}

export { Paths };