var fs = require('fs');
var path = require('path');
var mimetype = require('mime-types');

function anyToBase64(BufferData){
    return new Buffer(BufferData).toString('base64');
}

function Base64ToFile(base64Str, FilePath){
    let ByteData = Buffer.from(base64Str, 'base64');
    fs.writeFileSync(path.resolve(FilePath), ByteData);
}

module.exports = {anyToBase64, Base64ToFile};