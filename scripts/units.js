'use strict';
let Units = new function() {
	let Unit = this.Unit = class extends ImageNode {
		constructor(p = {}) {
			super(p);
			let self = this;
			
			this.maxSpeed = p.maxSpeed||0.02;
			this.targetMove = this.pos.buf();
			this.targetAttack = null;
			
			this.processor = p.processor;
			
			this._systemInterface = new function() {
				this.getMaxSpeed = () => self.maxSpeed;
				
				this.setTargetMove = v => self.targetMove.set(v);
				this.getTargetMove = v => self.targetMove.buf(v);
				this.setTargetAttack = v  => self.targetAttack = v;
				this.getTargetAttack = () => self.targetAttack;
			};
			
			this.processor.connectToSystem(this._systemInterface);
		}
		
		attack(target) {
			this
		}
		
		updata() {
			this.vel.inc(0.97);
			this.vel.moveTo(this.pos.ot(this.targetMove), this.maxSpeed);
			this.pos.plus(this.vel);
			
			this.attack(this.targetAttack);
		}
		draw(ctx, pos = this.globalPos) {
			super.draw(ctx, pos);
		}
	}
};