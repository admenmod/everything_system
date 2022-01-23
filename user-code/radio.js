let radio = require('radio');


radio.detectSignals // -> arr[signals.getPublicObject()]
radio.emitSignal // push signal
radio.revokeSignal // remove signal


let em = module.exports = new EventEmitter();
let allSignals = [];


em.enableTrackingOfAvailableSignals = () => {
	let signals = radio.detectSignals();
	
	for(let signal of signals) {
		if(!allSignals.some(i => i.info === signal.info)) {
			allSignals.push(signal);
			
			em.emit('detect', signal);
		};
	};
};
