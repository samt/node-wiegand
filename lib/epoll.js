'use strict';

const debug = require('debug')('wiegand:epoll');

try {
    debug('trying native epoll module');
    module.exports = require('epoll');    
}
catch (err) {
    debug('could not register epoll module, falling back to shim');

    function Epoll(fn) {}
    
    Epoll.prototype.add = function () { return this };
    Epoll.prototype.remove = function () { return this };
    Epoll.prototype.close = function () { return this };

    Epoll.EPOLLIN = 0x001;  // file is available for read opts
    Epoll.EPOLLPRI = 0x002; // exceptional condition in file descriptor
    Epoll.EPOLLOUT = 0x004; // file is available for write opts
    Epoll.EPOLLERR = 0x008; // error condition
    Epoll.EPOLLHUP = 0x010; // hang up event
    Epoll.EPOLLRDHUP = 0x020; // stream socket peer closed connection
    Epoll.EPOLLRDNORM = 0x040;
    Epoll.EPOLLRDBAND = 0x080;
    Epoll.EPOLLWRNORM = 0x100;
    Epoll.EPOLLWRBAND = 0x200;
    Epoll.EPOLLMSG = 0x400;
    Epoll.EPOLLONESHOT = 0x800; // Sets the one-shot behavior for the associated file descriptor.
    Epoll.EPOLLET = (1 << 31); // sets the Edge Triggered behavior for the associated file descriptor

    module.exports = Epoll;
}
