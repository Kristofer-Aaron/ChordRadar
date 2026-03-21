


function PlayChord(notes)
{
	const ctx = new AudioContext();
    const synth = new KarplusStrongSynth(ctx);
    duration = 2;
    decay = 0.985;
    brightness = 1.0;
    pickPosition = 0.28;
	stiffness = 0.22;
    damping = 0.35;
    gain = 0.3;
    stereoSpread = -0.3;
    filterCutoff = 10000;
	pluckStrength = 0.2;
	pickNoise = 0.25;
    
	strumdelay = 30;		//milisec


    for (let i = 0; i < notes.length; i++) 
    {
		setTimeout(function() { 
		if(notes[i][0] != "x")
		{
			const midiNote = NoteUtilities.getMidiNote(notes[i][0], notes[i][1]);
			const frequency = NoteUtilities.getFrequency(midiNote);
			synth.play({
				frequency: frequency,
				duration: duration,
				decay: decay,
				brightness: brightness,
				pickPosition: pickPosition,
				stiffness: stiffness,
				damping: damping,
				gain: gain,
				stereoSpread: stereoSpread,
				filterCutoff: filterCutoff,
				pluckStrength: pluckStrength,
	  			pickNoise: pickNoise
			});
		}
		else
		{

		}

		}, strumdelay * i); 
    }
}

class KarplusStrongSynth {
  constructor(audioContext) {
    this.ctx = audioContext;
  }

  play(options = {}) {
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
	  pickNoise = 0.25

    } = options;

    const bufferSize = Math.floor(this.ctx.sampleRate / frequency);
    let buffer = new Float32Array(bufferSize);



	for (let i = 0; i < bufferSize; i++) {

	const pos = i / bufferSize;

	// string displacement
	const envelope = Math.max(0, 1 - Math.abs((pos - pickPosition) * 2));

	const displacement = envelope * pluckStrength;

	// small pick noise
	const noise = (Math.random() * 2 - 1) * pickNoise;

	buffer[i] = displacement + noise;
	}

    // pick position comb filter
    const pickDelay = Math.floor(bufferSize * pickPosition);
    for (let i = 0; i < bufferSize; i++) {
      const delayed = buffer[(i + bufferSize - pickDelay) % bufferSize];
      buffer[i] = buffer[i] - delayed * 0.6;
    }

    const outputBuffer = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * duration,
      this.ctx.sampleRate
    );

    const output = outputBuffer.getChannelData(0);

    let index = 0;
    let prev = 0;

    for (let i = 0; i < output.length; i++) {

      let next =
        (buffer[index] + buffer[(index + 1) % bufferSize]) * 0.5;

      // string stiffness (adds metallic overtones)
      next += stiffness * (buffer[index] - prev);

      // damping
      next = next * decay;

      // gentle loop lowpass
      next = next * (1 - damping) + prev * damping;

      prev = next;
      buffer[index] = next;

      output[i] = next * brightness;

      index = (index + 1) % bufferSize;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = outputBuffer;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = gain;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterCutoff;

    // lighter body resonance
    const body = this.ctx.createBiquadFilter();
    body.type = "peaking";
    body.frequency.value = 220;
    body.Q.value = 0.7;
    body.gain.value = 3;

    const panner = this.ctx.createStereoPanner();
    panner.pan.value = stereoSpread;

    source.connect(filter);
    filter.connect(body);
    body.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.ctx.destination);

    source.start();
  }
}



/*
class KarplusStrongSynth {
  constructor(audioContext) {
    this.ctx = audioContext;
  }

  play(options = {}) {
    const {
      frequency = 440,
      duration = 3,
      decay = 0.985,
      brightness = 0.6,
      noiseLevel = 1.0,
      pickPosition = 0.4,
      damping = 0.6,
      gain = 0.3,
      stereoSpread = 0,
      filterCutoff = 4500
    } = options;

    const bufferSize = Math.floor(this.ctx.sampleRate / frequency);
    let buffer = new Float32Array(bufferSize);

    // --- softer excitation (pink-ish noise) ---
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = (Math.random() * 2 - 1) * noiseLevel;
      last = (last + white) * 0.5; // lowpass noise
      buffer[i] = last;
    }

    // --- pick position comb filter ---
    const pickDelay = Math.floor(bufferSize * pickPosition);
    for (let i = 0; i < bufferSize; i++) {
      const delayed = buffer[(i + bufferSize - pickDelay) % bufferSize];
      buffer[i] = buffer[i] - delayed * 0.7;
    }

    const outputBuffer = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * duration,
      this.ctx.sampleRate
    );

    const output = outputBuffer.getChannelData(0);

    let index = 0;
    let prev = 0;

    for (let i = 0; i < output.length; i++) {

      // basic KS averaging
      let next =
        (buffer[index] + buffer[(index + 1) % bufferSize]) * 0.5;

      // stronger damping = warmer
      next = next * decay;

      // simple lowpass loop filter
      next = (next * (1 - damping)) + (prev * damping);
      prev = next;

      buffer[index] = next;

      output[i] = next * brightness;

      index = (index + 1) % bufferSize;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = outputBuffer;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = gain;

    // softer tone filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterCutoff;
    filter.Q.value = 0.7;

    // guitar body resonance
    const body = this.ctx.createBiquadFilter();
    body.type = "bandpass";
    body.frequency.value = 180;
    body.Q.value = 0.8;

    const panner = this.ctx.createStereoPanner();
    panner.pan.value = stereoSpread;

    source.connect(filter);
    filter.connect(body);
    body.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.ctx.destination);

    source.start();
  }
}*/


