'use strict';

const { Transform } = require('readable-stream'),
        Packet      = require('./packet'),
      { Buffer }    = require('buffer');
/**
 * Encodes data to packets.
 */
class Encoder extends Transform {
  /**
   * Another way to construct the stream transform.
   */
  static createTransformStream(){
    return new this(...arguments);
  }
  /**
   * @param {object}      options
   * @param {ArrayBuffer} options.preamble - The preamble pattern to be encoded into the packet. 
   */
  constructor(options={}){
    super();
    if(!options.preamble) throw new Error('Preamble pattern must be an ArrayBuffer.');
    this.options = options;
  }
  _transform(chunk, encoding, next){
    const packet = Packet.from(chunk, this.options);
    if(!packet.isFulfilled) throw new Error('Failed to encode packet.');
    // ^^ Unnessessary if we don't expect chunks to fulfill complete packets?
    // Can't remmber exactly why I did it this way.
    this.push(new Buffer(packet.buffer));
    next();
  }
}

module.exports = Encoder;

