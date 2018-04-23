'use strict';

const { Buffer }    = require('buffer'),
      { Transform } = require('readable-stream'),
        Uint1Array  = require('uint1array');

/**
 * Demodulates audio into binary data, always pushing whole bytes.
 * At the moment, this serves more as POC than something that would be used in a production sense.
 * It uses an encoding scheme where every bit is encoded with a frequency, and a bit is always
 * preceeded by the lack of any carrier signal.  This presents a lot of overhead, essentially doubling
 * the duration of transmitting every byte, but has the advantage of avoiding problems with 
 * clock drift.  No matter the speed of the transmitter, a prolonged signal will always represent
 * a single bit until interrupted by silence.
 * 
 */
class Demodulator extends Transform {
  static createTransformStream(){
    return new this(...arguments);
  }
  constructor(options={}){
    super(options);
    this.options = options;
  }
  /**
   * Override this method to provide your own logic for demodulating a frame of audio samples.
   * You can return any value you want, but returning `undefined` will write nothing the stream output,
   * whereas even an object or null will be coerced into the output(as a value of zero).
   * @param {array} samples - A collection of samples.
   * @returns {number}
   */
  process(samples){ 
  }
  _transform(chunk, encoding, next){
    const input  = new Float32Array(chunk.buffer),
          length = input.length,
          output = new Uint1Array(length),
        { windowSize, step } = this.options;
    let i=0, cursor = 0;
    while (i < length) {
      const part  = input.slice(i, i+windowSize),
            value = this.process(part);
      if(value !== undefined) output[cursor] = value, cursor++;
      i += step;
    }
    if(cursor > 0) this.push(new Buffer(output.slice(0, cursor).buffer));
    next();
  }
}

module.exports = Demodulator;

