import { computed, ref } from 'vue';
import { sendJson } from '../http.js';

/**
 * The views a person saved for one table: which one is active, whether it has been changed
 * since, and everything needed to save, rename, replace or drop one.
 *
 * A table hands over its state and the keys a view describes; the wording, the menu and what
 * counts as "the plain view" stay with the caller.
 *
 * @param {object} options
 * @param {import('vue').Reactive<Record<string, any>>} options.state The table's own state.
 * @param {Record<string, any>} options.defaults The state a fresh page starts from.
 * @param {string[]} options.keys Which state keys a view describes.
 * @param {string} options.storeUrl Where a new view is posted.
 * @param {string} options.profileUrl Address of one view, with `__REF__` where its reference goes.
 * @param {string} [options.stateKey] The state key holding the active reference, `view` by default.
 * @param {Array<object>} [options.initial] The views the server sent with the page.
 * @param {object|null} [options.shared] A view opened by link that belongs to somebody else.
 * @param {Record<string, any>} [options.plain] What "unchanged" means per key, where it differs
 *   from `defaults` — a remembered column set, for instance.
 * @param {(payload: object) => void} options.apply Puts a view's payload into the table.
 * @param {(message: string) => void} [options.onError] Told when a write is refused.
 */
export function useViewProfiles(options) {
    const {
        state,
        defaults,
        keys,
        storeUrl,
        profileUrl,
        stateKey = 'view',
        initial = [],
        shared = null,
        plain = {},
        apply,
        onError = null,
    } = options;

    const own = ref([...initial]);
    const sharedProfile = ref(shared?.owned === false ? shared : null);
    const busy = ref(false);

    const active = computed(() => {
        const ref_ = state[stateKey];

        if (!ref_) {
            return null;
        }

        const mine = own.value.find((profile) => profile.ref === ref_);

        if (mine) {
            return { ...mine, owned: true };
        }

        return sharedProfile.value?.ref === ref_ ? { ...sharedProfile.value, owned: false } : null;
    });

    /** What the table currently describes, as a view would store it. */
    function payload() {
        const result = {};

        for (const key of keys) {
            if (String(state[key] ?? '') !== String(defaults[key] ?? '')) {
                result[key] = state[key];
            }
        }

        return result;
    }

    function same(a, b) {
        const both = [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])];

        return both.every((key) => String(a?.[key] ?? '') === String(b?.[key] ?? ''));
    }

    /** The active view no longer matches what is on screen. */
    const changed = computed(() => Boolean(active.value) && !same(payload(), active.value.payload));

    /** Something is narrowed at all, so there is a view worth saving. */
    const dirty = computed(() => keys.some((key) => {
        const base = key in plain ? plain[key] : defaults[key];

        return String(state[key] ?? '') !== String(base ?? '');
    }));

    async function call(url, method, body) {
        busy.value = true;

        try {
            const { data } = await sendJson(url, method, body);

            return data?.data ?? null;
        } catch (error) {
            onError?.(error?.payload?.errors
                ? Object.values(error.payload.errors).flat()[0]
                : (error?.payload?.message ?? ''));

            return null;
        } finally {
            busy.value = false;
        }
    }

    function addressOf(profileRef) {
        return String(profileUrl).replace('__REF__', profileRef);
    }

    async function save(name) {
        const result = await call(storeUrl, 'POST', { name, payload: payload() });

        if (!result) {
            return;
        }

        own.value = result.profiles;
        sharedProfile.value = null;
        state[stateKey] = result.profile.ref;
    }

    async function replace() {
        const target = active.value;
        const result = target?.owned ? await call(addressOf(target.ref), 'PATCH', { payload: payload() }) : null;

        if (result) {
            own.value = result.profiles;
        }
    }

    async function rename(name) {
        const target = active.value;
        const result = target?.owned ? await call(addressOf(target.ref), 'PATCH', { name }) : null;

        if (result) {
            own.value = result.profiles;
        }
    }

    async function remove() {
        const target = active.value;

        if (!target?.owned) {
            return false;
        }

        const result = await call(addressOf(target.ref), 'DELETE');

        if (!result) {
            return false;
        }

        own.value = result.profiles;
        state[stateKey] = '';

        return true;
    }

    /** Every key a view describes goes back to its default, then the view is written over it. */
    function write(next) {
        for (const key of keys) {
            state[key] = defaults[key];
        }

        Object.assign(state, next || {});
    }

    function open(profile) {
        write(profile.payload || {});
        state[stateKey] = profile.ref;
        apply(profile.payload || {});
    }

    function reset() {
        write({});
        state[stateKey] = '';
        apply({});
    }

    return { profiles: own, active, changed, dirty, busy, payload, save, replace, rename, remove, open, reset, write };
}
