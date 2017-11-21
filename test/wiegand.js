const should = require('should');
const Wiegand = require('../');

const DATA_26_BIT_GOOD = [ 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0 ];
const DATA_26_BIT_BAD = [ 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1 ];
const DATA_34_BIT_GOOD = [ 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1 ];
const DATA_34_BIT_BAD = [ 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0 ];

describe('Wiegand', function () {
    describe('module', function () {
        it('should have exports', function () {
            Wiegand.should.be.a.Function();
            Wiegand.should.have.property('_toGpioSysPath');
            Wiegand.should.have.property('_checkParity');
        });
    });

    describe('constructor', function () {
        it('should construct', function () {
            let w = new Wiegand();
            w.should.be.an.instanceOf(Wiegand);
        });

        it('should be callable as a function', function () {
            let w = Wiegand();
            w.should.be.an.instanceOf(Wiegand);
        });

        it('should produce an object with methods', function () {
            let w = Wiegand();
            w.begin.should.be.a.Function();
            w.stop.should.be.a.Function();
            w._handleBit.should.be.a.Function();
        });
    });

    describe('Wiegand._toGpioSysPath', function () {
        it('should return a string when given a number', function () {
            Wiegand._toGpioSysPath(5).should.be.a.String();
            Wiegand._toGpioSysPath(10).should.be.a.String();
            Wiegand._toGpioSysPath(17).should.be.a.String();
        });

        it('should return a string when given a string', function () {
            Wiegand._toGpioSysPath('/foo/bar/baz').should.be.a.String();
            Wiegand._toGpioSysPath('nope').should.be.a.String();
            Wiegand._toGpioSysPath('se*3n(2j20ns@nan').should.be.a.String();
        });

        it('should return the same string when given a string', function () {
            Wiegand._toGpioSysPath('/foo/bar/baz').should.equal('/foo/bar/baz');
            Wiegand._toGpioSysPath('nope').should.equal('nope');
            Wiegand._toGpioSysPath('se*3n(2j20ns@nan').should.equal('se*3n(2j20ns@nan')
        });
    });

    describe('Wiegand._checkParity', function () {
        it('should return true when given an array with good parity', function () {
            Wiegand._checkParity([0, 1]).should.equal(true);
            Wiegand._checkParity(DATA_26_BIT_GOOD).should.equal(true);
            Wiegand._checkParity(DATA_34_BIT_GOOD).should.equal(true);
        });

        it('should return false when given an array with bad parity', function () {
            Wiegand._checkParity([1, 1]).should.equal(false);
            Wiegand._checkParity(DATA_26_BIT_BAD).should.equal(false);
            Wiegand._checkParity(DATA_34_BIT_BAD).should.equal(false);
        });
    });

    describe('Event: \'reader\'', function () {
        it('should fire when 26 bits is read in', function (done) {
            let w = new Wiegand();
            
            w.on('reader', done.bind(null, false));
            w.emit('data', DATA_26_BIT_GOOD);
        });

        it('should fire when 34 bits is read in', function (done) {
            let w = new Wiegand();
            
            w.on('reader', done.bind(null, false));
            w.emit('data', DATA_34_BIT_GOOD);
        });

        it('should not fire when 4 bits is read in', function (done) {
            let w = new Wiegand();
            let resolved = false;

            w.on('reader', function (data) {
                resolved || done(new Error('bad news'));
                resolved = true;
            });

            w.on('data', function (data) {
                resolved || done();
                resolved = true;
            });

            w.emit('data', [ 0, 1, 1, 0 ]);
        });
    });
});
