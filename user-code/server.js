let fs = require('fs');
let gui = require('gui');
let radio = require('radio');
let network = require('network');


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
	console.log('server: ', signal.info);
	console.log('server:Info ', info);
//	seyText('[server]detect: '+signal.info.name);
});


setTimeout(() => {
	let signalId = radio.emitSignal({
		verify: key => key === 'dddddd',
		info: { name: 'server', key: 'dddddd' },
		data: { key: 'важная инфа' }
	});
	
	seyText('server emit', 3000);
	
	
	setTimeout(() => {
		console.log(radio.detectSignals());
		
		radio.revokeSignal(signalId);
		
		console.log(radio.detectSignals());
		
		seyText('server revoke', 2000);
	}, 4000);
}, 3000);




/*
let validateList = ['unit'];
let reg = new Map();

let accessPoint = network.enableAccessPoint();

accessPoint.on('connecting', (allow, deny, { name, uuid }) => {
	allow();
});

accessPoint.on('connect', connection => {
	console.log('22l connection', connection);
	
	connection.send('hi');
});

accessPoint.on('disconnect', connection => {
	console.log('droped', connection);
});

accessPoint.on('accept', (data, connection) => {
	console.log('unit > server', data);
	
	if(data === 'hi') connection.send('drop');
	if(data === 'drop') connection.close();
});
//*/
