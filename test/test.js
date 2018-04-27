'use strict';

const assert              = require('chai').assert,
    { modulate,
      checksum,
      demodulate,
      encode,
      decode }            = require('../index'),
    { createReadStream }  = require('fs'),
    { Readable,
      Writable }          = require('stream'),
      FREQUENCIES         = [18000, 18500],
      SAMPLE_RATE         = 44100,
      SAMPLES_PER         = 35,
      WINDOW              = SAMPLES_PER,
      STEP                = WINDOW;

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
      .pipe(modulate({
        frequencies:      FREQUENCIES,
        samplesPerSymbol: SAMPLES_PER
      }))
      .pipe(demodulate({
        frequencies:     FREQUENCIES
      }))
      .pipe(decode())
      .pipe(destination);
  });
});

