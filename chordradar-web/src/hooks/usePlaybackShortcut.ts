/**
 * usePlaybackShortcut - Keyboard shortcut hook for chord playback
 *
 * Attaches a single document-level keydown listener that calls the provided
 * play function when the configured playback key is pressed.
 *
 * Key binding is stored in localStorage ("chordradar.playKey") so it can be
 * changed later via a settings menu without touching this hook.
 * Default key: Space (" ").
 *
 * Skips firing when focus is on an INPUT, TEXTAREA, SELECT, or contenteditable
 * so users can type without accidentally triggering playback.
 *
 * Uses a ref pattern: the listener is registered once on mount; the ref keeps
 * the callback up-to-date across re-renders without re-attaching.
 *
 * Exports:
 *  - usePlaybackShortcut(playFn) — React hook
 *  - getPlaybackKey()           — reads current key from localStorage
 *  - setPlaybackKey(key)        — persists a new key to localStorage
 *  - DEFAULT_PLAY_KEY           — " " (Space)
 */

import { useEffect, useRef } from "react";

const PLAY_KEY_STORAGE_KEY = "chordradar.playKey";

/** The default playback key: Space. */
export const DEFAULT_PLAY_KEY = " ";

/** Read the currently configured playback key from localStorage. */
export function getPlaybackKey(): string {
    try {
        return window.localStorage.getItem(PLAY_KEY_STORAGE_KEY) ?? DEFAULT_PLAY_KEY;
    } catch {
        // Ignore storage access errors (e.g., private browsing restrictions).
        return DEFAULT_PLAY_KEY;
    }
}

/** Persist a new playback key to localStorage. */
export function setPlaybackKey(key: string): void {
    try {
        window.localStorage.setItem(PLAY_KEY_STORAGE_KEY, key);
    } catch {
        // Ignore storage write errors.
    }
}

/**
 * Registers a stable document keydown listener that calls `playFn` whenever
 * the configured playback key is pressed outside of form elements.
 */
export function usePlaybackShortcut(playFn: () => void): void {
    // Ref always points to the latest playFn — avoids re-registering the listener.
    const playRef = useRef(playFn);
    useEffect(() => {
        playRef.current = playFn;
    });

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent): void {
            // Skip when the user is typing in a form field or editable region.
            const target = event.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.tagName === "SELECT" ||
                target.isContentEditable
            ) {
                return;
            }

            // Fire if the pressed key matches the stored playback key.
            if (event.key === getPlaybackKey()) {
                event.preventDefault(); // e.g. prevent Space from scrolling the page.
                playRef.current();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []); // Register once; playRef keeps the callback fresh.
}
