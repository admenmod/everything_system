'use strict';
let cvs = document.querySelector('#canvas');
let {main, back} = cvs.canvasEmitCamera;

let touch = new TouchesControl(cvs, e => e.path[0].className !== 'slot');
let resourceLoader = new ResourceLoader();

let db = {}; // resures: [images, audios]
let em = new EventEmitter();

let cfg = {};
let scenes = {};

resourceLoader.loadFiles([{
	title: 'ship', type: 'image',
	src: './img/ship.png'
}], db).then(() => {
	setTimeout(function() {
		for(let i in scenes) scenes[i] = new Scene(scenes[i]);
		Scene.set(scenes.main);
		requestAnimationFrame(_updata);
	}, 50);
});

//========== LoopGame ==========//
function _updata(dt) {
	Scene.active_scene.updata(dt);
	touch.onNull();
	requestAnimationFrame(_updata);
};
