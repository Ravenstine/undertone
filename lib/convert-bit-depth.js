'use strict';

const { toBitDepth } = require('bitdepth'),
        ArraysByBitDepth = require('./arrays-by-bit-depth');

function convertBitDepth(input, from, to='64'){
  const outputType = ArraysByBitDepth[to];
  if(!outputType) throw new Error('Bit depth must be either 8, 16, 32, 32f, or 64');
  const outputArray = new outputType(input.length);
  toBitDepth(input, from, to, outputArray);
  return outputArray;
}

module.exports = convertBitDepth;

