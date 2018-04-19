'use strict';
const { keys, 
        assign,
        entries }          = Object,
        Goertzel           = require('goertzeljs'),
      { floatToIntSample } = Goertzel.Utilities;

class GoertzelProcessor {
  constructor(options={}){
    this.options  = options;
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
  }
  process(samples){
    const { goertzel, markFreq, spaceFreq, carrier } = this;
    samples.forEach(s => goertzel.processSample( floatToIntSample(s) ));
    const energies = entries(goertzel.energies).sort((a,b) => a[1] - b[1]),
          greatest = parseInt(energies[this.goertzel.frequencies.length - 1][0]);
    let value;
    if(greatest == markFreq) {
      value = 1;
    } else if(greatest == spaceFreq) {
      value = 0;
    } else if(greatest == carrier) {
      value = -1;
    }
    goertzel.refresh();
    return value;
  }
}

module.exports = GoertzelProcessor;

