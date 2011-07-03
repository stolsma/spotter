/*
  This test exercises JSInflate.inflateStream using node and writestreams. While the compressed data needs to be kept in memory, the uncompressed data is streamed out to a file.
*/

var fs = require('fs');
var JSInflate = require('./inflate');

var compressedBlob = fs.readFileSync('body.dmp');
var uncompressedBlob = JSInflate.inflate(compressedBlob);

var file = require('fs').createWriteStream('body.nzb');
file.write(uncompressedBlob);
file.end();
