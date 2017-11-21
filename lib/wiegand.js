'use strict';

const fs = require('fs');
const util = require('util');
const EventEmitter = require('events');

const debug = require('debug')('wiegand');
const Epoll = require('./epoll').Epoll;
const TIMEOUT = parseInt(process.env.WIEGAND_TIMEOUT) || 20;

/**
 * @emits keypad
 * @emits reader
 */
function Wiegand() {
    if (!(this instanceof Wiegand)) {
        debug('not called with new, returning instance');
        return new Wiegand();
    }

    this.data = [];
    this.gpio = { d0: 17, d1: 18 };
    this.timeout = null;

    this._fd0 = null;
    this._fd1 = null;
    this._poll0 = null;
    this._poll1 = null;

    EventEmitter.call(this);

    this.on('data', (data) => {
        switch (data.length) {
        case 4:
            this.emit('keypad', parseInt(data.join(''), 2));
            break;
        case 26:
        case 34:
            if (Wiegand._checkParity(data)) {
                data.shift();
                data.pop();

                this.emit('reader', parseInt(data.join(''), 2));
            }
            break;
        }
    });
}

util.inherits(Wiegand, EventEmitter);

/**
 * Get the /sys/ path from either GPIO pin number or given path
 * 
 * @param {String|Number} gpio 
 * @return {String} path to GPIO pin values
 */
Wiegand._toGpioSysPath = function (gpio) {
    return parseInt(gpio) ? `/sys/class/gpio/gpio${gpio}/value` : gpio;
};

/**
 * Check Parity (static)
 * 
 * @param {*} data 
 * @return {boolean}
 */
Wiegand._checkParity = function (data) {
    let evenParity = data.slice(0, data.length / 2);
    let oddParity = data.slice(data.length / 2);

    let fn = (a) => a;

    if (evenParity.filter(fn).length & 1) {
        return false;
    }

    if (!(oddParity.filter(fn).length & 1)) {
        return false;
    }

    return true;
};

/**
 * Begin receiving wiegand transmissions
 * 
 * @emits ready
 * @emits error
 * 
 * @param {Object} options 
 * @param {Function} callback 
 */
Wiegand.prototype.begin = function (options, callback) {
    if (typeof options == 'function') {
        debug('#begin() - first arg is a function');
        callback = options;
    }
    
    if (typeof options != 'object') {
        debug('#begin() - second arg is not an object or undefined');
        options = {};
    }

    if (typeof callback != 'function') {
        debug('#begin() - no callback provided');        
        callback = null;
    }

    callback && this.once('ready', callback);
    callback && this.once('callback', callback);

    this.gpio.d0 = options.d0 || this.gpio.d0;
    this.gpio.d1 = options.d1 || this.gpio.d1;

    debug('#begin() - d0:', Wiegand._toGpioSysPath(this.gpio.d0));            
    debug('#begin() - d1:', Wiegand._toGpioSysPath(this.gpio.d1));            

    // sync methods below because it's eaiser to deal with at startup
    process.nextTick(this._listenToGpio.bind(this));
};

/**
 * Stop receiving wiegand transmissions
 * 
 * @param {Function} callback 
 */
Wiegand.prototype.stop = function (callback) {
    this._poll0.remove(this._fd0).close();
    this._poll1.remove(this._fd1).close();

    callback && this.once('stop', callback);
    this.emit('stop');
};

/**
 * Handle the bit coming in, closure
 * 
 * @emits data
 * @param {Number} dataln
 * @return {Function}
 */
Wiegand.prototype._handleBit = function (dataln) {
    let buf = Buffer.alloc(1);

    return (err, fd, events) => {
        clearTimeout(this.timeout);

        fs.readSync(fd, buf, 0, 1, 0);

        if (parseInt(buf.toString())) {
            this.data.push(dataln);
        }

        this.timeout = setTimeout(() => {
            this.emit('data', this.data.slice());
            this.data = [];
        }, TIMEOUT);
    }
};

/**
 * Attempt to listen to GPIO
 * 
 * @param {Function} callback
 */
Wiegand.prototype._listenToGpio = function (callback) {
    try {
        // sync methods below because it's eaiser to deal with at startup
        this._fd0 = fs.openSync(Wiegand._toGpioSysPath(this.gpio.d0), 'r');
        this._fd1 = fs.openSync(Wiegand._toGpioSysPath(this.gpio.d1), 'r');
    }
    catch (err) {
        debug('#begin() - could not open a file, did you remember to export?');
        return this.emit('error', err);
    }

    this._poll0 = new Epoll(this._handleBit(0));
    this._poll1 = new Epoll(this._handleBit(1));

    // begin polling
    this._poll0.add(this._fd0, Epoll.EPOLLPRI);
    this._poll1.add(this._fd1, Epoll.EPOLLPRI);

    // should be good to go
    this.emit('ready', null);
    this.off('error', callback);
};

module.exports = Wiegand;
