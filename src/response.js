module.exports = class Response{
    constructor({data, headers, statusCode, statusText})
    {
        this.headers = headers;
        this.data = data;
        this.statusCode = statusCode;
        this.statusText = statusText;
        
        this.json = () => {
            return JSON.parse(data);
        }

        this.text = () => {
            return data;
        }
    }
}