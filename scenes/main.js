'use strict';
scenes.main = function() {
	let cameraMoveObject = new CameraMoveObject(main.camera);
	cvs.on('resize', e => netmap.size.set(cvs.size));
	
	G.print('public');
	
	
//===============init===============//
	this.init = function() {
		// ...;
	};
	
//===============updata===============//
	this.updata = function(dt) {
		let touchC = main.camera.buf(touch);
	//=======prePROCES=======//--vs--//=======EVENTS=======//
		cameraMoveObject.updata(touch, main.camera);
	//==================================================//
	
	
	//=======PROCES=======//--vs--//=======UPDATA=======//
		// ...;
	//==================================================//
	
	
	//==========DRAW==========//--vs--//==========RENDER==========//
		main.ctx.clearRect(0, 0, cvs.width, cvs.height);
		netmap.draw(main);
	};	//==============================//
	
//===============exit===============//
	this.exit = function() {
		// ...;
	};
};
