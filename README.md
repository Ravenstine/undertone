Undertone
=========

Simple, composable audio signal encoding & decoding with Node.js streams.

## Usage

This is a hypothetical example.  This library is int his early days so everything may change drastically.

```javascript
const { modulator,
        demodulator,
        encoder, 
        decoder }           = require('undertone'),
      { createReadStream,
        createWriteStream } = require('fs'),
      { Transform }         = require('stream');
        Goertzel            = require('./lib/signal-processors/goertzel'),
        FREQUENCY   = 18000,
        DEVIATION   = 100,
        SAMPLE_RATE = 44100,
        SAMPLES_PER = 50,
        EASE        = ((0.00225 * SAMPLES_PER) / SAMPLE_RATE),
        PREAMBLE    = Uint8Array.from([ 170, 170, 170 ]).buffer;

const source      = new Readable(),
      destination = new Writable();

source._read = function(){
  this.push('Ping');
  this.push(null);
}

const t = new Transform();
t._transform = function(chunk, encoding, next){
  const data = chunk.toString();
  if(data.match(/Ping/)) this.push('Pong');
  next();
};

createReadStream('inputsamples.bin')
  .pipe(demodulator({
    signalProcessor: Goertzel,
    frequency:       FREQUENCY,
    deviation:       DEVIATION,
    windowSize:      SAMPLES_PER
  }))
  .pipe(decoder({
    preamble: PREAMBLE
  }))
  .pipe(t)
  .pipe(encoder({
    preamble: PREAMBLE
  }))
  .pipe(modulator({
    frequency:     FREQUENCY,
    deviation:     DEVIATION,
    samplesPerBit: SAMPLES_PER,
    ease: EASE
  }))
  .pipe(createWriteStream('outputsamples.bin');
```

## Testing

There is a working test that runs all the components.  To perform it, simply run `npm run test`.

## License

See [LICENSE.txt](LICENSE.txt).

