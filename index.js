'use strict';

const Modulator   = require('./lib/modulator'),
      Demodulator = require('./lib/demodulator'),
      Encoder     = require('./lib/encoder'),
      Decoder     = require('./lib/decoder'),
      Checksum    = require('./lib/checksum'),
      CRC24       = require('./lib/crc/24.js');

module.exports = {
  Modulator,
  Demodulator,
  Encoder,
  Decoder,
  Checksum,
  modulator:   Modulator.createTransformStream.bind(Modulator),
  demodulator: Demodulator.createTransformStream.bind(Demodulator),
  encoder:     Encoder.createTransformStream.bind(Encoder),
  decoder:     Decoder.createTransformStream.bind(Decoder),
  checksum: {
    CRC24
  }
};

