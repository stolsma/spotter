var NNTPClient = require('nntp'), 
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

var printer = require('sax').parser(false, {lowercasetags:true, trim:true}),
	sys = require("sys");

function entity (str) {
	return str.replace('"', '&quot;');
}

printer.tabstop = 2;
printer.level = 0;
printer.indent = function () {
	sys.print("\n");
	for (var i = this.level; i > 0; i --) {
		for (var j = this.tabstop; j > 0; j --) {
			sys.print(" ");
		}
	}
}
printer.onopentag = function (tag) {
	this.indent();
	this.level ++;
	sys.print("<"+tag.name);
	for (var i in tag.attributes) {
		sys.print(" "+i+"=\""+entity(tag.attributes[i])+"\"");
	}
	sys.print(">");
}
printer.ontext = printer.ondoctype = function (text) {
	this.indent();
	sys.print(text);
}
printer.onclosetag = function (tag) {
	this.level --;
	this.indent();
	sys.print("</"+tag+">");
}
printer.oncdata = function (data) {
	this.indent();
	sys.print(data);
}
printer.oncomment = function (comment) {
	this.indent();
	sys.print("<!--"+comment+"-->");
}
printer.onerror = function (error) {
	sys.debug(error);
	throw error;
}

//***********************************
// Do all the action
//***********************************

function doActions() {
	conn.headers('<kYHiz9Cvtmk7v4NTgADFy@spot.net>', function(e, em) {
        var msg = '';
		if (e) die(e);
		em.on('header', function(name, value) {
            if (name === "X-XML") 
                msg += value;
		});
		em.on('end', function() {
			conn.end();
			printer.write(msg);
			printer.close();
		});
	});
}