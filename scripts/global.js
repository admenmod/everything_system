'use strict';
let G = new function() {
	let print = this.print = function(a) {
		console.log(a);
	};
	
	print('private');
};