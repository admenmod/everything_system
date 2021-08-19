'use strict';
scenes.main = function() {
	let cameraMoveObject = new CameraMoveObject(main.camera);
	cvs.on('resize', e => netmap.size.set(cvs.size));

	let programs = {};
	
	programs.server = function() {
		let network = require('network');
		
		
		console.log(network);
		
		let validateList = ['unit'];
		
		
		let accessPoint = network.enableAccessPoint();
		
		accessPoint.on('connection', res => {
			res(name => validateList.includes(name), 'error: You not in list validate');
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
			if(data === 'drop') network.g(connection);
		});
	};
	
	
	programs.unit = function() {
		let network = require('network');
		let system  = require('system');
		
		let si = system.getSystemInterface();
		
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
	};
	
	
	let server = new Code.Computer({
		name: 'server',
		mainProgram: programs.server
	});

	let unit = new Code.Computer({
		name: 'unit',
		mainProgram: programs.unit
	});
	
	
	let pleyar = new Units.Unit({
		posC: cvs.size.div(2),
		
		computer: unit,
		
		scale: vec2(0.05, 0.05),
		image: db.ship
	});
	
	server.enable();
	unit.enable();


	//===============updata===============//
	this.updata = function(dt) {
		let touchC = main.camera.buf(touch);
		//=======prePROCES=======//--vs--//=======EVENTS=======//
		cameraMoveObject.updata(touch, main.camera);
		//==================================================//


		//=======PROCES=======//--vs--//=======UPDATA=======//
		pleyar.updata();
		//==================================================//


		//==========DRAW==========//--vs--//==========RENDER==========//
		main.ctx.clearRect(0, 0, cvs.width, cvs.height);
		netmap.draw(main);
		
		pleyar.draw(main);
	}; //==============================//
};