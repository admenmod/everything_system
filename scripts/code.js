'use strict';
let Code = new function() {
	let globalModules = {
		network(self) {
			let module = new EventEmitter();
			
			module.connect = () => {
				
			};
			
			return module;
		},
		system(self) {
			let module = new EventEmitter();
			
			return module;
		}
	};
	
	
	let Computer = this.Computer = class extends EventEmitter {
		constructor(p = {}) {
			super();
			this.pos = vec2();
			
			this._state = {
				
			};
			
			this._connection = Object.assign(new EventEmitter(), {
				connectionType: null,	// null, connect, distribute
				isConnected: false,
				connection: null,
				list: new Set()
			});
			
			
			this._api_this = {};
			
			let process = new function() {
				this.exit = () => this.disable();
			};
			
			this._api_environment = {
				process,
				
				require: module => module in this.cachModule ? this.cachModule[module] : this.cachModule[module] = globalModules[module](this),
				
				Vector2, vec2, VectorN, vecN, EventEmitter,
				Object, Array, Function, Number, String, BigInt, Symbol
			};
			
			this._mainProgram = codeFunction(p.mainProgram||Computer.defaultMainProgram, this._api_environment, 'main-'+p.name);
		}
		
		enable() {
			this._mainProgram.apply(this._api_this, arguments);
		}
		disable() {
			
		}
		
		
	};
};