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
  static encoder(){
    return new Encoder(...arguments);
  }
  /**
   * @param {object}      options
   * @param {ArrayBuffer} options.preamble - The preamble pattern to be encoded into the packet. 
   */
  constructor(options={}){
    super();
    if(!options.preamble) throw new Error("Preamble pattern must be an ArrayBuffer.");
    this.options = options;
  }
  _transform(chunk, encoding, next){
    debugger
    const packet = Packet.from(chunk, this.options);
    if(!packet.isValid) throw new Error("Failed to encode packet.");
    this.push(new Buffer(packet.buffer));
    next();
  }
}

module.exports = Encoder;

