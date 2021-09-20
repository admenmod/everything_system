'use strict';
scenes.main = function() {
	let cameraMoveObject = new CameraMoveObject(main.camera);
	cvs.on('resize', e => netmap.size.set(cvs.size));
	
	
	let map = new MapParser.Map('testmap.json', './map/');
	
	map.on('load', map => {
		generateImage(map.width*map.tilewidth, map.height*map.tileheight, ctx => {
			console.log(map.tilesets[66].imagedata);
			map.draw(ctx);
		}).then(image => db.map = image);
		
		netmap.tile.set(20);
		console.log(map);
	});
	
	
	let programs = {};
	
	programs.server = function() {
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
	};
	
	
	programs.unit = function() {
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
		
		si.on('statuschange', (status, prev) => {
			console.log(status, prev);
		});
		
		
		console.log(si);
	};
	
	
	let server = new Code.Processor({
		name: 'server',
		mainProgram: programs.server
	});

	let unit = new Code.Processor({
		name: 'unit',
		mainProgram: programs.unit
	});
	
	
	let pleyar = new Units.Unit({
		posC: cvs.size.div(2),
		
		processor: unit,
		
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
		
		if(db.map) main.drawImage(db.map, map.pos.x, map.pos.y, db.map.width, db.map.height);
		
	//	if(map?.tilesets?.[66]?.isLoaded) main.drawImage(map.tilesets[66].imagedata, -100, -100, 100, 100);
		
		netmap.draw(main);
		
		pleyar.draw(main);
	}; //==============================//
};
