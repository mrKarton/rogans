let https = require('https');
let http = require('http');

let Request = require('./request');
let Response = require('./response');

/**
 * The function that called when request got some data
 *
 * @callback requestCallback
 * @param {Request} req
 * @param {Response} res
 */

/**
 * @typedef {"GET" | "POST" | "PUT"} method
 */

/**
 * Sents your request
 * 
 * @param {Object} options - The options of request. It also can be string
 * @param {String} options.uri - The Adress where data will be sent
 * @param {method} options.method - The Adress where data will be sent
 * @param {Object} options.headers - The headers will be sent
 * @param {*} options.body - The data will be sent
 * @param {requestCallback} options.cb - The callback
 * 
 * @param {requestCallback} callback - The callback that handles the response.
 * 
 * @returns {Promise<Response>}
 */
async function rogans ({uri, method, headers, body, cb}, callback) {
    let request = new Request({uri, method, headers, body, cb});

    if(arguments[0] instanceof Request) {request = arguments[0];}
    else if(typeof arguments[0] == 'string') request = new Request({uri:arguments[0], method:'GET'});

    let url = new URL(request.uri);
    let port = 80;
    let sender = http;
    if(url.protocol.toLowerCase() == 'https')
    {
        port = 443;
        sender = https;
    }
    
    callback = request.callback || arguments[1] || null;

    let data = {
        hostname: url.host,
        path: url.pathname + url.search + url.hash,
        method: request.method.toUpperCase(),
        headers : request.headers,
        port
    }
    console.log(data);
    if(data.headers?.host)
        delete data.headers.host;

    
    return new Promise(resolve => {
        let rq = sender.request(data, r=>{
            let dataStr = '';
            r.on('data', d=>{
               dataStr += d.toString();
            })
            r.on('end', () => {
                request.headers = JSON.parse(JSON.stringify(rq.getHeaders()));
                
                let response = new Response({
                    data: dataStr,
                    headers:r.headers,
                    statusCode : r.statusCode,
                    statusText : r.statusText
                })

                processResponse(request, response, resolve, callback);
            });
            r.on('error', (err) => {throw err});
        }).end();
    })
}

module.exports = rogans;

let processResponse = (request, response, resolve, callback) => {

    console.log(response.headers);

    if(response.statusCode >= 200 && response.statusCode < 300)
    {
        for(let k in request)
            if(typeof request[k] == 'undefined')
                delete request[k]
        if(callback) return callback(request, response);
        resolve(response);
    }

    else if (response.statusCode >= 300 && response.statusCode < 400)
    {   
        request.redirrects += 1;
        request.Debug.Add('REDIRRECT', `${request.uri} → ${response.headers.location}`);

        if(request.redirrects >= 5) {
            let error = new Error('Maximum redirrects');
            error.request = request.toJson();
            throw error;
        }
        if(response.statusCode == 303) request.method = 'GET';
        request.uri = response.headers.location;
        
        if(callback) return rogans(request, callback);
        resolve(rogans(request));
    }
}