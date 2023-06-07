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
 * @typedef {"before" | "after" } useTime
 */

/**
 * @callback middleWareFunction
 * @param {Request} req
 * @param {Response} res
 * @param {function} next
 */

/**
 * Sents your request
 * 
 * @param {Object} options - The options of request. It also can be string
 * @param {String} options.uri - The Adress where data will be sent
 * @param {method} options.method - The Adress where data will be sent
 * @param {Object} options.headers - The headers will be sent
 * @param {*} options.body - The data will be sent
 * @param {boolean} options.followRedirrects - Will the request follow redirrects automatically?
 * @param {requestCallback} options.cb - The callback
 * 
 * @param {requestCallback} callback - The callback that handles the response.
 * 
 * @returns {Promise<Response>}
 */
async function rogans ({uri, method = 'GET', headers, body, cb, followRedirrects = true}, callback) {

    let request = new Request({uri, method, headers, body, cb, followRedirrects});

    if(arguments[0] instanceof Request) {request = arguments[0];}
    else if(typeof arguments[0] == 'string') request = new Request({uri:arguments[0], method:'GET'});

    let url = new URL(request.uri);
    let port = 80;
    let sender = http;
    if(url.protocol.toLowerCase() === 'https:')
    {
        port = 443;
        sender = https;
    }
    callback = request.callback || arguments[1] || null;

    let useBefore = rogans.uses.filter(x => x.when == 'before').map(x=>x.func);
    let i = 0;
    while(i < useBefore.length)
    {
        request.debug.Add("MIDDLEWARE", `Called middleware function #${i} before request.`)

        let stopped = true;
        let aw = () => {return new Promise(re=>{while(stopped){} re();})}
        useBefore[i](request, {}, ()=>{i++; stopped = false;})
        await aw();
    }

    let data = {
        hostname: url.host,
        path: url.pathname + url.search + url.hash,
        method: request.method.toUpperCase(),
        headers : request.headers,
        port
    }
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

// CODE TO ADD AND CLEAR MIDDLEWARE
rogans.reDefinedUses = false;
rogans.uses = [];
/**
 * Adds a middleware function
 * 
 * @param {useTime} when - Time when this middleware will be called (Before or After request)
 * @param {middleWareFunction} func  
 */
rogans.use = (when, func, name="Anonymous") => {
    rogans.uses.push({when, func, name});
}
rogans.clearUses = () => rogans.uses = [];

module.exports = rogans;

let processResponse = async (request, response, resolve, callback) => {

    let useAfter = rogans.uses.filter(x => x.when == 'after').map(x=>x.func);
    let i = 0;
    while(i < useAfter.length)
    {

        request.debug.Add("MIDDLEWARE", `Called middleware function #${i} after request.`)

        let stopped = true;
        let aw = () => {return new Promise(re=>{while(stopped){} re();})}
        useAfter[i](request, response, ()=>{i++; stopped = false;})
        await aw();
    }

    if (response.statusCode >= 300 && response.statusCode < 400 && request.followRedirrects)
    {   
        request.redirrects += 1;
        request.debug.Add('REDIRRECT', `${request.uri} → ${response.headers.location}`);

        if(request.redirrects >= 5) {
            let error = new Error('Maximum redirrects');
            error.request = request.toJson();
            throw error;
        }
        if(response.statusCode == 303) request.method = 'GET';
        let url = new URL(request.uri);
        request.uri = response.headers.location + url.search + url.hash;
        
        if(callback) return rogans(request, callback);
        return resolve(rogans(request));
    }

    for(let k in request)
            if(typeof request[k] == 'undefined')
                delete request[k]
        if(callback) return callback(request, response);
        resolve(response);
}