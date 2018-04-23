'use strict';

const Modulator   = require('./lib/modulator'),
      Demodulator = require('./lib/demodulator'),
      Encoder     = require('./lib/encoder'),
      Decoder     = require('./lib/decoder');

module.exports = {
  Modulator,
  Demodulator,
  Encoder,
  Decoder,
  modulator:   Modulator.createTransformStream.bind(Modulator),
  demodulator: Demodulator.createTransformStream.bind(Demodulator),
  encoder:     Encoder.createTransformStream.bind(Encoder),
  decoder:     Decoder.createTransformStream.bind(Decoder)
};

