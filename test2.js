var NNTPClient = require('nntp'),
	sys = require('sys'),
	inflate = require('./inflate'),
	inspect = require('util').inspect,
	conn;

// Be lazy and always exit the process on any error
function die(e) {
	console.error(e);
	process.exit(1);
}

conn = new NNTPClient({
	host: 'newszilla.xs4all.nl'
});

conn.on('connect', function() {
  conn.auth('foo', 'bar', function(e) {
	if (e) die(e);
	doActions();
  });
});

conn.on('error', function(err) {
  console.error('Error: ' + inspect(err));
});

conn.connect();

//***********************************
// set parser
//***********************************

var xml2js = require('xml2js'),
	parser = new xml2js.Parser();
	
parser.addListener('end', function(result) {
	console.log(sys.inspect(result));
	console.log('Done.');
});

//***********************************
// Do all the action
//***********************************

function doActions() {
	conn.headers('<Di47XHxNd68mIUDTgAJ7e@spot.net>', function(e, em) {
        var msg = '',
			sig = '',		// signature over the msg using the userkey as public key
			userKey = '',
			userSig = ''; 	// signature over the userKey info using the userkey as public key
		if (e) die(e);
		em.on('header', function(name, value) {
            if (name === "X-XML") 
                msg += value;
            if (name === "X-XML-Signature") 
                sig += value;
            if (name === "X-User-Key") 
                userKey += value;
            if (name === "X-User-Signature") 
                userSig += value;
		});
		em.on('end', function() {
//			conn.end();
			parser.parseString(msg);
			parser.parseString(userKey);
			doAction2();
		});
	});
}

function doAction2() {
	var msgId = '<oshme8cqe9A.1308853657@spot.net>';
	
	conn.headers(msgId, function(e, em) {
        var msg = '';
		if (e) die(e);
		em.on('header', function(name, value) {
            msg += name + " : " + value + "\n";
		});
		em.on('end', function() {
//			conn.end();
			console.log('\n\n\n', msg);
			doAction3();
		});
	})
}

function unspecialZipStr(inp) {
	var i, buf = [], length = inp.length;
	
	for (var i=0; i<length; i++) {
		if (inp[i] == 61) {
			i++;
			if (inp[i] == 67) buf.push(10);
			else if (inp[i] == 66) buf.push(13);
			else if (inp[i] == 65) buf.push(0);
			else if (inp[i] == 68) buf.push(61);
			else {
				i--;
				buf.push(inp[i]);
			}
		} else
			buf.push(inp[i]);
	}
	return new Buffer(buf);
}

function base64Encode(unencoded) {
	return new Buffer(unencoded).toString('base64');
}

function base64Decode(encoded) {
	return new Buffer(encoded, 'base64').toString('utf8');
}
	
function doAction3() {
//	var msgId = '<oshme8cqe9A.1308853657@spot.net>';		// jpeg 50+++ groot
	var msgId = '<f81DzvswjOs.1308853585@spot.net>';		// nzb

	conn.body(msgId, function(e, em) {
		var nzb = [], total = 0, buf;
		var file = require('fs').createWriteStream('body.dmp');
		
		// voor nzb
		inflate.startBlock();
		
		if (e) die(e);
		
		em.on('line', function(line) {
 			console.log('Line length: ', line.length);
 			buf = unspecialZipStr(line);
 			console.log('Buf length compressed: ', buf.length);
			total += buf.length;
			
			buf = inflate.inflateBlock(buf);	// extra voor nzb files
 			console.log('Buf length inflated: ', buf.length);

			file.write(buf);
		});
		em.on('end', function() {
			file.end();
			conn.end();
			console.log('Totale lengte: ', total);
		});
	});
}