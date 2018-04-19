'use strict';

const Uint1Array    = require('uint1array'),
      CRC24_INIT    = 0xb704ce,
      CRC24_POLY    = 0x1864cfb,
      CRC24_OUTMASK = 0xffffff,
      CRC24_LENGTH  = 24;

require('./data-view');

class Checksum extends Uint1Array {
  /**
   * Generate a 3-byte CRC-24 checksum.
   * @param {buffer} data
   * @returns {number}
   * @see https://pretty-rfc.herokuapp.com/RFC2440#an-implementation-of-the-crc-24-in-c
   */
  static calculate(buffer){
    let crc = CRC24_INIT,
        i   = 0;
    const data = new Uint8Array(buffer),
          len  = data.length;
    while(i<len){
      crc ^= (data[i] & 255) << 16;
      let n = 0;
      while(n < 8){
        crc <<= 1;
        if (crc & 0x1000000) crc ^= CRC24_POLY;
        n++;
      }
      i++;
    }
    return crc & CRC24_OUTMASK;
  }
  constructor() {
    super(CRC24_LENGTH);
    this.cursor = 0;
    this.view   = new DataView(this.buffer, 0, 3);
  }
  push(value){
    if(this.isFulfilled) return;
    this[this.cursor] = value;
    this.cursor++;
  }
  get isFulfilled(){
    return this.cursor === CRC24_LENGTH;
  }
  clear(){
    let i = 0;
    while(i<CRC24_LENGTH) this[i] = 0, i++;
    this.cursor = 0;
  }
  get value(){
    return this.view.getUint24(0);
  }
  set value(value){
    this.view.setUint24(0, value);
    this.cursor = CRC24_LENGTH;
  }
  verify(data){
    return this.value == Checksum.calculate(data);
  }
}

module.exports = Checksum;