/*class KarplusStrongSynth {
  constructor(audioContext) {
    this.ctx = audioContext;
  }

  play(options = {}) {
    const {
      frequency = 440,
      duration = 3,
      decay = 0.98,
      brightness = 0.5,
      noiseLevel = 1.0,
      pickPosition = 0.5,
      damping = 0.5,
      gain = 0.3,
      stereoSpread = 0,
      oversample = 1,
      filterCutoff = 8000
    } = options;

    const bufferSize = Math.floor(this.ctx.sampleRate / frequency);
    let buffer = new Float32Array(bufferSize);

    // Initial noise burst
    for (let i = 0; i < bufferSize; i++) {
      buffer[i] = (Math.random() * 2 - 1) * noiseLevel;
    }

    // --- PICK POSITION IMPLEMENTATION ---
    const pickDelay = Math.floor(bufferSize * pickPosition);

    for (let i = 0; i < bufferSize; i++) {
      const delayed = buffer[(i + bufferSize - pickDelay) % bufferSize];
      buffer[i] = buffer[i] - delayed;
    }
    // ------------------------------------

    const outputBuffer = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * duration,
      this.ctx.sampleRate
    );

    const output = outputBuffer.getChannelData(0);

    let index = 0;

    for (let i = 0; i < output.length; i++) {
      const next =
        (buffer[index] + buffer[(index + 1) % bufferSize]) * 0.5;

      const filtered =
        next * decay * (1 - damping) +
        buffer[index] * damping;

      buffer[index] = filtered;

      output[i] = filtered * brightness;

      index = (index + 1) % bufferSize;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = outputBuffer;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = gain;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterCutoff;

    const panner = this.ctx.createStereoPanner();
    panner.pan.value = stereoSpread;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.ctx.destination);

    source.start();
  }
}
*/
/*class KarplusStrongSynth {
    constructor(audioContext) {
      this.ctx = audioContext;
    }
  
    play(options = {}) {
      const {
        frequency = 440,
        duration = 3,
        decay = 0.98,
        brightness = 0.5,
        noiseLevel = 1.0,
        pickPosition = 0.5,
        damping = 0.5,
        gain = 0.3,
        stereoSpread = 0,
        oversample = 1,
        filterCutoff = 8000
      } = options;
      
      const bufferSize = Math.floor(this.ctx.sampleRate / frequency);
  
      let buffer = new Float32Array(bufferSize);
  
      // Initial noise burst (the "pluck")
      for (let i = 0; i < bufferSize; i++) {
        buffer[i] = (Math.random() * 2 - 1) * noiseLevel;
      }
  
      const outputBuffer = this.ctx.createBuffer(
        1,
        this.ctx.sampleRate * duration,
        this.ctx.sampleRate
      );
  
      const output = outputBuffer.getChannelData(0);
  
      let index = 0;
  
      for (let i = 0; i < output.length; i++) {
        const next =
          (buffer[index] + buffer[(index + 1) % bufferSize]) * 0.5;
  
        const filtered =
          next * decay * (1 - damping) +
          buffer[index] * damping;
  
        buffer[index] = filtered;
  
        output[i] = filtered * brightness;
  
        index = (index + 1) % bufferSize;
      }
  
      const source = this.ctx.createBufferSource();
      source.buffer = outputBuffer;
  
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = gain;
  
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = filterCutoff;
  
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = stereoSpread;
  
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(this.ctx.destination);
  
      source.start();
    }
  }*/


