'use strict';

const assert              = require('chai').assert,
    { modulate,
      checksum,
      demodulate,
      encode,
      decode }            = require('../index'),
    { createReadStream }  = require('fs'),
    { Readable,
      Writable }          = require('stream');


describe('undertone', function(){
  it('encodes and decodes an audio signal', function(done){
    const source      = new Readable(),
          destination = new Writable();
    source._read = function(){
      this.push('hello world');
      this.push(null);
    };
    destination._write = function(chunk, encoding, next){
      const output = String.fromCharCode.apply(null, new Uint8Array(chunk.buffer));
      assert.equal(output, 'hello world');
      done(), next();
    };
    source
      .pipe(encode())
      .pipe(modulate())
      .pipe(demodulate())
      .pipe(decode())
      .pipe(destination);
  });
});

