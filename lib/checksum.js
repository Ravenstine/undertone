'use strict';

const Uint1Array = require('uint1array');

/**
 * A base object to implement a checksum routine for verifying packet integrity.
 * Subclass it and write a custom calculate function, as seen below.  The constructor
 * should also be extended and a fixed-length should be passed to `super`.  You must
 * also implement the `value` getter and setter.  Comments below will direct you to
 * what functions/methods you will need to extend.
 * @extends Uint1Array
 * @property {*} value - A useful representation of the data stored in the checksum array.  By default, this computed property returns nothing.
 */
class Checksum extends Uint1Array {
  /**
   * @param {number} length - The length in bits of the checksum.
   */
  constructor(length=0) {
    super(length);
    this.cursor = 0;
  }
  /**
   * Generate a checksum from the given data.
   * The built-in function does nothing and returns undefined.
   * Extend it with your own checksum routine.
   * @param {ArrayBuffer} buffer
   */
  static calculate(buffer){
    // 🛠️ Extend me!
  }
  push(value){
    if(this.isFulfilled) return;
    this[this.cursor] = value;
    this.cursor++;
  }
  get isFulfilled(){
    return this.cursor === this.length;
  }
  /**
   * Clears and rewinds the checksum array.
   */
  clear(){
    const length = this.length;
    let i = 0;
    while(i<length) this[i] = 0, i++;
    this.cursor = 0;
  }
  get value(){
    // 🛠️ Extend me!
  }
  set value(value){
    // 🛠️ Extend me!
    this.cursor = this.length;  
    // 👆 your subclass will either need to call this.super.value() or implement this same line.
  }
  /**
   * Runs the input through calculate() and compares it with the `value` computed property.
   * @returns {boolean}
   */
  verify(data){
    return this.value == this.constructor.calculate(data);
  }
}

module.exports = Checksum;

