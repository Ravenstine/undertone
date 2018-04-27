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
  modulate:   Modulator.createTransformStream.bind(Modulator),
  demodulate: Demodulator.createTransformStream.bind(Demodulator),
  encode:     Encoder.createTransformStream.bind(Encoder),
  decode:     Decoder.createTransformStream.bind(Decoder),
  checksum: {
    CRC24
  }
};

