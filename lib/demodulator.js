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
 */
class Demodulator extends Transform {
  static demodulator(){
    return new Demodulator(...arguments);
  }
  constructor(options={}){
    super();
    this.options = options;
    this.processor = new options.signalProcessor({
      frequency: options.frequency,
      deviation: options.deviation
    });
    this.previous = -1;
  }
  /**
   * Takes samples and returns a value between -1 and 1.
   * @param {Float32Array|Array} samples - A collection of 32-bit float samples.
   * @returns {number|Promise}
   */
  process(samples){
    return this.processor.process(samples);
  }
  _transform(chunk, encoding, next){
    const input  = new Float32Array(chunk.buffer),
          length = input.length,
          output = new Uint1Array(length),
        { windowSize } = this.options;
    let i=0, cursor = 0;
    while (i < length) {
      const part  = input.slice(i, i+windowSize),
            value = this.process(part);
      if(value > -1 && this.previous === -1) output[cursor] = value, cursor++;
      this.previous = value;
      i += windowSize;
    }
    this.push(new Buffer(output.slice(0, cursor).buffer));
    next();
  }
}

module.exports = Demodulator;

