'use strict';
let SystemObjects = new function() {
	let BaseNode = this.BaseNode = class extends Child {
		constructor(p = {}) {
			super();
			this.type = 'BaseNode';
			
			this.pos = p.pos||vec2();
			this.vel = p.vel||vec2();
			this.size = p.size||vec2();
			this.scale = p.scale||vec2(1, 1);
			
			this.angle = 0;
			this.offsetAngle = p.offsetAngle||0;
			this.alpha = p.alpha !== undefined ? p.alpha : 1;
		}
		get globalPos() {
			let pos = this.pos.buf();
			let tt = this.getChainParent();
			for(let i = 0; i < tt.length; i++) pos.plus(tt[i].pos);
			return pos;
		}
		get globalScale() {
			let scale = this.scale.buf();
			let tt = this.getChainParent();
			for(let i = 0; i < tt.length; i++) scale.inc(tt[i].scale);
			return scale;
		}
		
		setPos(v) { return this.pos.set(v).buf(); }
		setPosC(v) { return this.pos.set(v.buf().minus(this.size.buf().inc(this.globalScale).div(2))).buf(); }
		getPos() { return this.pos.buf(); }
		getPosC() { return this.pos.buf().plus(this.size.buf().inc(this.globalScale).div(2)); }
		
		moveAngle(mv, a) { return this.pos.moveAngle(mv, a); }
		moveTo(v, mv) { return this.pos.moveTo(v, mv); }
		moveToC(v, mv) { return this.pos.moveTo(v.buf().minus(this.size.buf().inc(this.globalScale).div(2)), mv); }
		moveTime(v, t) { return this.pos.moveTime(v, t); }
		moveTimeC(v, t) { return this.pos.moveTime(v.buf().minus(this.size.buf().inc(this.globalScale).div(2)), t); }
		
		getBoundingRect() {
			let pos = this.globalPos, scale = this.globalScale;
			return {
				x: pos.x, w: this.size.x*scale.x,
				y: pos.y, h: this.size.y*scale.y,
			};
		}
		isStaticIntersect(b) {
			if(b.getBoundingRect) b = getBoundingRect();
			let a = this.getBoundingRect();
			return a.x+a.w > b.x && b.x+b.w > a.x && a.y+a.h > b.y && b.y+b.h > a.y;
		}
	};
	
	
	let ImageNode = this.ImageNode = class extends BaseNode {
		constructor(p = {}) {
			super(p);
			this.type = 'ImageNode';
			this.sizePlus = p.sizePlus||vec2();
			this.image = p.image;
			
			if(!p.size || p.size.isSame(Vector2.ZERO)) this.size = vec2(this.image.width, this.image.height);
			else {
				let w = p.size.x;
				let h = p.size.y;
				let s = this.image.width/this.image.height;
				if(!w !== !h) this.size = vec2(w?w : h*s, h?h : w/s);
				else this.size = p.size;
			};
			
			if(p.posC) this.setPosC(p.posC);
		}
		draw(ctx, pos = this.globalPos) {
			ctx.save();
		//	let pos = this.pos;//.buf().floor().plus(0.5);
			if(this.angle !== 0) ctx.setTranslate(this.offsetAngle+this.angle, this.getPosC());
			ctx.globalAlpha = this.alpha;
			ctx.drawImage(this.image, pos.x, pos.y, this.size.x*this.globalScale.x+this.sizePlus.x, this.size.y*this.globalScale.y+this.sizePlus.y);
			
		//	ctx.strokeStyle = '#ffff00';
		//	ctx.strokeRect(this.pos.x, this.pos.y, this.size.x*this.globalScale.x, this.size.y*this.globalScale.y);
		//	ctx.strokeRect(this.pos.x-ctx.lineWidth/2, this.pos.y-ctx.lineWidth/2, this.size.x*this.globalScale.x+ctx.lineWidth, this.size.y*this.globalScale.y+ctx.lineWidth);
			ctx.restore();
		}
	};
	
	
	let CameraMoveingObject = this.CameraMoveingObject = class {
		constructor(v, maxspeed, minspeed) {
			this.fixpos = v.buf();
			this.cameraSpeed = vec2();
			this.maxspeed = maxspeed||10;
			this.minspeed = minspeed||0.02;
			this.touch = null;
		}
		updata(touch, v) {
			if(!this.touch) {
				if(Math.abs(this.cameraSpeed.moduleSq) < this.minspeed) this.cameraSpeed.set(0);
				
				this.cameraSpeed.moveTime(Vector2.ZERO, 10);
				v.minus(this.cameraSpeed);
				
				if(this.touch = touch.findTouch()) this.fixpos = v.buf();
			} else {
				if(this.touch.isDown()) v.set(this.fixpos.buf().minus(this.touch.dx, this.touch.dy));
				if(this.touch.isMove()) {
					this.cameraSpeed.set(
						Math.abs(this.touch.sx) <= this.maxspeed ? this.touch.sx :Math.sign(this.touch.sx)*this.maxspeed,
						Math.abs(this.touch.sy) <= this.maxspeed ? this.touch.sy :Math.sign(this.touch.sy)*this.maxspeed
					);
				};
				if(this.touch.isUp()) this.touch = null;
			};
		}
	};
	
	
	let Joystick = this.Joystick = class {
		constructor(p = {}) {
			this.pos = p.pos||vec2();
			this._angle = 0;
			
			this.radius = p.radius||70;
			this.coreRadius = p.coreRadius||50;
			this.colors = p.colors || [0, '#112233', 1, '#223344'];
			
			this.core = {
				pos: this.pos.buf(),
				radius: 30,
				coreRadius: 5,
				colors: p.coreColors || [0, '#223344', 1, '#112233']
			};
			
			this.touch = null;
		}
		get value() { return Math.round(this.pos.getDistance(this.core.pos) / (this.radius-this.core.radius) * 10000) / 10000; }
		get angle() { return this._angle = this.value ? this.pos.getAngleRelative(this.core.pos) : this._angle; }
		updata(touch) {
			if(!this.touch) this.touch = touch.findTouch(t => this.pos.getDistance(t) < this.radius);
			else if(this.touch) {
				let l = this.pos.getDistance(this.touch);
				this.core.pos.set(this.pos).moveAngle(Math.min(l, this.radius-this.core.radius), this.core.pos.getAngleRelative(this.touch));
				if(this.touch.isUp()) this.touch = null;
			};
			if(!this.touch) this.core.pos.moveTime(this.pos, 3);
		}
		draw(ctx) {
			ctx.save();
			ctx.globalAlpha = 0.7;
			ctx.beginPath();
			let grd = ctx.createRadialGradient(this.pos.x, this.pos.y, this.coreRadius, this.pos.x, this.pos.y, this.radius);
			for(let i = 0; i < this.colors.length; i += 2) grd.addColorStop(this.colors[i], this.colors[i+1]);
			ctx.fillStyle = grd;
			ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI*2);
			ctx.fill();
			
			ctx.beginPath();
			grd = ctx.createRadialGradient(this.core.pos.x, this.core.pos.y, this.core.coreRadius, this.core.pos.x, this.core.pos.y, this.core.radius);
			for(let i = 0; i < this.core.colors.length; i += 2) grd.addColorStop(this.core.colors[i], this.core.colors[i+1]);
			ctx.fillStyle = grd;
			ctx.arc(this.core.pos.x, this.core.pos.y, this.core.radius, 0, Math.PI*2);
			ctx.fill();
			ctx.restore();
		}
	};
	
	
	let netmap = this.netmap = {
		pos: vec2(),
		offset: vec2(),
		size: vec2(cvs.width, cvs.height),
		tile: vec2(50, 50),
		color: '#ffffff',
		lineWidth: 0.2,
		cord: true,
		draw: function({ctx}, pos = main.camera) {
			let el = vec2(-(pos.x % this.tile.x), -(pos.y % this.tile.y));
			
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = this.color;
			ctx.lineWidth = this.lineWidth;
			
			for(let x = -this.tile.x; x < this.size.x + this.tile.x*2; x += this.tile.x) {
				ctx.moveTo(this.offset.x + el.x + x, this.offset.y + el.y - this.tile.y);
				ctx.lineTo(this.offset.x + el.x + x, this.offset.y + el.y + this.size.y + this.tile.y);
			};
			
			for(let y = -this.tile.y; y < this.size.y + this.tile.y * 2; y += this.tile.y) {
				ctx.moveTo(this.offset.x + el.x - this.tile.x, this.offset.y + el.y + y);
				ctx.lineTo(this.offset.x + el.x + this.size.x + this.tile.x, this.offset.y + el.y + y);
			};
			ctx.stroke();
			
			
			if(this.cord) {
				ctx.fillStyle = '#ffff00';
				ctx.globalAlpha = 0.4;
			/*	for(let x = -this.tile.x; x<this.size.x+this.tile.x*2; x += this.tile.x) {
					for(let y = -this.tile.y; y<this.size.y+this.tile.y*2; y += this.tile.y) {
					//	ctx.fillText(`${~~((pos.x+x)/this.tile.x)*this.tile.x}:${~~((pos.y+y)/this.tile.y)*this.tile.y}`, this.offset.x+el.x+x, this.offset.y+el.y+y+10);
					
						ctx.fillText(~~((pos.x+x)/this.tile.x)*this.tile.x, this.offset.x+el.x+x, this.offset.y+el.y+y+10);
						ctx.fillText(~~((pos.y+y)/this.tile.y)*this.tile.y, this.offset.x+el.x+x, this.offset.y+el.y+y+20);
					};
				};
			*/
				
				
				for(let x = -this.tile.x; x < this.size.x + this.tile.x * 2; x += this.tile.x) {
					ctx.fillText(~~((pos.x+x) / this.tile.x) * this.tile.x, this.offset.x + el.x + x + 2, 12);
				};
				for(let y = -this.tile.y; y < this.size.y + this.tile.y*2; y += this.tile.y) {
					ctx.fillText(~~((pos.y+y) / this.tile.y) * this.tile.y, 2, this.offset.y + el.y + y - 2);
				};
			};
			
			/*
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#00ff00';
			ctx.strokeRect(el.x, el.y, this.size.x, this.size.y);
			ctx.closePath();
			*/
			ctx.restore();
		}
	};
	
	
	let selectionRect = this.selectionRect = {
		pos1: vec2(),
		pos2: vec2(),
		o: 0,
		active: false,
		isIntersect: function(v) {
			return v.x > this.pos1.x === v.x < this.pos2.x && v.y > this.pos1.y === v.y < this.pos2.y;
		},
		draw: function(ctx) {
			ctx.save();
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#00ff00';
			ctx.moveTo(this.pos1.x, this.pos1.y);
			ctx.lineTo(this.pos2.x, this.pos2.y);
			ctx.stroke();
			ctx.closePath();
			
			ctx.lineDashOffset = this.o;
			ctx.setLineDash([5, 2]);
			ctx.strokeStyle = '#cccccc';
			ctx.strokeRect(this.pos1.x, this.pos1.y, this.pos2.x - this.pos1.x, this.pos2.y - this.pos1.y);
			ctx.restore();
		}
	};
	
	
	let setTickout = this.setTickout = (anim, tickout = 1, ...arg) => setTickout.anims.push({ tick: 0, tickout, anim, arg });
	setTickout.anims = [];
	setTickout.updata = function() {
		for(let i = 0; i < this.anims.length; i++) {
			if(this.anims[i].tick++ >= this.anims[i].tickout) {
				let a = this.anims.splice(i, 1)[0];
				a.anim(...a.arg);
			};
		};
	};
};
