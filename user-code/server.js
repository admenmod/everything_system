let fs = require('fs');
let gui = require('gui');
let radio = require('radio');
let network = require('network');


let seyText = text => gui.sey((ctx, pos) => {
	ctx.font = '15px Arial';
	ctx.fillStyle = '#ffffff';
	ctx.fillText(text, pos.x, pos.y);
}, 3000);


radio.on('detect', (signal, info) => {
	console.log('server: ', signal);
	console.log('server:Info ', info);
//	seyText('[server]detect: '+signal.info.name);
});


setTimeout(() => {
	radio.emitSignal({
		verification: key => key === 'dddddd',
		info: { name: 'server', key: 'dddddd' },
		data: { key: 'dddddd' }
	});
	
	seyText('server emit');
}, 5000);


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
