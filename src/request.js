module.exports = class Request{
    constructor({uri, method, headers, body, callback, followRedirrects})
    {
        this.uri = uri;
        this.method = method;
        this.headers = headers;
        this.body = body;
        this.callback = callback;
        this.followRedirrects = followRedirrects;
        this.redirrects = 0;
        
        this.debug = new Object();
        this.debug.Add = (name, value) => {
            this.debug[Object.keys(this.debug).length - 2] = value ? `[${name}]: ` + value : '[]: ' + name;
            this.debug.length = Object.keys(this.debug).length - 2;
        } 
        this.debug.length = 0;
    }

    toJson = () => {
        let obj = {};
        for(let i in this)
            if (typeof this[i] != 'undefined')
                obj[i] = this[i];
        delete obj.toJson;
        delete obj.Debug.Add;
        return obj;
    }
}