'use strict';

const assert              = require('chai').assert,
      mic                 = require('mic-stream'),
    { Demodulator,
      demodulate,
      decode }            = require('./index'),
    { Writable }         = require('readable-stream'),
    { createReadStream }  = require('fs'),
      SAMPLE_RATE         = 44100;

require('fast-text-encoding');

const decodeText = new TextDecoder().decode,
      w          = new Writable();

w._write = function(chunk, encoding, next){
  console.log(decodeText(chunk.buffer));
  next();
}

class BensDemodulator extends Demodulator {
  constructor(){
    super(...arguments);
    this.previous = -1;
  }
  demodulate(frequencyData){
    const { frequencies } = this.options,
            previous      = this.previous,
            greatest      = frequencyData.slice(-1)[0][0];
    let value;
    if(greatest == frequencies[0]) value = 0;
    if(greatest == frequencies[1]) value = -1;
    if(greatest == frequencies[2]) value = 1;
    if(previous < 0 && value > -1) this.output.writeBits(value,1);
    this.previous = value;
  }
}

const WINDOW = 200;

mic({
  bitDepth: 32,
  sampleRate: SAMPLE_RATE,
  channels: 1,
})
.pipe(BensDemodulator.createTransformStream({
  frequencies: [14500, 15000, 15500],
  window:      WINDOW,
  step:        Math.round(WINDOW / 3)
}))
.pipe(decode())
.pipe(w);



