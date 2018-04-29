'use strict';

const arraysByBitDepth = {};

if(typeof Int8Array    === 'function') arraysByBitDepth['8']   = Int8Array;
if(typeof Int16Array   === 'function') arraysByBitDepth['16']  = Int16Array;
if(typeof Float32Array === 'function') arraysByBitDepth['32']  = Int32Array;
if(typeof Float32Array === 'function') arraysByBitDepth['32f'] = Float32Array;
if(typeof Float64Array === 'function') arraysByBitDepth['64']  = Float64Array;

module.exports = arraysByBitDepth;

