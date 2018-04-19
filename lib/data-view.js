DataView.prototype.setUint24 = function(pos, val) {
  this.setUint16(pos, val >> 8);
  this.setUint8(pos+2, val & ~4294967040); // this "magic number" masks off the first 16 bits
}

DataView.prototype.getUint24 = function(byteOffset, littleEndian){
  var b = new Uint8Array(this.buffer, this.byteOffset + byteOffset);
  return littleEndian ? (b[0] | (b[1] << 8) | (b[2] << 16)) : (b[2] | (b[1] << 8) | (b[0] << 16));
};

