'use strict';

const assert              = require('chai').assert,
    { modulate,
      checksum,
      demodulate,
      encode,
      decode }            = require('../index'),
    { createReadStream }  = require('fs'),
    { Readable,
      Transform,
      Writable }          = require('stream');

describe('ping pong', function(){
  it('sends and receives', function(done){
    const source      = new Readable(),
          t           = new Transform(),
          destination = new Writable();
    source._read = function(){
      this.push('Ping');
      this.push(null);
    };
    t._transform = function(chunk, encoding, next){
      const output = String.fromCharCode.apply(null, new Uint8Array(chunk.buffer));
      if(output.match(/Ping/)) this.push('Pong');
    }
    destination._write = function(chunk, encoding, next){
      const output = String.fromCharCode.apply(null, new Uint8Array(chunk.buffer));
      assert.equal(output, 'Pong');
      done(), next();
    };
    source
      .pipe(encode())
      .pipe(modulate())
      .pipe(demodulate())
      .pipe(decode())
      .pipe(t)
      .pipe(encode())
      .pipe(modulate())
      .pipe(demodulate())
      .pipe(decode())
      .pipe(destination);

  });

});

