'use strict';
let {
	codeShell, random, JSONcopy, loadImage, generateImage,
	EventEmitter, Scene, Child,
	Vector2, vec2, VectorN, vecN,
	CameraImitationCanvas, CanvasLayer
} = globalThis.Ver;

let cvs = document.querySelector('#canvas');
let {main, back} = cvs.cameraImitationCanvas;

let touches = new TouchesController(cvs, e => e.path[0].className !== 'slot');

let cfg = {};
let db = {}; // resures: [images, audios]


requestAnimationFrame(_updata);

//========== LoopGame ==========//
function _updata(dt) {
	Scene.updata(dt);
	touches.nullify();
	requestAnimationFrame(_updata);
};
