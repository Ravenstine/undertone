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
  it('sends and receives multiple packets', function(done){
    const source       = new Readable(),
          destination  = new Writable(),
          strings      = [ 'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog', null ],
          expectations = [].concat(strings);
    source._read = function(){
      this.push(strings.shift());
    };
    destination._write = function(chunk, encoding, next){
      const output = String.fromCharCode.apply(null, new Uint8Array(chunk.buffer));
      assert.equal(output, expectations.shift());
      next();
    };
    source
      .pipe(encode())
      .pipe(modulate())
      .pipe(demodulate())
      .pipe(decode())
      .pipe(destination)
      .on('finish', function(){
        done();
      });
  });
  it('ignores packets with different preamble', function(done){
    const preamble    = Uint8Array.from([1,2,3,4,5,6]).buffer,
          source1     = new Readable(),
          source2     = new Readable(),
          encoder     = encode({ preamble }),
          decoder     = decode({ preamble }),
          destination = new Writable();
    source1._read = function(){
      this.push('hello world');
      this.push(null);
    };
    source2._read = function(){
      this.push('goodbye world');
      this.push(null);
    }
    destination._write = function(chunk, encoding, next){
      const output = String.fromCharCode.apply(null, new Uint8Array(chunk.buffer));
      assert.notEqual(output, 'hello world');
      assert.equal(output, 'goodbye world');
      next();
    };
    source1
      .pipe(encode())
      .pipe(modulate())
      .pipe(demodulate())
      .pipe(decoder)
      .pipe(destination);
    source2
      .pipe(encoder)
      .pipe(modulate())
      .pipe(demodulate())
      .pipe(decoder)
      .pipe(destination)
      .on('finish', () => done());
  });
});

