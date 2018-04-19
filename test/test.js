'use strict';

const assert              = require('chai').assert,
    { modulator,
      demodulator,
      encoder,
      decoder }           = require('../index'),
    { createReadStream }  = require('fs'),
    { Readable,
      Writable }          = require('stream'),
      Goertzel            = require('../lib/signal-processors/goertzel'),
      Speaker             = require('audio-speaker/stream'),
      FREQUENCY   = 18000,
      DEVIATION   = 100,
      SAMPLE_RATE = 44100,
      SAMPLES_PER = 50,
      EASE        = ((0.00225 * SAMPLES_PER) / SAMPLE_RATE),
      PREAMBLE    = Uint8Array.from([ 170, 170, 170 ]).buffer;

describe('undertone', function(){
  it('encodes and decodes an audio signal', function(done){
    const source      = new Readable(),
          destination = new Writable();
    source._read = function(){
      this.push('hello world');
      this.push(null);
    }
    destination._write = function(chunk, encoding, next){
      const output = String.fromCharCode.apply(null, new Uint8Array(chunk.buffer));
      assert.equal(output, 'hello world');
      next(), done();
    };
    source
      .pipe(encoder({
        preamble: PREAMBLE
      }))
      .pipe(modulator({
        frequency:     FREQUENCY,
        deviation:     DEVIATION,
        samplesPerBit: SAMPLES_PER,
        ease: EASE
      }))
      .pipe(demodulator({
        signalProcessor: Goertzel,
        frequency:       FREQUENCY,
        deviation:       DEVIATION,
        windowSize:      SAMPLES_PER
      }))
      .pipe(decoder({
        preamble: PREAMBLE
      }))
      .pipe(destination);
  });
});

