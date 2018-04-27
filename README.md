Undertone
=========

Simple, composable audio signal encoding & decoding with Node.js streams.

## Usage

The stream transforms can work with no configuration, relying on some basic defaults.

This example waits to receive a packet containing a string with the word "Ping" and encodes a responding packet with the word "Pong": 

```javascript
const { modulate,
        demodulate,
        encode, 
        decode }           = require('undertone'),
      { createReadStream,
        createWriteStream } = require('fs'),
      { Transform }         = require('stream');

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
  .pipe(demodulate())
  .pipe(decode())
  .pipe(t)
  .pipe(encode())
  .pipe(modulate())
  .pipe(createWriteStream('outputsamples.bin');
```

## Testing

There is a working test that runs all the components.  To perform it, simply run `npm run test`.

## License

See [LICENSE.txt](LICENSE.txt).

