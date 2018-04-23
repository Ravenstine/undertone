'use strict';

const { Transform }    = require('readable-stream'),
        Packet         = require('./packet'),
        Uint1Array     = require('uint1array'),
      { Buffer }       = require('buffer');
/**
 * Decodes packets from input bits.
 */
class Decoder extends Transform {
  static createTransformStream(){
    return new this(...arguments);
  }
  constructor(options={}){
    super();
    this.options = options;
    this.packet  = new Packet(options);
  }
  _transform(chunk, encoding, next){
    // There is a bug with Uint1Array where it will assume the wrong length
    // when given a Node.js buffer.  So first we've got to pass it to a new
    // Uint8Array to get a proper ArrayBuffer
    const bits   = new Uint1Array((new Uint8Array(chunk)).buffer),
          len    = bits.length,
          packet = this.packet;
    let i = 0;
    while(i<len){
      packet.push(bits[i]), i++;
      if(!packet.isFulfilled) continue;
      if(packet.isValid) this.push(new Buffer(packet.dataBuffer));
      packet.clear();
    }
    next();
  }
}

module.exports = Decoder;

