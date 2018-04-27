'use strict';

const assert              = require('chai').assert,
    { modulator,
      encoder}            = require('./index'),
      Speaker             = require('audio-speaker/stream'),
      FREQUENCY   = 18000,
      DEVIATION   = 500,
      SAMPLE_RATE = 44100,
      SAMPLES_PER = 500,
      EASE        = ((0.00225 * SAMPLES_PER) / SAMPLE_RATE),
      wav         = require('wav'),
      fs          = require('fs'),
      PREAMBLE    = Uint8Array.from([ 170, 170, 170 ]).buffer;

process.stdin
  .pipe(encoder({
    preamble: PREAMBLE
  }))
  .pipe(modulator({
    frequency:     FREQUENCY,
    deviation:     DEVIATION,
    samplesPerBit: SAMPLES_PER,
    ease:          EASE,
    amplitude:     8
  }))
  // .pipe(new wav.Writer({
  //   channels: 1,
  //   bitDepth: 32,
  //   sampleRate: SAMPLE_RATE,
  //   endianness: 'little'
  // }))
  .pipe(fs.createWriteStream('out.bin'));
  // .pipe(Speaker({
  //   channels: 1,
  //   sampleRate: SAMPLE_RATE,
  //   // byteOrder: 'LE',
  //   // bitDepth: 32,
  //   float: true
  // }));

