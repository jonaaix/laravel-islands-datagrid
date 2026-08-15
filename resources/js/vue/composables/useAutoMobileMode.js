import { getCurrentInstance, onBeforeUnmount, onMounted, ref } from 'vue';

export function useAutoMobileMode(options = {}) {
    const {
        state,
        key,
        breakpoint = '(max-width: 767px)',
        narrow = 'list',
        wide = null,
        remember = false,
    } = options;

    if (!state || !key) {
        return { markChosen() {}, isNarrow: ref(false) };
    }

    const storageKey = `datagrid.mode.chosen.${key}`;
    const rememberKey = `datagrid.mode.wide.${key}`;
    const media = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia(breakpoint)
        : null;

    const isNarrow = ref(media ? media.matches : false);

    let rememberedWide = wide;

    if (remember && typeof window !== 'undefined' && window.sessionStorage) {
        const stored = window.sessionStorage.getItem(rememberKey);
        if (stored) {
            rememberedWide = stored;
        } else if (state.mode && state.mode !== narrow) {
            rememberedWide = state.mode;
        }
    } else if (state.mode && state.mode !== narrow) {
        rememberedWide = state.mode;
    }

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

    function saveRememberedWide(mode) {
        if (!remember) {
            return;
        }

        try {
            window.sessionStorage?.setItem(rememberKey, String(mode));
        } catch { /* empty */ }
    }

    function applyInitial() {
        if (!media) {
            return;
        }

        if (media.matches && state.mode !== narrow) {
            if (state.mode) {
                rememberedWide = state.mode;
                saveRememberedWide(state.mode);
            }
            if (!alreadyChosen()) {
                state.mode = narrow;
            }
        } else if (!media.matches && state.mode === narrow && rememberedWide) {
            if (!alreadyChosen()) {
                state.mode = rememberedWide;
            }
        }
    }

    function onChange(event) {
        isNarrow.value = event.matches;

        if (event.matches) {
            if (state.mode !== narrow) {
                rememberedWide = state.mode;
                saveRememberedWide(state.mode);
                state.mode = narrow;
            }
        } else if (state.mode === narrow) {
            state.mode = rememberedWide ?? wide ?? state.mode;
        }
    }

    function trackWideChoice(mode) {
        if (mode && mode !== narrow) {
            rememberedWide = mode;
            saveRememberedWide(mode);
        }
    }

    onMounted(() => {
        applyInitial();
        media?.addEventListener?.('change', onChange);
    });

    if (getCurrentInstance()) {
        onBeforeUnmount(() => media?.removeEventListener?.('change', onChange));
    }

    return { markChosen, isNarrow, trackWideChoice };
}
