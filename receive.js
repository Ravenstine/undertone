'use strict';

const assert       = require('chai').assert,
    { Demodulator,
      decoder }    = require('./index'),
      MIC          = require('mic'),
      Mic          = require('node-microphone'),
      mic          = require('mic-stream'),
      pcm          = require('pcm-util'),
      Speaker      = require('audio-speaker/stream'),
      Goertzel     = require('goertzeljs'),
    { Buffer }     = require('buffer'),
      FREQUENCY    = 18000,
      DEVIATION    = 500,
      SAMPLE_RATE  = 44100,
      WINDOW       = 250,
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
    if(value > -1 && previous === -1) return value;
  }
}

const { Transform } = require('stream');

const t = new Transform({ objectMode: true });

t._transform = function(chunk, encoding, next){

  // const input = new Float32Array(chunk.buffer);
  // debugger
  const input = Float32Array.from(new Int16Array(chunk.buffer));
  // input.forEach((s,i) => s)
  this.push(Buffer.from(input.buffer));
  next();
}

const { Writable } = require('stream');

const w = new Writable();

w._write = function(chunk, encoding, next){
  debugger
  console.log('heydog');
  next();
}

const { createWriteStream } = require('fs');


const micInstance = MIC({
  bitwidth: 16,
  rate: SAMPLE_RATE,
  channels: '1',
  signed: true,
  fileType: 'raw',
  endian: 'little'
  // encoding: 'signed-integer'
});

const stream = micInstance.getAudioStream();
 
// mic().pipe(Speaker())

// mic({
//     endian: 'little',
//     bitWidth: 32,
//     channels: 1,
//     rate: SAMPLE_RATE,
//   })
//   .getAudioStream()
// mic({
//     // channels: 1,
//     // sampleRate: 44100,
//     // interleaved: false,
//     // float: false,
//     // signed: false,
//     // bitDepth: 8,
//     // byteOrder: 'LE',
//     // max: 32767,
//     // min: -32768,
//     // samplesPerFrame: 1024,
//     // id: 'S_32_LE_1_44100_I'
//   })
  // .pipe(Speaker({
  //   // channels: 1,
  //   // sampleRate: SAMPLE_RATE,
  //   // byteOrder: 'LE',
  //   // bitDepth: 32,
  //   // float: true
  // }));

stream
  .pipe(t)

  // .pipe(Speaker({
  //   channels: 1,
  //   // sampleRate: 44100,
  //   // // byteOrder: 'LE',
  //   // // bitDepth: 32,
  //   // float: true
  // }));

  // .pipe(Speaker({
  //   channels: 1,
  //   sampleRate: 44100,
  //   // byteOrder: 'LE',
  //   // bitDepth: 32,
  //   float: true
  // }));


  .pipe(BensDemodulator.createTransformStream({
    frequency:       FREQUENCY,
    deviation:       DEVIATION,
    windowSize:      WINDOW,
    step:            WINDOW
  }))
  .pipe(decoder({
    preamble: PREAMBLE
  }))

  .pipe(w);
  // .pipe(createWriteStream('what.bin'));

micInstance.start();

