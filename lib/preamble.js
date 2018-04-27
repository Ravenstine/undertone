'use strict';

const Uint1Array = require('uint1array');

/**
 * Denotes the beginning of a frame.
 * @param {ArrayBuffer} pattern - The preamble pattern to check against.
 * @property {boolean}  isValid - Indicates if the contained series of bits represents a valid preamble.
 */
class Preamble extends Uint1Array {
  constructor(pattern=0){
    const input   = new Uint1Array(pattern);
    if(pattern.byteLength === 6) debugger;
    super(input.length);
    this.sequence = input;
    this.view = new DataView(this.buffer);
  }
  /**
   * Adds valid bit sequence to the preamble array.
   */
  initialize(){
    const { length, sequence } = this;
    let i = 0;
    while(i<length) this[i] = sequence[i], i++;
  }
  /**
   * Takes a value for a bit and places it at the current index of the array.
   * @param {number} value - The value of a bit.  Either 1 or 0.   Two consecutive 1s or 0s are considered invalid, and that will automatically clear the preamble array.
   */
  push(value){
    const length    = this.length,
          lastIndex = length - 1;
    let i = 0;
    while(i<length) this[i-1] = this[i], i++;
    this[lastIndex] = value;
  }
  get isValid(){
    const { sequence } = this,
            self       = new Uint1Array(this.buffer);
    const len = this.length;
    let i = 0;
    while(i<len) {
      if(self[i] !== sequence[i]) return false;
      i++;
    }
    return true;
  }
  /**
   * Zeros out the array.
   */
  clear(){
    let i = this.length;
    while(--i) this[i] = 0;
  }
}

module.exports = Preamble;

