module.exports = class Request{
    constructor({uri, method, headers, body, callback})
    {
        this.uri = uri;
        this.method = method;
        this.headers = headers;
        this.body = body;
        this.callback = callback;
        this.redirrects = 0;

        this.Debug = new Object();
        this.Debug.Add = (name, value) => {
            this.Debug[Object.keys(this.Debug).length - 2] = value ? `[${name}]: ` + value : '[]: ' + name;
            this.Debug.length = Object.keys(this.Debug).length - 2;
        } 
        this.Debug.length = 0;
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