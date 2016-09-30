Torus.classes.AFEvaluator = function(ast) {
	if(!(this instanceof Torus.classes.AFEvaluator)) {
		throw new Error('Torus.classes.AFEvaluator must be called with `new`.');
	}
	this.vars = {};
	this.ast = ast;
};

Torus.classes.AFEvaluator.func_lcase = (str) => str.toLowerCase();
Torus.classes.AFEvaluator.func_ucase = (str) => str.toUpperCase();
Torus.classes.AFEvaluator.func_length = (str) => str.length;

Torus.classes.AFEvaluator.func_specialratio = (str) => {
	let specials = 0;
	for(var i = 0; i < str.length; ++i) {
		let c = str.charAt(i),
			x = str.charCodeAt(i);
		if(
			(x < 97 || x > 122) &&
			(x < 65 || x > 90) &&
			(x < 48 || x > 57) &&
			c !== ' ' &&
			c !== '\n' &&
			c !== '\t'
		) {
			specials++;
		}
	}
	return specials / str.length;
};

Torus.classes.AFEvaluator.func_rmspecials = (str) => {
	let ret = '';
	for(var i = 0; i < str.length; ++i) {
		let x = str.charCodeAt(i);
		if(
			(x >= 97 && x <= 122) ||
			(x >= 65 && x <= 90) ||
			(x >= 48 && x <= 57)
		) {
			ret += str.charAt(i);
		}
	}
	return ret;
};

Torus.classes.AFEvaluator.func_rmdoubles = (str) => {
	let ret = '',
		last = '';
	for(var i = 0; i < str.length; ++i) {
		let c = str.charAt(i);
		if(c !== last) {
			ret += c;
		}
		last = c;
	}
	return ret;
};

Torus.classes.AFEvaluator.func_rmwhitespace = (str) => {
	var ret = '';
	for(var i = 0; i < str.length; ++i) {
		let c = str.charAt(i);
		if(c !== ' ' && c !== '\n' && c !== '\t') {
			ret += c;
		}
	}
	return ret;
};

Torus.classes.AFEvaluator.func_count = (needle, haystack) => {
	let ret = 0;
	for(var i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) {
		ret++;
	}
	return ret;
};

//Torus.classes.AFEvaluator.func_rcount = function(regex, str) {}

Torus.classes.AFEvaluator.func_contains_any = (haystack, ...needles) => {
	for(var i = 0; i < needles.length; i++) {
		if(haystack.indexOf(needles[i]) !== -1) {
			return true;
		}
	}
	return false;
};

Torus.classes.AFEvaluator.func_substr = (str, start, end) => str.substring(start, end);
Torus.classes.AFEvaluator.func_strpos = (str, find) => str.indexOf(find);
Torus.classes.AFEvaluator.func_str_replace = (str, find, replace) => {
	while(str.indexOf(find) !== -1) {
		str = str.replace(find, replace);
	}
	return str;
};

Torus.classes.AFEvaluator.func_set = (name, val) => this.vars[name] = val;
Torus.classes.AFEvaluator.func_string = (val) => val.toString();
Torus.classes.AFEvaluator.func_int = (val) => val * 1;
Torus.classes.AFEvaluator.func_bool = (val) => val == true; // jshint ignore:line

Torus.classes.AFEvaluator.func_url_encode = (str) => encodeURIComponent(str);
Torus.classes.AFEvaluator.func_strip_unicode = (str) => {
	var ret = '';
	for(var i = 0; i < str.length; ++i) {
		if(str.charCodeAt(i) < 128) {
			ret += str.charAt(i);
		}
	}
	return ret;
};

Torus.classes.AFEvaluator.func_vowel_ratio = (str) => {
	str = str.toLowerCase();
	let vowels = 0,
		consonants = 0;
	for(var i = 0; i < str.length; ++i) {
		let c = str.charAt(i),
			x = str.charCodeAt(i);
		if(c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u') {
			vowels++;
		} else if(x >= 97 && x <= 122) {
			consonants++;
		} // c >= 'a' && c <= 'z'
	}
	return vowels / consonants;
};

Torus.classes.AFEvaluator.default_vars = Torus.files.abusefilter_vars;

