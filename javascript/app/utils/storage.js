const memoryValues = new Map();
const unpersistedKeys = new Set();

export function getStoredValue(key) {
    const storageKey = String(key);

    // A failed write must take precedence over an older persisted value.
    if (unpersistedKeys.has(storageKey)) {
        return memoryValues.get(storageKey) ?? null;
    }

    try {
        const value = window.localStorage.getItem(storageKey);
        if (value === null) {
            memoryValues.delete(storageKey);
        } else {
            memoryValues.set(storageKey, value);
        }
        return value;
    } catch {
        return memoryValues.get(storageKey) ?? null;
    }
}

export function setStoredValue(key, value) {
    const storageKey = String(key);
    const storedValue = String(value);
    memoryValues.set(storageKey, storedValue);

    try {
        window.localStorage.setItem(storageKey, storedValue);
        unpersistedKeys.delete(storageKey);
    } catch {
        // Keep preferences and cached data usable for the current page.
        unpersistedKeys.add(storageKey);
    }
}
