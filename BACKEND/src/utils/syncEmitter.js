const EventEmitter = require('events');

const syncEmitter = new EventEmitter();

/** Call this whenever a product or stock is mutated to push SSE updates to clients. */
const notifyCatalogUpdate = () => syncEmitter.emit('update');

module.exports = { syncEmitter, notifyCatalogUpdate };
