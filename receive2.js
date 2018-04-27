'use strict';

const assert       = require('chai').assert,
    { Demodulator,
      decoder }    = require('./index'),
      wav          = require('node-wav'),
    { createReadStream,
      readFileSync } = require('fs'),
      Speaker      = require('audio-speaker/stream'),
      Goertzel     = require('goertzeljs'),
    { Buffer }     = require('buffer'),
      FREQUENCY    = 18000,
      DEVIATION    = 500,
      SAMPLE_RATE  = 44100,
      WINDOW       = 500,
      STEP         = WINDOW / 3,
      Audio        = require('audio'),
      PREAMBLE     = Uint8Array.from([ 170, 170, 170 ]).buffer;

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
    samples.forEach(s => goertzel.processSample(s || 0));
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
    if(value > -1 && previous === -1) { 
      // process.stdout.write(`${value}`);
      return value;
    }
  }
}



const { Readable, Writable } = require('stream');

const w = new Writable();

w._write = function(chunk, encoding, next){
  debugger
  console.log('heydog');
  next();
}

const r = new Readable();

r._read = function(){
  const samples = wav.decode(readFileSync('test5.wav')).channelData.pop();
  this.push(Buffer.from(samples.buffer));
  this.push(null);
}



// const reader = new wav.Reader();

// reader.on('format', function (format) {
 
//   // the WAVE header is stripped from the output of the reader 
//   reader.pipe(BensDemodulator.createTransformStream({
//     frequency:       FREQUENCY,
//     deviation:       DEVIATION,
//     windowSize:      WINDOW,
//     step:            WINDOW
//   }))
//   .pipe(decoder({
//     preamble: PREAMBLE
//   }))
//   .pipe(w);

// });

r.pipe(BensDemodulator.createTransformStream({
  frequency:       FREQUENCY,
  deviation:       DEVIATION,
  windowSize:      WINDOW,
  step:            STEP
}))
.pipe(decoder({
  preamble: PREAMBLE
}))
.pipe(w);


// createReadStream('test2.wav').pipe(reader);

