'use strict';

const { Buffer }         = require('buffer'),
      { BitStream }      = require('bit-buffer'),
        Goertzel         = require('goertzeljs'),
      { Transform }      = require('readable-stream'),
        ArraysByBitDepth = require('./arrays-by-bit-depth'),
      { entries }        = Object,
      { MAX_DATA_LENGTH,
        DEFAULT_WINDOW,
        DEFAULT_SAMPLE_RATE,
        DEFAULT_BIT_DEPTH,
        DEFAULT_FREQUENCIES } = require('./shared-constants');

/**
 * Demodulates audio into binary data, always pushing whole bytes.
 * At the moment, this serves more as POC than something that would be used in a production sense.
 * It uses an encoding scheme where every bit is encoded with a frequency, and a bit is always
 * preceeded by the lack of any carrier signal.  This presents a lot of overhead, essentially doubling
 * the duration of transmitting every byte, but has the advantage of avoiding problems with 
 * clock drift.  No matter the speed of the transmitter, a prolonged signal will always represent
 * a single bit until interrupted by silence.
 */
class Demodulator extends Transform {
  static createTransformStream(){
    return new this(...arguments);
  }
  constructor(options={}){
    options.bufferLength = options.bufferLength || MAX_DATA_LENGTH;
    super(options);
    options.frequencies = options.frequencies   || DEFAULT_FREQUENCIES;
    options.sampleRate  = options.sampleRate    || DEFAULT_SAMPLE_RATE;
    options.window      = options.window        || DEFAULT_WINDOW;
    options.step        = options.step          || options.window;
    options.bitDepth    = options.bitDepth      || DEFAULT_BIT_DEPTH;
    this.arrayType      = ArraysByBitDepth[options.bitDepth];
    if(!this.arrayType) throw new Error('Unsupported bit depth.');
    this.options  = options;
    this.goertzel = new Goertzel({
      frequencies: options.frequencies,
      sampleRate:  options.sampleRate
    });
    this.output = new BitStream(new ArrayBuffer(options.bufferLength));
  }
  /**
   * Takes data representing the presence of frequencies and writes values to this.output,
   * the output of which gets pushed through the stream.
   * 
   * This method can write write individual bits, different sized numbers, and even strings.
   * The output is handled by a BitStream, which is the output buffer.
   * 
   * Override this method to provide your own logic for demodulating a frame of audio samples.
   * 
   * A caveat to be aware of is that this.output has a fixed-length that defaults to the
   * max-length of a Packet object.  If you write more data to this.output than it can
   * support, the data will overflow and not be pushed through the stream.  One way around this
   * is to pass a custom length for the bitStream as an option to the demodulator.
   * @param   {array} frequencyData - A 2-dimensional array where the first item of each array is a frequency and the second is the magnitude a frequency in time within the specified window.  This data is sorted by magnitude, the frequency with the highest magnitude being last.
   * @example
   * // demodulate(frequencyData){
   * //   this.output.writeUTF8String('hello');
   * // }
   */
  demodulate(frequencyData){
    // 🛠️ Extend me!
    const { frequencies } = this.options,
            greatest      = frequencyData.slice(-1)[0][0];
    if(greatest == frequencies[0]) this.output.writeBits(0,1);
    if(greatest == frequencies[1]) this.output.writeBits(1,1);
  }
  _transform(chunk, encoding, next){
    const samples            = new this.arrayType(chunk.buffer),
          length             = samples.length,
          goertzel           = this.goertzel,
          demodulate         = this.demodulate.bind(this),
          bitStream          = this.output,
        { window, step }     = this.options;
    let i=0;
    while (i < length) {
      const part  = samples.slice(i, i+window);
      part.forEach(sample => goertzel.processSample(sample));
      const frequencyData = entries(goertzel.energies).sort((a,b) => a[1] - b[1]),
            value         = demodulate(frequencyData);
      goertzel.refresh(), i += step;
    }
    const numBits  = (typeof bitStream.index === 'number') ? bitStream.index + 1 : bitStream.length,
          numBytes = Math.floor(numBits / 8);
    bitStream.index = 0;
    if(numBytes <= 0) return next();
    const output = bitStream.readArrayBuffer(numBytes);
    this.push(Buffer.from(output)), next();
  }
}

module.exports = Demodulator;

