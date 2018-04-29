Undertone
=========

Simple, composable audio signal encoding & decoding with Node.js streams.

## Goals

- Make it simple to build custom signal codecs.
- Support for both the browser and Node.js

## Usage

The stream transforms can work with no configuration, relying on some basic defaults.  This provides very basic, unsophisticated FSK between two frequencies that represent 1s and 0s.  The decoder simply waits for the preamble(a syncword used to indicate the beginning of a message) and captures data without an integrity check.

In the following example, `send.js` modulates the string "hello world" into an audio signal, and `receive.js` demodulates the signal back into a string.

```javascript
// send.js
const { modulate,
        encode }   = require('undertone'),
        speaker    = require('audio-speaker/stream'), // npm install --save audio-speaker
      { Readable } = require('readable-stream');
        source     = new Readable();

source._read = function(){
  this.push('hello world');
  this.push(null);
}

source
  .pipe(encode())
  .pipe(modulate())
  .pipe(speaker({
    channels: 1,
    sampleRate: 44100,
    float: true
  }));
```

```javascript
// receive.js
const { demodulate,
        decode }    = require('undertone'),
        mic         = require('mic'), // npm install --save mic
      { Writable }  = require('readable-stream');
        destination = new Writable();

destination._write = function(chunk, encoding, next){
  const output = String.fromCharCode.apply(null, new Uint8Array(chunk.buffer));
  console.log(output);
  next();
}

mic({
  channels: 1,
  rate: 44100,
  encoding: 'floating-point' // This is important, assuming you're using sox/rec.
}).getAudioStream()
  .pipe(demodulate())
  .pipe(decode())
  .pipe(destination);
```

## Testing

The tests use Mocha w/ Chai.  To perform them, simply run `npm run test`.

## License

See [LICENSE.txt](LICENSE.txt).

