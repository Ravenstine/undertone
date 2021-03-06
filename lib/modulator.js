'use strict';

const { keys, assign }        = Object,
      { Transform }           = require('readable-stream'),
      { Mixer, 
        Oscillator }          = require('soundrive'),
        Uint1Array            = require('uint1array'),
        convertBitDepth       = require('./convert-bit-depth'),
        ArraysByBitDepth      = require('./arrays-by-bit-depth'),
      { Buffer }              = require('buffer'),
      { DEFAULT_SAMPLES_PER_SYMBOL,
        DEFAULT_SWEEP,
        DEFAULT_BIT_DEPTH,
        DEFAULT_SAMPLE_RATE,
        DEFAULT_FREQUENCIES } = require('./shared-constants');

/**
 * Encodes data to audio samples by modulating one or more oscillators.
 * @extends stream.Transform
 */
class Modulator extends Transform {
  static createTransformStream(){
    return new this(...arguments);
  }
  /**
   * @param {object}       options
   * @param {array}        options.frequencies      - Frequencies used to encode a signal.
   * @param {string='32f'} options.bitDepth         - The bit-depth to output.  Defaults to 32f.
   * @param {number}       options.sampleRate       - The sample rate of the signal.
   * @param {number}       options.samplesPerSymbol - The number of samples used to encode each symbol.
   * @param {number}       options.sweep            - The number of samples where a sweep will occur between frequency changes.
   */
  constructor(options={}){
    super();
    this.options     = options;
    this.mixer       = new Mixer();
    this.oscillators = this.mixer.sources;
    options.bitDepth         = options.bitDepth         || DEFAULT_BIT_DEPTH;
    options.frequencies      = options.frequencies      || DEFAULT_FREQUENCIES;
    options.samplesPerSymbol = options.samplesPerSymbol || DEFAULT_SAMPLES_PER_SYMBOL;
    this.addOscillator({
      frequency:  options.frequencies[0],
      sampleRate: options.sampleRate,
      amplitude:  options.amplitude,
      sweep:      options.sweep || options.ease
    });
  }
  /**
   * A hook for modulating the oscillator.  Override to provide your own encoding logic.
   * The built-in function does extremely basic encoding, modulating bits into two distinct frequencies.
   * @param {*} value - A value or set of values to be used to modulate the signal.
   */
  willModulate(value){
    // 🛠️ Extend me!
    const { frequencies } = this.options,
            modulate      = this.modulate.bind(this);
    if(value === 1) modulate(0, frequencies[1]);
    if(value === 0) modulate(0, frequencies[0]);
  }
  /**
   * Adds an oscillator to the modulator.  Takes an options object or an Oscillator instance directly.
   * @param   {object|Oscillator} options
   * @param   {number} options.frequency  - The starting frequency of the oscillator.  Defaults to 0.
   * @param   {number} options.sampleRate - The sample rate of the oscillator.  Defaults to 44100.
   * @param   {number} options.amplitude  - The stating amplitude of the oscillator.  Defalts to 1.
   * @param   {number} options.sweep      - The amount of sweep or "ease" between frequency and amplitude changes.  1 means full-sweep and 0 means no sweep.  Defaults to 0.001 to prevent noise artifacts.
   * @returns {Soundrive.Oscillator}
   */
  addOscillator(options={}){
    const mixer      = this.mixer;
    let oscillator;
    if(options.constructor === Oscillator) {
      oscillator = options;
    } else {
      oscillator = Oscillator.create({
        frequency: {
          value: options.frequency || 0,
          ease:  options.sweep     || DEFAULT_SWEEP
        },
        sampleRate: options.sampleRate || DEFAULT_SAMPLE_RATE,
        amplitude: {
          value: options.amplitude || 1,
          ease:  options.sweep     || DEFAULT_SWEEP
        }
      });
    }
    this.mixer.mix(oscillator);
    return oscillator;
  }
  /**
   * Removes an oscillator from the modulator.
   * @param {number|Soundrive.Oscillator} oscillator - An oscillator object or the index of an oscillator to be removed. 
   */
  removeOscillator(oscillator){
    const mixer   = this.mixer,
          sources = mixer.sources;
    let index;
    if(oscillator > -1) {
      index = oscillator;
    } else {
      index = sources.indexOf(oscillator);
    }
    mixer.sources.splice(index, 1);
  }
  /**
   * Perform an oscillation for the specified samplesPerSymbol, writing
   * samples to `this.samples`.  Always use this method to render samples
   * after you have modulated the signal(i.e. changed the frequency
   * of an oscillator).
   */
  oscillate(){
    const samples            = this.samples,
          mixer              = this.mixer,
        { samplesPerSymbol } = this.options;
    let n = 0;
    while(n<samplesPerSymbol) samples[this.cursor] = mixer.process(), n++, this.cursor++;
  }
  /**
   * Modulates the frequency of an oscillator.
   * @param {number|Soundrive.Oscillator} oscillator - An oscillator index or object to be modulated.
   * @param {number} frequency - A target frequency to modulate to.
   * @param {number} amplitude - A target amplitude to modulate to.
   */
  modulate(oscillator, frequency, amplitude){
    if(oscillator > -1) oscillator = this.oscillators[oscillator];
    if(frequency)       oscillator.changeFrequency(frequency);
    if(amplitude)       oscillator.changeAmplitude(frequency);
    this.oscillate();
  }
  /**
   * Preprocess input chunks into a format that the modulator
   * will iterate over.  Built-in function will return an
   * array representing bits.  You can override this function to return
   * anything that is iterable, so long as it's something 
   * that willModulate() will understand.
   * 
   * Yes, you can even return a string if that's what floats
   * your boat.
   * 
   * Why not just do this in willModulate?  Well, _transform()
   * needs to know the number of individual symbols being encoded
   * in order to output the right number of audio samples.
   * 
   * @param {Uint8Array} bytes
   */
  preprocess(bytes){
    return new Uint1Array(bytes.buffer);
  }
  _transform(chunk, encoding, next){
    const bytes        = new Uint8Array(chunk),
          symbols      = this.preprocess(bytes),
          len          = symbols.length,
        { frequency, 
          deviation, 
          samplesPerSymbol, 
          bitDepth }   = this.options,
          samples      = new Float32Array(len * samplesPerSymbol * 2),
          willModulate = this.willModulate.bind(this);
    this.samples = samples;
    this.cursor  = 0;
    let i = 0;
    while(i<len) willModulate(symbols[i]), i++;
    const output = (bitDepth == '32f' || bitDepth == '32') ? samples : convertBitDepth(samples, '32f', bitDepth);
    // 👆 Don't write a new array of converted bit depths if our samples already match the bit depth specified.
    //    We're going with 32 bit depth because 64 bit input from mic hardware doesn't seem common. 
    this.push(new Buffer(output.buffer)), next();
  }
}

module.exports = Modulator;

