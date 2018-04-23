'use strict';

const assert              = require('chai').assert,
    { modulator,
      Demodulator,
      encoder,
      decoder }           = require('../index'),
    { createReadStream }  = require('fs'),
    { Readable,
      Writable }          = require('stream'),
      Goertzel            = require('goertzeljs'),
      Speaker             = require('audio-speaker/stream'),
      FREQUENCY   = 18000,
      DEVIATION   = 100,
      SAMPLE_RATE = 44100,
      SAMPLES_PER = 50,
      EASE        = ((0.00225 * SAMPLES_PER) / SAMPLE_RATE),
      PREAMBLE    = Uint8Array.from([ 170, 170, 170 ]).buffer;

class BensDemodulator extends Demodulator {
  constructor(options={}){
    super(...arguments);
    const { frequency, deviation } = options;
    this.markFreq  = frequency + deviation;
    this.spaceFreq = frequency - deviation;
    this.carrier   = frequency;
    this.goertzel  = new Goertzel({
      frequencies:  [
        this.markFreq,
        this.spaceFreq,
        this.carrier
      ],
      sampleRate: options.sampleRate || 44100
    });
    this.previous = -1;
  }
  process(samples){
    const { goertzel, markFreq, spaceFreq, carrier, previous } = this;
    samples.forEach(s => goertzel.processSample(s));
    const energies = Object.entries(goertzel.energies).sort((a,b) => a[1] - b[1]),
          greatest = parseInt(energies[goertzel.frequencies.length - 1][0]);
    goertzel.refresh();
    let value;
    if(greatest == markFreq) {
      value = 1;
    } else if(greatest == spaceFreq) {
      value = 0;
    } else if(greatest == carrier) {
      value = -1;
    }
    this.previous = value;
    if(value > -1 && previous === -1) return value; 
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
      .pipe(BensDemodulator.createTransformStream({
        frequency:       FREQUENCY,
        deviation:       DEVIATION,
        windowSize:      SAMPLES_PER,
        step:            SAMPLES_PER
      }))
      .pipe(decoder({
        preamble: PREAMBLE
      }))
      .pipe(destination);
  });
});

