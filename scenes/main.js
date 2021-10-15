'use strict';
Scene.create('main', function() {
	let netmap = SystemObjects.netmap;
	
	let cameraMoveingObject = new SystemObjects.CameraMoveingObject(main.camera);
	cvs.on('resize', e => netmap.size.set(cvs.size));
	
	netmap.tile.set(20);
	
	let scale = vec2(1, 1);
	
	
	let programs = {};
	
	let server = null, unit = null, player = null, map = null;
	
	let idBorders = [
		1333, 1334, 1335, 1336, 1338, 1339, 1340, 1341,
		1345, 1347, 1351, 1353
	];
	
	let l = 0, pl = 0, sl = scale.x;
	let pos1 = vec2(), pos2 = vec2();
	
	
	this.preload(loadImage('./img/ship.png').then(img => db.ship = img));
	this.preload(generateImage(1, 1, (ctx) => {
		ctx.fillStyle = '#000000';
		ctx.globalAlpha = 0;
		ctx.fillRect(0, 0, 1, 1);
	}).then(img => db._ = img));
	
	this.preload(fetch(location.origin+'/user-code/unit.js')
		.then(data => data.text())
		.then(data => programs.unit = data));
		
	this.preload(fetch(location.origin+'/user-code/server.js')
		.then(data => data.text())
		.then(data => programs.server = data));
		
	this.preload(MapParser.loadMap('testmap.json', './map/').then(data => {
		G.map = map = data;
		
		console.log(map);
		
		return generateImage(map.width*map.tilewidth, map.height*map.tileheight, ctx => {
			map.draw(ctx);
		}).then(img => db.map = img);
	}));
	
	
	//===============init===============//
	this.init = () => {
		server = new Code.Processor({
			name: 'server',
			mainProgram: programs.server
		});
		
		unit = new Code.Processor({
			name: 'unit',
			mainProgram: programs.unit
		});
		
		
		player = new Units.Unit({
			posC: cvs.size.div(2),
			
			processor: unit,
			
			scale: vec2(0.05, 0.05),
			image: db.ship
		});
		
		
		server.enable();
		unit.enable();
		
		player.on('collide', (dir, a, b) => {
			console.log(true);
		});
	};
	
	
	//===============updata===============//
	this.updata = function(dt) {
		//=======prePROCES=======//--vs--//=======EVENTS=======//
		if(touches.active.length === 2) {
			pos1.set(touches.touches[touches.active[0]]);
			pos2.set(touches.touches[touches.active[1]]);
			
			if(touches.touches[1].isPress()) {
				l = pl = pos1.getDistance(pos2);
				sl = scale.x;
			};
			
			l = pos1.getDistance(pos2);
			
			scale.set(l/pl*sl);
			scale.x = Math.max(0.2, Math.min(5, scale.x));
			scale.y = Math.max(0.2, Math.min(5, scale.y));
			
			netmap.size.set(cvs.size.inc(scale));
		} else {
			cameraMoveingObject.updata(touches, main.camera);
		};
		//==================================================//


		//=======PROCES=======//--vs--//=======UPDATA=======//
		player.instructionUpdata();
		
		let layer = map.layers[0];
		let size = vec2(map.tilewidth, map.tileheight);
		
		for(let i = 0; i < layer.data.length; i++) {
			let id = layer.data[i];
			if(!idBorders.includes(id)) continue;
			
			player.hasCollide({
				x: i % layer.width, y: Math.floor(i/layer.width),
				w: size.x, h: size.y
			});
		};
		
		player.updata();
		//==================================================//


		//==========DRAW==========//--vs--//==========RENDER==========//
		main.ctx.clearRect(0, 0, cvs.width, cvs.height);
		
		
		main.save();
		main.scale(scale.x, scale.y);
		
		main.drawImage(db.map, map.pos.x, map.pos.y, db.map.width, db.map.height);
		
		netmap.draw(main);
		
		player.draw(main);
		
		main.restore();
	}; //==============================//
});

Scene.run('main');
