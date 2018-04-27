'use strict';

const { Transform } = require('readable-stream'),
        Packet      = require('./packet'),
      { Buffer }    = require('buffer');
/**
 * Encodes data into packets.  Each chunk of data it receives will be encoded into a packet, so be sure chunks represent complete units of data the receiver can capture incrementally.
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
   * @param {Checksum=}   options.checksum - A checksum routine to verify data integrity.
   */
  constructor(options={}){
    super();
    this.options = options;
  }
  _transform(chunk, encoding, next){
    const packet = Packet.from(chunk, this.options);
    if(!packet.isFulfilled || !packet.isValid) throw new Error('Failed to encode packet.');
    this.push(new Buffer(packet.buffer));
    next();
  }
}

module.exports = Encoder;

