var Tripod = require("..").Tripod;
var tripod = new Tripod();

tripod.define("list", function ($, next) {
	$.output.write("a list..\n");

	return next();
});

tripod.child("sub").define("quit", function ($, next) {
	$.output.write("quiting sub..\n");
	$.exit();
});

tripod.child("sub").child("foo");

tripod.child("sub/foo").define("bar", function ($, next) {
	$.output.write("fooing..\n");

	setTimeout(function () {
		$.output.write("ok\n");
		$.exit();
	}, 5000);
});

tripod.start();
