import { inject, provide } from 'vue';

export const DATAGRID_CONTEXT = Symbol('islands-datagrid');

function interpolate(line, replace) {
    let result = String(line);

    for (const [token, value] of Object.entries(replace)) {
        result = result.replace(new RegExp(`:${token}`, 'g'), String(value));
    }

    return result;
}

/**
 * Hand the package a translator and a locale.
 *
 * Call this in the setup of the component that renders a table. Without it the
 * package falls back to the English source strings and the `en` locale, which
 * is a working default, not an error.
 *
 * @param {{ t?: (key: string, replace?: Record<string, string|number>) => string, locale?: string }} context
 */
export function provideDatagrid(context = {}) {
    provide(DATAGRID_CONTEXT, context);
}

/**
 * @returns {{ t: (key: string, replace?: Record<string, string|number>) => string, locale: string }}
 */
export function useDatagrid() {
    const context = inject(DATAGRID_CONTEXT, null);

    return {
        t: context?.t ?? ((key, replace = {}) => interpolate(key, replace)),
        locale: context?.locale ?? 'en',
    };
}
