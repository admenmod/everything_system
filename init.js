'use strict';
let cvs = document.querySelector('#canvas');
let {main, back} = cvs.canvasEmitCamera;

let touch = new TouchesControl(cvs, e => e.path[0].className !== 'slot');

let db = {}; // resures: [images, audios]
let em = new EventEmitter();

let cfg = {};
let scenes = {};

cvs.loadFiles([], db).then(function() {
	setTimeout(function() {
		for(let i in scenes) scenes[i] = new Scene(scenes[i]);
		Scene.set(scenes.main);
		requestAnimationFrame(_updata);
	}, 50);
});

//========== LoopGame ==========//
function _updata(dt) {
	touch.updata();
	Scene.active_scene.updata(dt);
	touch.onNull();
	requestAnimationFrame(_updata);
};
