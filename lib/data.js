'use strict';

const Uint1Array      = require('uint1array'),
      MAX_DATA_LENGTH = 12176;

require('fast-text-encoding');

/**
 * Represents the data block inside a packet.
 * @property {boolean} isFulfilled - Indicates if the cursor has reached the end, or that we've got all the data we are expecting.
 */
class Data extends Uint1Array {
  constructor(){
    super(MAX_DATA_LENGTH);
    this.cursor = 0, this.end = -1;
  }
  /**
   * Adds a bit value to the cursor position and increments the cursor.
   * @param {number} value
   */
  push(value){
    if(this.isFulfilled) return;
    this[this.cursor] = value;
    this.cursor++;
  }
  get isFulfilled(){
    return this.end > -1 && this.cursor >= this.end;
  }
  /**
   * Clears the array and resets both the cursor and end to zero.
   */
  clear(){
    const len = this.end;
    let i = 0;
    while(i<len) this[i] = 0, i++;
    this.cursor = 0, this.end = -1;
  }
  toBuffer(){
    return this.slice(0, this.end).buffer;
  }
  toString(){
    return (new TextDecoder()).decode(this.toBuffer());
  }
}

module.exports = Data;

