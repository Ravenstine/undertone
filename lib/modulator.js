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
  static modulator(){
    return new Modulator(...arguments);
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
        value: options.frequency,
        ease: options.ease
      },
      sampleRate: options.sampleRate || 44100,
      amplitude: {
        value: 5,
        ease: options.ease
      }
    });
  }
  _transform(chunk, encoding, next){
    const input  = new Uint1Array(new Uint8Array(chunk).buffer),
          len    = input.length,
        { frequency, deviation, samplesPerBit } = this.options,
          output = new Float32Array((input.length * 2) * samplesPerBit),
        { oscillator } = this;
    let cursor = 0;
    input.forEach((bit, i) => {
      let n = 0;
      oscillator.changeFrequency(frequency);
      while(n<samplesPerBit) output[cursor] = oscillator.process(), n++, cursor++;
      if(bit === 1) oscillator.changeFrequency(frequency + deviation);
      if(bit === 0) oscillator.changeFrequency(frequency - deviation);
      n = 0;
      while(n<samplesPerBit) output[cursor] = oscillator.process(), n++, cursor++;
    });
    this.push(new Buffer(output.buffer));
    next();
  }
}

module.exports = Modulator;

