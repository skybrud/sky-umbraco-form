/**
 * Emulate FormData for IE9 and other non-supporting browsers
 * 
 * FormData objects provide a way to easily construct a set of key/value pairs 
 * representing form fields and their values, which can then be easily sent 
 * using the XMLHttpRequest send() method.
 * 
 * Original project: https://github.com/francois2metz/html5-formdata
 *
 * MIT License
 * (c) 2010 François de Metz
 **/
(function(w) {
    if (w.FormData)
        return;
    function FormData() {
        this.fake = true;
        this.boundary = "--------FormData" + Math.random();
        this._fields = [];
    }
    FormData.prototype.append = function(key, value) {
        this._fields.push([key, value]);
    }
    FormData.prototype.toString = function() {
        var boundary = this.boundary;
        var body = "";
        this._fields.forEach(function(field) {
            body += "--" + boundary + "\r\n";
            // file upload
            if (field[1].name) {
                var file = field[1];
                body += "Content-Disposition: form-data; name=\"" + field[0] + "\"; filename=\"" + file.name + "\"\r\n";
                body += "Content-Type: " + file.type + "\r\n\r\n";
                body += file.getAsBinary() + "\r\n";
            } else {
                body += "Content-Disposition: form-data; name=\"" + field[0] + "\";\r\n\r\n";
                body += field[1] + "\r\n";
            }
        });
        body += "--" + boundary + "--";
        return body;
    }
    w.FormData = FormData;
})(window);    