import { ModManager } from '@sugarch/bc-mod-manager';
import { accessCustomAsset } from './customStash';

// Extend appearance update parameters with an optional fromModUser property
interface AUParametersExt extends AppearanceUpdateParameters {
    fromModUser?: boolean;
}

/**
 * Function to test if the parameters are from a mod user
 * @param param Appearance update parameters
 * @returns Whether the parameters are from a mod user
 */
export type fromModUserTestFunc = (param: AppearanceUpdateParameters) => boolean;

let fromModUserTest: fromModUserTestFunc | undefined = undefined;

let hookEnabled = false;
function runHook () {
    if (hookEnabled) return;
    hookEnabled = true;

    // Prevent custom assets from being removed by non-mod users
    ModManager.hookFunction('ValidationResolveRemoveDiff', 1, (args, next) => {
        const [previousItem, params] = args;
        if (
            !(params as AUParametersExt).fromModUser &&
            accessCustomAsset(previousItem.Asset.Group.Name, previousItem.Asset.Name)
        ) {
            return { item: previousItem, valid: false };
        }
        return next(args);
    });

    // Prevent custom assets from being swapped by non-mod users
    ModManager.hookFunction('ValidationResolveSwapDiff', 1, (args, next) => {
        const [previousItem, _, params] = args;
        if (
            !(params as AUParametersExt).fromModUser &&
            accessCustomAsset(previousItem.Asset.Group.Name, previousItem.Asset.Name)
        ) {
            return { item: previousItem, valid: false };
        }
        return next(args);
    });

    // Set fromModUser property based on the test function
    ModManager.hookFunction('ValidationResolveAppearanceDiff', 1, (args, next) => {
        if (fromModUserTest) (args[3] as AUParametersExt).fromModUser = fromModUserTest(args[3]);
        return next(args);
    });
}

/**
 * Enable validation to prevent custom assets from being removed or swapped by non-mod users
 * @param fromModUserTest Function to test if the parameters are from a mod user
 */
export function enableValidation (fromModUserTest: fromModUserTestFunc): void {
    fromModUserTest = fromModUserTest;
    runHook();
}
