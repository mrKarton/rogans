let lib = require('./src');

lib({
    uri:'https://google.com',
    // followRedirrects:false,
    method: 'GET'
}, console.log);

