'use strict';

const { Buffer }    = require('buffer'),
      { BitStream } = require('bit-buffer'),
        Goertzel    = require('goertzeljs'),
      { Transform } = require('readable-stream'),
      { entries }   = Object,
        MAX_PACKET_DATA_SIZE = 65535;

/**
 * Demodulates audio into binary data, always pushing whole bytes.
 * At the moment, this serves more as POC than something that would be used in a production sense.
 * It uses an encoding scheme where every bit is encoded with a frequency, and a bit is always
 * preceeded by the lack of any carrier signal.  This presents a lot of overhead, essentially doubling
 * the duration of transmitting every byte, but has the advantage of avoiding problems with 
 * clock drift.  No matter the speed of the transmitter, a prolonged signal will always represent
 * a single bit until interrupted by silence.
 * 
 */
class Demodulator extends Transform {
  static createTransformStream(){
    return new this(...arguments);
  }
  constructor(options={}){
    options.bufferLength = options.bufferLength || MAX_PACKET_DATA_SIZE;
    super(options);
    this.options  = options;
    this.goertzel = new Goertzel({
      frequencies: options.frequencies || [],
      sampleRate:  options.sampleRate  || 44100
    });
    this.bitStream = new BitStream(new ArrayBuffer(options.bufferLength));
  }
  /**
   * Takes data representing the presence of frequencies and writes values to this.bitStream,
   * the output of which gets pushed through the stream.
   * 
   * This method can write write individual bits, different sized numbers, and even strings.
   * The output is handled by a BitStream, which is the output buffer.
   * 
   * Override this method to provide your own logic for demodulating a frame of audio samples.
   * 
   * A caveat to be aware of is that this.bitStream has a fixed-length that defaults to the
   * max-length of a Packet object.  If you write more data to this.bitStream than it can
   * support, the data will overflow and not be pushed through the stream.  One way around this
   * is to pass a custom length for the bitStream as an option to the demodulator.
   * @param   {array} frequencyData - A 2-dimensional array where the first item of each array is a frequency and the second is the magnitude a frequency in time within the specified window.  This data is sorted by magnitude, the frequency with the highest magnitude being last.
   * @example
   * // demodulate(frequencyData){
   * //   this.bitStream.writeUTF8String('hello');
   * // }
   */
  demodulate(frequencyData){
    
  }
  _transform(chunk, encoding, next){
    const samples            = new Float32Array(chunk.buffer),
          length             = samples.length,
          goertzel           = this.goertzel,
          demodulate         = this.demodulate.bind(this),
          bitStream          = this.bitStream,
        { windowSize, step } = this.options;
    let i=0;
    while (i < length) {
      const part  = samples.slice(i, i+windowSize);
      part.forEach(sample => goertzel.processSample(sample));
      const frequencyData = entries(goertzel.energies).sort((a,b) => a[1] - b[1]),
            value         = demodulate(frequencyData);
      goertzel.refresh(), i += step;
    }
    const numBits  = (bitStream.index instanceof Number) ? bitStream.index + 1 : bitStream.length,
          numBytes = Math.floor(numBits / 8);
    bitStream.index = 0;
    if(numBytes <= 0) return next();
    const output = bitStream.readArrayBuffer(numBytes);
    this.push(Buffer.from(output)), next();
  }
}

module.exports = Demodulator;

