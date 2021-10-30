let network = require('network');
let system  = require('system');

let si = system.getSystemInterface();
let signal = network.detectAccessPoint().find(i => i.sourceName === 'server');

/*
if(signal) {
	network.connect(signal, connection => {
		connection.on('accept', data => {
			console.log('server > unit', data);
			
			if(data === 'hi') connection.send('hi');
			if(data === 'drop') {
				console.log('unit: drooop');
				connection.close();
			};
		});
	}, err => console.log(err));
};
*/


si.on('updata', e => {
	e.make('move', vec2(10, 20));
});

console.log(si);

