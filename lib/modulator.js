'use strict';

const { keys, assign } = Object,
      { Transform }    = require('readable-stream'),
        Soundrive      = require('soundrive'),
        Uint1Array     = require('uint1array'),
      { Buffer }       = require('buffer');

/**
 * Encodes binary data to audio samples.
 * @extends stream.Transform
 */
class Modulator extends Transform {
  static createTransformStream(){
    return new this(...arguments);
  }
  /**
   * @param {object}   options
   * @param {number}   options.frequency     - The center frequency of the signal.
   * @param {number}   options.deviation     - The deviation above or below the center of the signal used to detect bits.
   * @param {number}   options.sampleRate    - The sample rate of the signal.
   * @param {number}   options.samplesPerBit - The number of samples used to encode each bit.
   * @param {number}   options.ease          - The number of samples where a sweep will occur between frequency changes.
   */
  constructor(options={}){
    super();
    this.options    = options;
    this.oscillator = new Soundrive.Oscillator({
      frequency: {
        value: options.frequency || 0,
        ease: options.ease
      },
      sampleRate: options.sampleRate || 44100,
      amplitude: {
        value: options.amplitude || 5,
        ease: options.ease
      }
    });
  }
  get frequency(){
    return this.oscillator.frequency.value;
  }
  set frequency(value){
    return this.oscillator.changeFrequency(value);
  }
  oscillate(){
    return this.oscillator.process();
  }
  process(chunk){
    const bytes = new Uint8Array(chunk),
          bits  = new Uint1Array(bytes.buffer),
        { frequency, deviation, samplesPerBit } = this.options,
          output = new Float32Array(bytes.length * 8 * samplesPerBit * 2);
    let cursor = 0;
    bits.forEach((bit, i) => {
      let n = 0;
      this.frequency = frequency;
      while(n<samplesPerBit) output[cursor] = this.oscillate(), n++, cursor++;
      if(bit === 1) this.frequency = frequency + deviation;
      if(bit === 0) this.frequency = frequency - deviation;
      n = 0;
      while(n<samplesPerBit) output[cursor] = this.oscillate(), n++, cursor++;
    });
    return output;
  }
  _transform(chunk, encoding, next){
    const output = this.process(chunk);
    this.push(new Buffer(output.buffer));
    next();
  }
}

module.exports = Modulator;

