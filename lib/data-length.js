'use strict';

const Uint1Array       = require('uint1array'),
      DATA_LENGTH_SIZE = 16; // in bits

require('./data-view');

/**
 * Holds the expected length of the data block.
 * @property {number} value
 * @property {boolean} isFulfilled - Has ingested the max number of bits.
 */
class DataLength extends Uint1Array {
  constructor(){
    super(DATA_LENGTH_SIZE);
    this.cursor = 0;
    this.view   = new DataView(this.buffer);
  }
  /**
   * Adds a bit value to the cursor position and increments the cursor.
   * @param {number} bit
   */
  push(bit){
    if(this.isFulfilled) return;
    this[this.cursor] = bit;
    this.cursor++;
  }
  get isFulfilled(){
    return this.cursor >= DATA_LENGTH_SIZE;
  }
  get value(){
    return this.view.getUint16();
  }
  set value(value){
    this.view.setUint16(0, value);
    this.cursor = DATA_LENGTH_SIZE;
  }
  /**
   * Clears the array and resets both the cursor and end to zero.
   */
  clear(){
    let i = 0;
    while(i<DATA_LENGTH_SIZE) this[i] = 0, i++;
    this.cursor = 0;
  }
}

module.exports = DataLength;

