'use strict';

const Uint1Array    = require('uint1array'),
    { Buffer }      = require('buffer'),
      Preamble      = require('./preamble'),
      DataLength    = require('./data-length'),
      Data          = require('./data'),
      Checksum      = require('./checksum'),
      isArrayBuffer = require('is-array-buffer');

require('fast-text-encoding');

/**
 * Represents an entire data packet.  
 * Its job is to recognize a preamble pattern in a series of bits, capture data and verify its integrity
 * @param {object}         options
 * @param {object}         options.preamble - Preamble options
 * @property {ArrayBuffer} dataBuffer       - A buffer of the data portion.
 * @property {Arraybuffer} buffer           - A buffer of the entire packet. 
 * @property {boolean}     isFulfilled      - Indicates if the packet is complete.
 * @property {boolean}     isValid          - Indicates if the packet is fulfilled and if the data is intact.
 */
class Packet {
  /**
   * Creates a packet from the given data.
   * @param {ArrayBuffer|Buffer|string} input - The data to be encoded. 
   * @param {object}      options
   * @param {ArrayBuffer} options.preamble - A preamble to encode into the packet, used to delimit frames. 
   */
  static from(input, options){
    const packet = new Packet(options);
    packet.preamble.initialize();
    let buffer;
    if(typeof input === 'string') buffer = (new TextEncoder()).encode(input);
    if(Buffer.isBuffer(input))    buffer = Uint8Array.from(input).buffer;
    if(isArrayBuffer(input))      buffer = input;
    if(!buffer) throw 'Argument must be a string, Buffer, or ArrayBuffer.';
    const length = buffer.byteLength;
    packet.dataLength.clear();
    packet.dataLength.value = length;
    const bits = new Uint1Array(buffer);
    bits.forEach(bit => packet.push(bit));
    // In the future, the checksum should include the entire packet except the preamble
    packet.checksum.value = Checksum.calculate(buffer);
    return packet;
  }
  constructor(options={}){
    this.preamble    = new Preamble(options.preamble);
    this.dataLength  = new DataLength();
    this.data        = new Data();
    this.checksum    = new Checksum();
  }
  /**
   * Takes a bit and pushes it into parts of the packet that haven't been fulfilled.
   * @param {number} bit - A bit value.
   */
  push(bit){
    const { preamble }   = this;
    // Keep pushing bytes into the preamble array until it becomes valid
    if(!preamble.isValid)       return preamble.push(bit);
    const { dataLength } = this;
    if(!dataLength.isFulfilled) return dataLength.push(bit);
    const { data }       = this;
    data.end = dataLength.value * 8;
    if(!data.isFulfilled)       return data.push(bit);
    const { checksum }   = this;
    if(!checksum.isFulfilled)   return checksum.push(bit);
  }
  get isFulfilled(){
    return this.dataLength.isFulfilled && this.data.isFulfilled && this.checksum.isFulfilled;
  }
  get isValid(){
    return this.checksum.verify(this.dataBuffer);
  }
  /**
   * Clears out the packet for re-use.
   */
  clear(){
    // It's faster to zero-out our arrays than to create new arrays.
    this.preamble.clear(), this.dataLength.clear(), this.data.clear(), this.checksum.clear();
  }
  get buffer(){
    const data = new Uint1Array(this.dataBuffer);
    return new Uint1Array([
      ...this.preamble,
      ...this.dataLength,
      ...data,
      ...this.checksum
    ]).buffer;
  }
  get dataBuffer(){
    const dataLength = this.dataLength,
          data       = this.data;
    if(dataLength.isFulfilled && data.isFulfilled) return data.toBuffer();
    return (new Uint1Array(0)).buffer;
  }
  toString(){
    return String.fromCharCode.apply(null,new Uint8Array(this.buffer));
  }
}

module.exports = Packet;

