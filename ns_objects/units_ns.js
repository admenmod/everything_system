'use strict';
let units_ns = new function() {
	let { ImageNode } = nodes_ns;
	
	let Unit = this.Unit = class extends ImageNode {
		constructor(p = {}) {
			super(p);
			let self = this;
			
			this.prevPos = this.pos.buf();
			
			this._status = 'idle';
			this.maxSpeed = p.maxSpeed||0.02;
			
			this.instructionLoop = [];
			this.processor = p.processor;
			
			this.targets = {
				move: null,
				attack: null
			};
			
			this.actionFlags = {
				IDLE: true,
				MOVE: false,
				ATTACK: false
			};
			
			
			this._systemInterface = Object.assign(new EventEmitter(), new function() {
				this._status = self._status;
				
				let setHendlers = (prop, ters) => {
					Object.defineProperty(this, prop, Object.assign({
						enumerable: true, configurable: true
					}, ters));
				};
				
				this.getMaxSpeed = () => self.maxSpeed;
				
				setHendlers('status', {
					get: () => this._status,
					set: v => {
						let prev = this._status;
						this._status = v.toLowerCase();
						
						if(prev === this._status) return;
						
						self._status = this._status;
						this.emit('statuschange', this._status, prev);
					}
				});
				
				this.setTarget = (type = this._status, v) => {
					if(!type) return console.error('Error: required parameter not specified');
					if(!v) return console.error('Error: invalid argument');
					return self.targets[type] = v;
					
					// let t = self.targets[type];
					// if(t instanceof Vector2) return t.set(v);
					// else t;
				};
				
				this.getTarget = (type = this._status) => {
					if(!type) return console.error('Error: required parameter not specified');
					return self.targets[type];
					
					// let t = self.targets[type];
					// if(t i       nstanceof Vector2) return t.buf();
					// else t;
				};
			});
			
			
			class EventAPI {
				constructor() {
					this.si = self._systemInterface;
				}
				execute(action, ...args) {
					action = action.toUpperCase();
				
					if(action in self.actionFlags) self.actionFlags[action] = true;
					else return;
				
					if(action === 'IDLE') this.si.status = 'idle';
					else if(action === 'MOVE') {
						this.si.status = 'move';
				
						if(args[0]) this.si.setTarget(this.si.status, args[0].buf());
					} else this.si.status = 'idle';
				}
			};
			this._systemInterface._newEventAPI = () => new EventAPI();
			
			
		//	this._iInterval = setInterval(() => this._systemInterface.emit('update', this._event_api_object), 1000/20);
			this.processor.connectToSystem(this._systemInterface);
		}
		
		
		
		hasCollide(b) {
			if(this.isStaticIntersect(b)) {
				let dir = null;
				
				let size = this.globalScale.inc(this.size);
				
				let a = {
					x: this.prevPos.x, w: size.x,
					y: this.prevPos.y, h: size.y
				};
				//*
				if(a.x <= b.x-a.w) dir = 'left'
				if(a.x >= b.x+b.w) dir = 'right';
				if(a.y <= b.y-a.h) dir = 'top';
				if(a.y >= b.y+b.h) dir = 'bottom';
				//*/
			/*	
				if(a.x >= b.x+b.w) dir = 'left';
				else if(a.x+a.w <= b.x) dir = 'right'
				else if(a.y >= b.y+b.h) dir = 'top';
				else if(a.y+a.h <= b.y) dir = 'bottom';
				*/
				this.emit('collide', dir, a, b);
				this.collideHandler(dir, a, b);
			};
		}
		collideHandler(dir, a, b) {
			let c = 0;
			
			if(dir === 'left') {
				this.vel.x = 0;
				this.pos.x = b.x-a.w+c;
			} else if(dir === 'right') {
				this.vel.x = 0;
				this.pos.x = b.x+b.w-c;
			} else if(dir === 'top') {
				this.vel.y = 0;
				this.pos.y = b.y-a.h+c;
			} else if(dir === 'bottom') {
				this.vel.y = 0;
				this.pos.y = b.y+b.h-c;
			};
		}
		
		destroy() {
			clearInterval(this._iInterval);
		}
		
		moveI() {
			let target = this.targets.move;
			if(!(this.actionFlags.MOVE && target)) return;
			
			this.actionFlags.MOVE = false;
			this.instructionLoop.push('move');
			
			this.vel.moveTo(target.buf().minus(this.pos), this.maxSpeed);
		}
		attackI() {
			let target = this.targets.attack;
			if(!(this.actionFlags.ATTACK && target)) return;
			
			this.actionFlags.ATTACK = false;
			this.instructionLoop.push('attack');
			
			this.shoot(target);
		}
		
		shoot() {
			let target = this.targets.shoot;
			
		}
		
		instructionUpdate() {
		//	this.instructionLoop.forEach(i => i());
			
			this.moveI(this.targets.move);
			this.attackI(this.targets.attack);
		}
		update(dt) {
			this.vel.inc(0.97);
			this.pos.plus(this.vel);
		}
		draw(ctx, pos = this.globalPos) {
			super.draw(ctx, pos);
		}
	};
};