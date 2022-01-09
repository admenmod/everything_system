let fs = require('fs');
let gui = require('gui');
let radio = require('radio');


let seyText = text => gui.sey((ctx, pos) => {
	ctx.font = '15px Arial';
	ctx.fillStyle = '#ffffff';
	ctx.fillText(text, pos.x, pos.y);
}, 3000);


radio.on('detect', (signal, info) => {
	console.log('unit: ', signal);
	console.log('unit:Info ', info);
	seyText('[server]detect: '+signal.info.name);
});



/*
let network = require('network');
let sci  = require('sci');

let signal = network.detectAccessPoint().find(i => i.sourceName === 'server');


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


sci.execute('move');
sci.movementTarget.set(4, 55);
sci.attackTarget = vec2(10, 20);



sci.on('updata', e => {
	sci.execute('move', vec2(10, 20));
});

console.log(sci);
//*/
