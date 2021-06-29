'use strict';
scenes.main = function() {
	let cameraMoveObject = new CameraMoveObject(main.camera);
	cvs.on('resize', e => netmap.size.set(cvs.size));

	let programs = {};
	
	programs.server = function() {
		let network = require('network');
		
		let accessPoint = network.enableAccessPoint();
		
		accessPoint.on('connect', connection => {
			connection.send('hi');
		});
		
		accessPoint.on('accept', (data, connection) => {
			console.log('unit > server', data);
		});
	};
	
	
	programs.unit = function() {
		let network = require('network');
		let system  = require('system');
		
		console.log(system.getSystemInterface());
		
		let signal = network.detectAccessPoint().find(i => i.sourceName === 'server');
		if(signal) {
			let connection = network.connect(signal);
			
			connection.on('accept', data => {
				console.log('server > unit', data);
				
				if(data === 'hi') ;
				connection.send('hi');
			});
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