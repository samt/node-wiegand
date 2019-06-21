# wiegand

Decoder for [wiegand](https://en.wikipedia.org/wiki/Wiegand_interface) readers on GPIO.
Currently works on linux only, but can be tested on other platforms.

## requirements

* Linux with GPIO
* node-gyp

## installation

```bash
$ npm install --save wiegand
```

## running

Make sure you export your GPIO pins according to the [epoll docs](https://github.com/fivdi/epoll/blob/master/README.md):

```bash
#!/bin/sh
echo 17 > /sys/class/gpio/export
echo in > /sys/class/gpio/gpio17/direction
echo both > /sys/class/gpio/gpio17/edge
```

**Note**: If you are using the GPIO command to export, it does not automatically set the edge for you. You must do it separately:

```bash
$ gpio export 17 in
$ echo both > /sys/class/gpio/gpio17/edge
```

## usage

```js
const wiegand = require('wiegand');

const w = wiegand();

w.begin({ d0: 17, d1: 18});

w.on('data', (data) => {
    console.log('Got', data.length, 'bits from wiegand with data:', data);
});

w.on('keypad', (num) => {
    console.log('Got', num, 'from the reader\'s keypad');
});

w.on('reader', (id) => {
    console.log('Got', id, 'from RFID reader');
});

```

## api

### class: Wiegand

inherits EventEmitter

#### method: begin([options], [callback])

default options:
```js
{
    // RaspberryPI default
    d0: 17,
    d1: 18,
}
```

`callback` will fire on the `ready` event or if an error happens during the process. Errors will be emited on the `error` event.

#### method: stop([callback])

stop polling for changes to GPIO. Will callback when done and emit a `stop` event.

#### event: 'ready'

#### event: 'data'

#### event: 'error'

#### event: 'reader'

#### event: 'keypad'

#### event: 'stop'

## license

[The MIT License](https://opensource.org/licenses/MIT)
