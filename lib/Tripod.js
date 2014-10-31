var readline = require("readline");

exports.Tripod = Tripod;

function Tripod(opts) {
	this.opts     = opts || {};
	this.commands = {};
	this.childs   = {};

	this.opts.ctx    = this.opts.ctx || "";
	this.opts.prompt = this.opts.prompt || "> ";
	this.opts.input  = this.opts.input || process.stdin;
	this.opts.output = this.opts.output || process.stdout;
}

Tripod.prototype.define = function (command, next) {
	this.commands[command] = next;

	return this;
};

Tripod.prototype.start = function () {
	var tripod = this, type_exit = true, running_child = false;
	var iface = readline.createInterface({
		input  : this.opts.input,
		output : this.opts.output
	});
	var prompt = function () {
		var str = "";

		if (tripod.opts.ctx.length) {
			str += tripod.opts.ctx + " ";
		}

		str += tripod.opts.prompt;

		iface.setPrompt(str, str.replace(/\033\[.+?m/g, "").length);
		iface.prompt();
	};
	var check = function (line, next) {
		var p   = line.indexOf(" ");
		var cmd = (p > 0 ? line.substr(0, p) : line.substr(p + 1));

		line = (p > 0 ? line.substr(p + 1).trim() : "");

		if (!cmd.length) {
			return next();
		}

		if (cmd == "exit") {
			type_exit = false;
			return iface.close();
		}

		if (tripod.childs.hasOwnProperty(cmd)) {
			type_exit = false;
			running_child = true;
			iface.close();

			return tripod.childs[cmd].start();
		}

		if (!tripod.commands.hasOwnProperty(cmd)) {
			return next();
		}

		return tripod.commands[cmd]({
			input   : tripod.opts.input,
			output  : tripod.opts.output,
			command : cmd,
			line    : line,
			exit    : function () {
				type_exit = false;
				iface.close();
			}
		}, next);
	};

	iface.on("line", function (line) {
		check(line.trim(), prompt);
	});

	iface.on("close", function () {
		if (type_exit) {
			tripod.opts.output.write("exit\n");
		}
		if (!running_child && tripod.opts.end) {
			tripod.opts.end();
		}
	});

	return prompt();
};

Tripod.prototype.child = function (ctx) {
	ctx = ctx.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");

	var p = ctx.indexOf("/");

	if (p > 0) {
		return this.child(ctx.substr(0, p)).child(ctx.substr(p + 1));
	}

	if (!this.childs.hasOwnProperty(ctx)) {
		this.childs[ctx] = new Tripod({
			ctx    : (this.opts.ctx.length ? this.opts.ctx + "/" : "") + ctx,
			prompt : this.opts.prompt,
			input  : this.opts.input,
			output : this.opts.output,
			end    : function () {
				this.start();
			}.bind(this)
		});
	}

	return this.childs[ctx];
};
