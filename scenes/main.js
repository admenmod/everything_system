'use strict';
Scene.create('main', function() {
	let { netmap, CameraMoveingObject } = global_ns;
	let { Node, Sprite } = nodes_ns;
	let { BaseObject, StaticObject, DynamicObject } = units_ns;
	
	let cameraMoveingObject = new CameraMoveingObject(main.camera);
	cvs.on('resize', e => netmap.size.set(cvs.size));
	
	
	let programs = {};
	
	let rootnode = new Node({ name: 'root' });
	
	let server = null, unit = null, map = null;
	let player = global_ns.player = null;
	
	let idBorders = [
		1333, 1334, 1335, 1336, 1338, 1339, 1340, 1341,
		1345, 1347, 1351, 1353
	];
	
	
	let l = 0, pl = 0;
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
		global_ns.map = map = data;
		
		console.log(map);
		
		return generateImage(map.width*map.tilewidth, map.height*map.tileheight, ctx => {
			map.draw(ctx);
		}).then(img => db.map = img);
	}));


	//===============init===============//
	this.init = () => {
		rootnode.scale.set(0.4);
		
		unit = rootnode.appendChild(new DynamicObject({
			name: 'unit',
			
			pos: cvs.size.div(2).add(500, 0),
			
			main_script: programs.unit,
			
			scale: vec2(0.05, 0.05),
			image: db.ship
		}));
		
		server = rootnode.appendChild(new StaticObject({
			name: 'server',
			
			pos: cvs.size.div(2).add(100, 1000),
			
			main_script: programs.server,
			
			scale: vec2(0.05, 0.05),
			image: db.ship
		}));
		//*/
		
		server.enable();
		unit.enable();
	};


	//===============update===============//
	this.update = function(dt) {
		//=======prePROCES=======//--vs--//=======EVENTS=======//
		cameraMoveingObject.update(touches, main.camera);
		//==================================================//


		//=======PROCES=======//--vs--//=======UPDATE=======//
		rootnode.update(dt);
		//==================================================//


		//==========DRAW==========//--vs--//==========RENDER==========//
		main.ctx.clearRect(0, 0, cvs.width, cvs.height);
		
		main.drawImage(db.map, map.pos.x, map.pos.y, db.map.width, db.map.height);
		netmap.draw(main);
		
		rootnode.render(main);
		
		for(let i of globalThis.enarr) i(main);
		
		main.ctx.fillStyle = '#eeeeee';
		main.ctx.font = '15px Arial';
		main.ctx.fillText(Math.floor(1000/dt), 20, 20);
	}; //==============================//
});


Scene.run('main');


/*
		netmap.tile.set(20);
		
		let scale = vec2(1, 1);
		
		
		
		
		
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
		}
*/
