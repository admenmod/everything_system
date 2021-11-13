'use strict';
let {
	codeShell, random, JSONcopy, loader, loadImage, loadScript, generateImage,
	EventEmitter, Scene, Child,
	Vector2, vec2, VectorN, vecN,
	CameraImitationCanvas, CanvasLayer
} = globalThis.Ver;

let cvs = document.querySelector('#canvas');
let { main, back } = cvs.cameraImitationCanvas;

let touches = new TouchesController(cvs, e => e.path[0].className !== 'slot');

let db = {}; // resures: [images, audios]

loadScript('map-parser.js');

loadScript('ns_objects/global_ns.js');
loadScript('ns_objects/nodes_ns.js');
loadScript('ns_objects/code_ns.js');
loadScript('ns_objects/units_ns.js');

loadScript('scenes/main.js');


//========== LoopGame ==========//
(() => {
	let prevTime = 0;
	function _updata(dt) {
		if(dt-prevTime < 100) Scene.updata(dt-prevTime);
		prevTime = dt;
		touches.nullify();
		requestAnimationFrame(_updata);
	};
	requestAnimationFrame(_updata);
})();
