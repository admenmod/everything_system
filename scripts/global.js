'use strict';
let G = new function() {
	cvs.addEventListener('dblclick', e => cvs.requestFullscreen());
	
	let environment = this.environment = {
		radarsSignals: [],
		accessPointsSignals: []
	};
	
	
};