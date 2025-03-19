import { CustomActivity } from './types';

const customStorage: Record<string, CustomActivity<string>> = {};

export function addCustomActivity<CustomPrereq extends string = ActivityPrerequisite> (act: CustomActivity<CustomPrereq>) {
    customStorage[act.activity.Name] = act;
}

export function testCustomActivity (name: string) {
    return !!customStorage[name];
}
