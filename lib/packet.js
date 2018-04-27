'use strict';

const Uint1Array      = require('uint1array'),
    { Buffer }        = require('buffer'),
      Preamble        = require('./preamble'),
      DataLength      = require('./data-length'),
      Data            = require('./data'),
      Checksum        = require('./checksum'),
      isArrayBuffer   = require('is-array-buffer'),
    { MAX_DATA_SIZE } = require('./shared-constants');

require('fast-text-encoding');

/**
 * Encapsulates data for sending.
 * When receiving data, the job of this class is to recognize a preamble pattern, capture data, and verify its integrity.
 * @param    {object}      options
 * @param    {object}      options.preamble - Preamble options
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
   * @example
   * // Packet.from('hello world', { preamble: Uint8Array.from([7,7,7]).buffer });
   */
  static from(input, options){
    const packet   = new Packet(options),
          checksum = packet.checksum;
    packet.preamble.initialize();
    let buffer;
    if(typeof input === 'string') buffer = (new TextEncoder()).encode(input);
    if(Buffer.isBuffer(input))    buffer = Uint8Array.from(input).buffer;
    if(isArrayBuffer(input))      buffer = input;
    if(!buffer) throw new Error('Argument must be a string, Buffer, or ArrayBuffer.');
    const length = buffer.byteLength;
    if(length > MAX_DATA_SIZE)
      throw new Error(`Data exceeds maximum possible packet size of ${MAX_DATA_SIZE} bytes.`);
    packet.dataLength.clear();
    packet.dataLength.value = length;
    const bits = new Uint1Array(buffer);
    bits.forEach(bit => packet.push(bit));
    checksum.value = checksum.constructor.calculate(buffer);
    return packet;
  }
  /**
   * @param {object} options
   * @param {ArrayBuffer=}  options.preamble - A byte pattern to signify the start of the packet.  Defaults to 24 alternating bits, assuming that you will usually want a preamble.
   * @param {Checksum=}     options.checksum - A checksum routine used to verify the integrity of packet data.  Use a sublclass of Checksum.
   */
  constructor(options={}){
    const defaultPreamble = Uint8Array.from([ 170, 170, 170 ]).buffer;
    this.preamble         = new Preamble(options.preamble || defaultPreamble);
    this.dataLength       = new DataLength();
    this.data             = new Data();
    this.checksum         = new (options.checksum || Checksum)();
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

