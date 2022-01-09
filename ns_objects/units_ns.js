'use strict';
let units_ns = new function() {
	let { Sprite } = nodes_ns;
	let { Processor } = components_ns;
	
	
	let BaseObject = this.BaseObject = class extends Sprite {
		constructor(p = {}) {
			super(p);
		//	let self = this;
			
		//	this.prevPos = this.pos.buf();
		//	this.maxSpeed = p.maxSpeed||0.02;
			
		//	this.instructionLoop = [];
			
			this.processor = new Processor({
				getpos: () => this.globalPos,
				main_script: p.main_script
			});
			
			this.modules = this.processor.modules;
			
			this.attachModule(components_ns.RadioModule);
			this.attachModule(components_ns.NetworkModule);
		//	this._iInterval = setInterval(() => this._systemInterface.emit('update', this._event_api_object), 1000/20);
		}
		
	//	destroy() {
	//		clearInterval(this._iInterval);
	//	}
		
		attachModule(Module) {
			this.processor.connectModule(Module);
		}
		
		draw(ctx, pos = this.globalPos) {
			super.draw(ctx, pos);
		}
		
		enable() {
			this.processor.enable();
		}
		
		disable() {
			this.processor.disable();
		}
	};
	
	
	BaseObject.SCIModule = class {
		constructor(unit) {
			this.unit = unit;
			
			this.gflags = 0;
			this.flags = {
				MOVE: 0b01,
				ATTACK: 0b10
			};
			
			this.movementTarget = vec2();
		}
		
		module_export() {
			return () => {
				let module = new EventEmitter();
				
				let setHandlers = (obj, prop, ters) => {
					Object.defineProperty(obj, prop, Object.assign({
						enumerable: true,
						configurable: true
					}, ters));
				};
				
				
				module.execute = action => {
					action = action.toUpperCase();
					
					if(!this.flags[action]) return console.error('invalid action '+action);
				//	console.log(55);
					this.gflags |= this.flags[action];
					console.log(action, this.gflags);
				};
				
				setHandlers(module, 'attackTarget', {
					get: () => this.attackTarget,
					set: target => this.attackTarget = target
				});
				
				setHandlers(module, 'movementTarget', { get: () => this.movementTarget });
				
				module.getPosition = () => this.unit.pos.buf();
				
				return { exports: module, filename: 'sci' };
			};
		}
	};
	
	
	let StaticObject = this.StaticObject = class extends BaseObject {
		constructor(p = {}) {
			super(p);
		}
	};
	
	
	let DynamicObject = this.DynamicObject = class extends BaseObject {
		constructor(p = {}) {
			super(p);
			
			this.vel = vec2();
		}
		
		update(dt) {
			this.vel.inc(0.97);
			this.pos.plus(this.vel);
		}
	};
	
	
	
	/*
	Unit.SystemModule = class {
		constructor(unit) {
			this.unit = unit;
			
			this._status = 'idle';
			
			this.targets = {
				move: null,
				attack: null
			};
			
			this.actionFlags = {
				IDLE: true,
				MOVE: false,
				ATTACK: false
			};
			
			this.instructionLoop = [];
		}
		
		moveI() {
			let target = this.targets.move;
			if(!(this.actionFlags.MOVE && target)) return;
			
			this.actionFlags.MOVE = false;
			this.instructionLoop.push('move');
			
			this.unit.vel.moveTo(target.buf().minus(this.unit.pos), this.unit.maxSpeed);
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
		
		module_export() {
			return () => {
				let module = new EventEmitter();
				module._status = this._status;
				
				let setHendlers = (prop, ters) => {
					Object.defineProperty(this, prop, Object.assign({
						enumerable: true,
						configurable: true
					}, ters));
				};
				
				module.getMaxSpeed = () => this.unit.maxSpeed;
				
				setHendlers('status', {
					get: () => module._status,
					set: v => {
						let prev = module._status;
						module._status = v.toLowerCase();
						
						if(prev === module._status) return;
						
						module._status = this._status;
						module.emit('statuschange', this._status, prev);
					}
				});
				
				module.setTarget = (type = module._status, v) => {
					if(!type) return console.error('Error: required parameter not specified');
					if(!v) return console.error('Error: invalid argument');
					return this.targets[type] = v;
				
					// let t = this.targets[type];
					// if(t instanceof Vector2) return t.set(v);
					// else t;
				};
				
				module.getTarget = (type = module._status) => {
					if(!type) return console.error('Error: required parameter not specified');
					return this.targets[type];
				
					// let t = this.targets[type];
					// if(t instanceof Vector2) return t.buf();
					// else t;
				};
				
				return { exports: module, filename: 'system' };
			};
		}
	};
	//*/
};