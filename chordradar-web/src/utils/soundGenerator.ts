/**
 * Karplus-Strong synthesis for plucked string sounds.
 * Implements a physical model of a guitar string with:
 * - Waveguide delay line based on target frequency
 * - Comb filter for pick position simulation
 * - Low-pass damping for natural decay
 * - Stiffness filter for pluck attack
 * - Brightness EQ (tone shaping)
 * - Stereo panning for multi-voice chords
 *
 * The synth generates chord audio by playing multiple strings with 30ms strum timing.
 * Parameters are tuned for a realistic guitar timbre.
 */

type KarplusStrongOptions = {
    frequency?: number;
    duration?: number;
    decay?: number;
    brightness?: number;
    pickPosition?: number;
    damping?: number;
    stiffness?: number;
    gain?: number;
    stereoSpread?: number;
    filterCutoff?: number;
    pluckStrength?: number;
    pickNoise?: number;
    startTime?: number;
};

class KarplusStrongSynth {
    private readonly audioContext: AudioContext;

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
    }

    play(options: KarplusStrongOptions = {}): void {
        const {
            frequency = 440,
            duration = 3,
            decay = 0.996,
            brightness = 1.0,
            pickPosition = 0.28,
            damping = 0.35,
            stiffness = 0.22,
            gain = 0.3,
            stereoSpread = 0,
            filterCutoff = 8000,
            pluckStrength = 0.2,
            pickNoise = 0.05,
            startTime = this.audioContext.currentTime,
        } = options;

        const bufferSize = Math.max(1, Math.floor(this.audioContext.sampleRate / frequency));
        const buffer = new Float32Array(bufferSize);

        for (let index = 0; index < bufferSize; index++) {
            const position = index / bufferSize;
            const envelope = Math.max(0, 1 - Math.abs((position - pickPosition) * 2));
            const displacement = envelope * pluckStrength;
            const noise = (Math.random() * 2 - 1) * pickNoise;
            buffer[index] = displacement + noise;
        }

        const pickDelay = Math.floor(bufferSize * pickPosition);
        for (let index = 0; index < bufferSize; index++) {
            const delayed = buffer[(index + bufferSize - pickDelay) % bufferSize];
            buffer[index] = buffer[index] - delayed * 0.6;
        }

        const outputBuffer = this.audioContext.createBuffer(
            1,
            Math.floor(this.audioContext.sampleRate * duration),
            this.audioContext.sampleRate,
        );
        const output = outputBuffer.getChannelData(0);

        let index = 0;
        let previousValue = 0;

        for (let sampleIndex = 0; sampleIndex < output.length; sampleIndex++) {
            let nextValue = (buffer[index] + buffer[(index + 1) % bufferSize]) * 0.5;
            nextValue += stiffness * (buffer[index] - previousValue);
            nextValue *= decay;
            nextValue = nextValue * (1 - damping) + previousValue * damping;

            previousValue = nextValue;
            buffer[index] = nextValue;
            output[sampleIndex] = nextValue * brightness;
            index = (index + 1) % bufferSize;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = outputBuffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = gain;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterCutoff;

        const body = this.audioContext.createBiquadFilter();
        body.type = 'peaking';
        body.frequency.value = 220;
        body.Q.value = 0.7;
        body.gain.value = 3;

        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = stereoSpread;

        source.connect(filter);
        filter.connect(body);
        body.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioContext.destination);

        source.start(startTime);
    }
}

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
    sharedAudioContext ??= new AudioContext();
    return sharedAudioContext;
}

// ── Master volume ────────────────────────────────────────────────────────────

const VOLUME_STORAGE_KEY = "chordradar.volume";

/** Load persisted volume from localStorage (falls back to 1.0). */
function loadStoredVolume(): number {
    try {
        const stored = window.localStorage.getItem(VOLUME_STORAGE_KEY);
        if (stored !== null) {
            const parsed = parseFloat(stored);
            if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
                return parsed;
            }
        }
    } catch {
        // Ignore storage access errors.
    }
    return 1.0;
}

/** Current master volume multiplier (0.0 – 1.0). */
let masterVolume: number = loadStoredVolume();

/** Returns the current master volume (0.0 – 1.0). */
export function getMasterVolume(): number {
    return masterVolume;
}

/** Sets master volume (clamped to 0.0 – 1.0) and persists it to localStorage. */
export function setMasterVolume(volume: number): void {
    masterVolume = Math.max(0, Math.min(1, volume));
    try {
        window.localStorage.setItem(VOLUME_STORAGE_KEY, String(masterVolume));
    } catch {
        // Ignore storage write errors.
    }
}

export async function playMidiChord(midiNotes: readonly number[]): Promise<void> {
    if (midiNotes.length === 0) {
        return;
    }

    const audioContext = getAudioContext();
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    const synth = new KarplusStrongSynth(audioContext);
    const duration = 2;
    const decay = 0.985;
    const brightness = 1.0;
    const pickPosition = 0.28;
    const stiffness = 0.22;
    const damping = 0.35;
    const gain = 0.3 * masterVolume; // Scaled by master volume (0.0–1.0).
    const stereoSpread = -0.3;
    const filterCutoff = 10000;
    const pluckStrength = 0.2;
    const pickNoise = 0.25;
    const strumDelayMs = 25;
    const baseStartTime = audioContext.currentTime;

    midiNotes.forEach((midiNote, index) => {
        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
        const startTime = baseStartTime + (strumDelayMs * index) / 1000;

        synth.play({
            frequency,
            duration,
            decay,
            brightness,
            pickPosition,
            stiffness,
            damping,
            gain,
            stereoSpread,
            filterCutoff,
            pluckStrength,
            pickNoise,
            startTime,
        });
    });
}
