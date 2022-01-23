let fs = require('fs');
let gui = require('gui');
let radio = require('radio');


let seyText = (text, time = 0) => gui.sey((ctx, pos) => {
	ctx.save();
	ctx.font = '15px arkhip, monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	
	let m = ctx.measureText(text);
	let pw = m.width/2 + 10;
	let ph = 15;
	
	ctx.globalAlpha = 0.5;
	ctx.fillStyle = '#222222';
	ctx.fillRect(pos.x-pw, pos.y-ph - 20, pw*2, ph*2);
	ctx.strokeStyle = '#eeaaff';
	ctx.strokeRect(pos.x-pw, pos.y-ph - 20, pw*2, ph*2);
	
	ctx.globalAlpha = 1;
	ctx.fillStyle = '#eeeeee';
	ctx.fillText(text, pos.x, pos.y-20);
	ctx.restore();
}, time);



radio.on('detect', (signal, info) => {
	console.log('unit: ', signal.info);
	console.log('unit:Info ', info);
	seyText('unit detect: '+signal.info.name, 3000);
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
