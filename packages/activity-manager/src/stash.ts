import { CustomActivity } from './types';

const customStorage: Record<string, CustomActivity<string, string>> = {};

export function addCustomActivity<
    CustomAct extends string = string,
    CustomPrereq extends string = ActivityPrerequisite
> (act: CustomActivity<CustomAct, CustomPrereq>) {
    customStorage[act.activity.Name] = act;
}

export function testCustomActivity (name: string) {
    return !!customStorage[name];
}
