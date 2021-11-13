'use strict';
let nodes_ns = new function() {
	let BaseNode = this.BaseNode = class extends Child {
		constructor(p = {}) {
			super();
			this.type = 'BaseNode';
			this._isRenderBorder = false;
			
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
			
			if(this._isRenderBorder) {
				ctx.strokeStyle = '#ffff00';
				ctx.strokeRect(this.pos.x, this.pos.y, this.size.x*this.globalScale.x, this.size.y*this.globalScale.y);
				ctx.strokeRect(this.pos.x-ctx.lineWidth/2, this.pos.y-ctx.lineWidth/2, this.size.x*this.globalScale.x+ctx.lineWidth, this.size.y*this.globalScale.y+ctx.lineWidth);
			};
			ctx.restore();
		}
	};
};