Torus.classes.AFEvaluator.prototype.eval = function(vars) {
	this.vars = {};
	// Notes about functions
	// 1. url_encode, strip_unicode and vowel_ratio are functions Monchoman45
	//    and aren't the part of AbuseFilter extension for MediaWiki
	// 2. rcount, rescape, norm, ccnorm are functions that are in the normal
	//	  AbuseFilter installation but not in this version.
	//    They are a TODO at this point
	Torus.util.hardmerge(this.vars, Torus.classes.AFEvaluator.default_vars);
	[
		'lcase', 'ucase', 'length', 'strlen', 'substr', 'strpos', 'str_replace',
		'specialratio', 'rmspecials', 'rmdoubles', 'rmwhitespace', 'count',
		'contains_any', 'set', 'set_var', 'string', 'int', 'bool', 'url_encode',
		'strip_unicode', 'vowel_ratio'
 	].forEach(function(el) {
		this.vars[el] = Torus.classes.AFEvaluator[`func_${el}`];
	}, this);
	if(vars) {
		Torus.util.hardmerge(this.vars, vars);
	}
	try {
		return this.ast.eval(this);
	} catch(err) {
		return undefined;
	}
};

Torus.classes.AFAST.Filter.prototype.eval = function(state) {
	var ret = false;
	for(var i = 0; i < this.statements.length; ++i) {
		ret = this.statements[i].eval(state);
	}
	return (ret == true); // jshint ignore:line
};

Torus.classes.AFAST.Assignment.prototype.eval = function(state) {
	state.vars[this.name] = this.expr.eval(state);
	return state.vars[this.name];
};
Torus.classes.AFAST.Unary.prototype.eval = function(state) {
	var op = this.operand.eval(state);
	switch(this.operator) {
		case '!': return !op;
		case '+': return op;
		case '-': return -op;
		default: state.interp_error(this, 'syntax', 'Unknown unary operator `' + this.operator + '`.');
	}
};
Torus.classes.AFAST.Math.prototype.eval = function(state) {
	var left = this.left.eval(state);
	var right = this.right.eval(state);

	switch(this.operator) {
		case '+': return left + right;
		case '-': return left - right;
		case '*': return left * right;
		case '/': return left / right;
		case '%': return left % right;
		case '**': return Math.pow(left, right);
		default: state.interp_error(this, 'syntax', 'Unknown math operator `' + this.operator + '`.');
	}
}
Torus.classes.AFAST.Comparison.prototype.eval = function(state) {
	//short circuits first
	switch(this.operator) {
		case '&': return this.left.eval(state) && this.right.eval(state);
		case '|': return this.left.eval(state) || this.right.eval(state);
	}

	//everything else needs both anyway
	var left = this.left.eval(state);
	var right = this.right.eval(state);
	switch(this.operator) {
		case '>': return left > right;
		case '>=': return left >= right;
		case '<': return left < right;
		case '<=': return left <= right;
		case '==': return left == right;
		case '^':
			if(left && !right || !left && right) {return true;}
			else {return false;}
		case '!=': return left != right;
		case 'in': return right.indexOf(left) != -1;
		case 'like': //FIXME: this is supposed to support glob patterns (eg * and ? wildcards)
		case 'contains': return left.indexOf(right) != -1;
		case 'rlike': return Torus.util.parse_regex(right).test(left);
		case 'irlike':
			var regex = Torus.util.parse_regex(right);
			regex.ignoreCase = true;
			return regex.text(left);
		default: state.interp_error(this, 'syntax', 'Unknown comparison operator `' + this.operator + '`.');
	}
}
Torus.classes.AFAST.Call.prototype.eval = function(state) {
	var func = this.operand.eval(state);
	var args = [];
	for(var i = 0; i < this.args.length; i++) {args.push(this.args[i].eval(state));}
	return func.apply(state, args);
}
Torus.classes.AFAST.Constant.prototype.eval = function(state) {return this.value;}
Torus.classes.AFAST.Variable.prototype.eval = function(state) {
	if(state.vars[this.name] === undefined) {state.interp_error(this, 'reference', 'Variable `' + this.name + '` is undefined.');}
	return state.vars[this.name];
}

Torus.classes.AFEvaluator.prototype.interp_error = function(node, error, message) {
	this.error = error;
	this.error_message = Torus.util.cap(error) + ' error on line ' + node.line + ': ' + message + '\n\n' + this.trace(node);
	throw new Error(this.error_message);
}
Torus.classes.AFEvaluator.prototype.trace = function(node) {
	var end = this.ast.full_text.indexOf('\n', node.line_start);
	if(end == -1) {end = this.ast.full_text.length;}
	var line = this.ast.full_text.substring(node.line_start, end);
	line += '\n';
	for(var i = 0; i < node.index - node.line_start - 1; i++) {
		if(line.charAt(i) == '\t') {line += '\t';}
		else {line += ' ';}
	}
	line += '^';
	return line;
}
