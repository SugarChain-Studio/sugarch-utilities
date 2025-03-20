import { Globals, INamespace } from '@sugarch/bc-mod-utility';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const OncePatchEnv = Globals.createNamespace<any>('AssetManagerPatchOnce');

export function oncePatch<T> () {
    return OncePatchEnv as INamespace<T>;
}
