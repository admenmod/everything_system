'use strict';
let MapParser = Object.assign(new EventEmitter(), new function() {
	let Map = this.Map = class Map extends EventEmitter {
		constructor(path, prefix = './') {
			super();
			let self = this;
			this.isLoaded = false;
			
			this.pos = vec2();
			this.scale = vec2(1, 1);
			
			fetch(prefix+path).then(data => data.json()).then(data => {
				Object.assign(this, data);
				
				for(let i = 0; i < this.layers.length; i++) {
					let layer = this.layers[i];
					layer.data = new Uint16Array(layer.data);
				};
				
				let proms = [];
				for(let i = 0; i < this.tilesets.length; i++) {
					let tileset = this.tilesets[i];
					
					proms.push(loadImage(prefix+tileset.image, tileset.imagewidth, tileset.imageheight)
					.then(img => {
						tileset.imagedata = img;
						tileset.isLoaded = true;
						
						this.pos = vec2(this.x, this.y);
						this.scale = vec2(1, 1);
						
						this.emit('loadtileset', tileset);
					}).catch(err => console.warn('Error: '+err.path[0].src)));
				};
				
				Promise.all(proms).then(data => {
				//	console.log(this.tilesets);
					
					this.isLoaded = true;
					this.emit('load', this);
				});
			});
		}
		
		_cacheTile = {}
		
		draw(ctx, pos = this.pos) {
			if(!this.isLoaded) return;
			
			ctx.save();
			for(let layer of this.layers) {
				if(!layer.visible) continue;
				
				let sx = this.scale.x,
					sy = this.scale.y;
				
				for(let i = 0; i < layer.data.length; i++) {
					let id = layer.data[i];
					let ly = Math.floor(i/layer.width),
						lx = i % layer.width;
					
					if(id === 0) continue;
					
					let tileset = null;
					if(!(tileset = this._cacheTile[id])) {
						for(let i = 0; i < this.tilesets.length; i++) {
							tileset = this.tilesets[i];
							let next = this.tilesets[i+1];
							
							if(!next || tileset.firstgid <= id && next.firstgid > id) {
								this._cacheTile[id] = tileset;
								break;
							};
						};
					};
					
					if(!tileset || !tileset.isLoaded) {
						console.error('tileset not fined');
						continue;
					};
					
					let tid = id-tileset.firstgid;
					let ty = Math.floor(tid/tileset.columns),
						tx = tid % tileset.columns;
					
					let tw = tileset.tilewidth,
						th = tileset.tileheight;
					
					let gtw = this.tilewidth,
						gth = this.tileheight;
					
					ctx.drawImage(tileset.imagedata, tx*tw, ty*th, tw, th, pos.x + lx*gtw*sx, pos.y + ly*gth*sy, tw*sx, th*sy);
				};
			};
			
			ctx.restore();
		}
	};
	
	let loadMap = this.loadMap = (...args) => new Promise((res, rej) => new Map(...args).once('load', res));
});
