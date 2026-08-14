import { getCurrentInstance, onBeforeUnmount, onMounted } from 'vue';

export function useAutoMobileMode(options = {}) {
    const {
        state,
        key,
        breakpoint = '(max-width: 767px)',
        narrow = 'list',
        wide = null,
    } = options;

    if (!state || !key) {
        return { markChosen() {} };
    }

    const storageKey = `datagrid.mode.chosen.${key}`;
    const media = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia(breakpoint)
        : null;

    function alreadyChosen() {
        if (!window.sessionStorage) {
            return true;
        }

        const params = new URLSearchParams(window.location.search);
        if (params.has('mode')) {
            return true;
        }

        return window.sessionStorage.getItem(storageKey) === '1';
    }

    function markChosen() {
        try {
            window.sessionStorage?.setItem(storageKey, '1');
        } catch { /* empty */ }
    }

    function applyIfIdle() {
        if (!media || alreadyChosen()) {
            return;
        }

        if (media.matches) {
            state.mode = narrow;
        } else if (wide !== null) {
            state.mode = wide;
        }
    }

    function onChange() {
        applyIfIdle();
    }

    onMounted(() => {
        applyIfIdle();
        media?.addEventListener?.('change', onChange);
    });

    if (getCurrentInstance()) {
        onBeforeUnmount(() => media?.removeEventListener?.('change', onChange));
    }

    return { markChosen };
}
