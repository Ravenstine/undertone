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
  modulator: Modulator.modulator,
  demodulator: Demodulator.demodulator,
  encoder: Encoder.encoder,
  decoder: Decoder.decoder
};

