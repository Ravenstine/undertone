'use strict';

const assert              = require('chai').assert,
    { modulator,
      demodulator,
      encoder,
      decoder }           = require('./index'),
    { createReadStream }  = require('fs'),
    { Readable,
      Writable }          = require('stream'),
      Goertzel            = require('./lib/signal-processors/goertzel'),
      Speaker             = require('audio-speaker/stream'),
      FREQUENCY   = 18000,
      DEVIATION   = 100,
      SAMPLE_RATE = 44100,
      SAMPLES_PER = 1000,
      EASE        = ((0.00225 * SAMPLES_PER) / SAMPLE_RATE),
      PREAMBLE    = Uint8Array.from([ 170, 170, 170 ]).buffer;

process.stdin
  .pipe(encoder({
    preamble: PREAMBLE
  }))
  .pipe(modulator({
    frequency:     FREQUENCY,
    deviation:     DEVIATION,
    samplesPerBit: SAMPLES_PER,
    ease: EASE
  }))
  .pipe(Speaker({
    channels: 1,
    sampleRate: 44100,
    byteOrder: 'LE',
    bitDepth: 32,
    float: true
  }));


