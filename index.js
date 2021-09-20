'use strict';
resourceLoader.loadFiles([{
	title: 'ship', type: 'image',
	src: './img/ship.png'
}], db).then(() => {
	for(let i in scenes) scenes[i] = new Scene(scenes[i]);
	Scene.set(scenes.main);
	requestAnimationFrame(_updata);
});
