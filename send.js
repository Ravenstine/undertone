'use strict';

const assert              = require('chai').assert,
    { Demodulator,
      Modulator,
      modulate,
      encode }            = require('./index'),
      Speaker             = require('audio-speaker/stream'),
    { createWriteStream } = require('fs'),
      SAMPLE_RATE = 44100;

class BensModulator extends Modulator {
  willModulate(value){
    const { frequencies } = this.options,
            modulate      = this.modulate.bind(this);
    modulate(0, frequencies[1]);
    if(value === 0) modulate(0, frequencies[0]);
    if(value === 1) modulate(0, frequencies[2]);
  }
}

process.stdin
  .pipe(encode())
  .pipe(BensModulator.createTransformStream({
    frequencies: [14500, 15000, 15500],
    samplesPerSymbol: 500,
    amplitude: 5
  }))
  .pipe(Speaker({
    channels: 1,
    sampleRate: SAMPLE_RATE,
    float: true
  }));
      
