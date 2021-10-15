let network = require('network');

/*
let validateList = ['unit'];
let reg = new Map();

let accessPoint = network.enableAccessPoint();

accessPoint.on('connecting', (allow, deny, { name, uuid }) => {
	reg.set(uuid, name);
	if(validateList.includes(reg.get(uuid))) allow();
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
*/
