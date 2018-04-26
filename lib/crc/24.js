'use strict';

const Checksum      = require('../checksum'),
      CRC24_INIT    = 0xb704ce,
      CRC24_POLY    = 0x1864cfb,
      CRC24_OUTMASK = 0xffffff,
      CRC24_LENGTH  = 24,
      CRC24_BYTES   = 3;

require('../data-view');

/**
 * A checksum subclass that implements CRC24.
 * @extends Checksum
 */
class CRC24 extends Checksum {
  /**
   * Generate a 3-byte CRC-24 checksum.
   * @param   {ArrayBuffer} buffer
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
    this.view = new DataView(this.buffer, 0, CRC24_BYTES);
  }
  get value(){
    return this.view.getUint24(0);
  }
  set value(value){
    this.view.setUint24(0, value);
    this.cursor = CRC24_LENGTH;
  }
}

module.exports = CRC24;

