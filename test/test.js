'use strict';

const assert              = require('chai').assert,
    { modulator,
      checksum,
      Demodulator,
      encoder,
      decoder }           = require('../index'),
    { CRC24 }             = checksum,
    { createReadStream }  = require('fs'),
    { Readable,
      Writable }          = require('stream'),
      FREQUENCY           = 18000,
      DEVIATION           = 100,
      SAMPLE_RATE         = 44100,
      SAMPLES_PER         = 35,
      WINDOW              = SAMPLES_PER,
      STEP                = Math.round(WINDOW * 0.33),
      EASE                = ((0.00225 * SAMPLES_PER) / SAMPLE_RATE),
      PREAMBLE            = Uint8Array.from([ 170, 170, 170 ]).buffer;

class BensDemodulator extends Demodulator {
  constructor(options={}){
    const { frequency, deviation } = options,
          markFreq  = frequency + deviation,
          spaceFreq = frequency - deviation,
          carrier   = frequency;
    options.frequencies = [markFreq, spaceFreq, carrier];
    super(options);
    this.markFreq       = markFreq;
    this.spaceFreq      = spaceFreq;
    this.carrier        = carrier;
    this.frequencyCount = 3;
    this.previous       = -1;
  }
  demodulate(frequencyData){
    const { markFreq, spaceFreq, carrier, previous } = this,
            greatest = parseInt(frequencyData[this.frequencyCount- 1][0]);
    let value;
    if(greatest == markFreq) {
      value = 1;
    } else if(greatest == spaceFreq) {
      value = 0;
    } else if(greatest == carrier) {
      value = -1;
    }
    this.previous = value;
    if(value > -1 && previous === -1) this.bitStream.writeBits(value, 1);
  }
}

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
      .pipe(encoder({
        preamble: PREAMBLE,
        checksum: CRC24
      }))
      .pipe(modulator({
        frequency:        FREQUENCY,
        deviation:        DEVIATION,
        samplesPerSymbol: SAMPLES_PER,
        ease: EASE
      }))
      .pipe(BensDemodulator.createTransformStream({
        frequency:       FREQUENCY,
        deviation:       DEVIATION,
        windowSize:      WINDOW,
        step:            STEP
      }))
      .pipe(decoder({
        preamble: PREAMBLE,
        checksum: CRC24
      }))
      .pipe(destination);
  });
});

