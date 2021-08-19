'use strict';
let Code = new function() {
	let delay = cb => new Promise(res => {
		let t = setTimeout(() => {
			clearTimeout(t);
			res(cb());
		}, 0);
	});
	
	
	let globalModules = {
		network(self) {
			let module = new EventEmitter();
			
			let sm = self.modules.network;
			if(!sm) return module;
			
			Object.assign(module, {
				connect: (signal, res, rej) => (sm.connectToAccessPoint(signal, res, rej)),
				disconnect: () => sm.disconnectToAccessPoint(),
				detectAccessPoint: () => sm.detectAccessPoint(),
				
				enableAccessPoint: () => sm.enableAccessPoint(),
				disableAccessPoint: () => sm.disableAccessPoint(),
				
				getConnectionList: () => [...sm._connection.connectionList]
			});
			
			return module;
		},
		radar(self) {
			let module = new EventEmitter();
			
			let sm = self.modules.radar;
			if(!sm) return module;
			
			Object.assign(module, {
				detect: () => sm.detect(),
				enableSignalEmulation: () => sm.enableSignalEmulation(),
				disableSignalEmulation: () => sm.disableSignalEmulation(),
			});
			
			return module;
		},
		system(self) {
			let module = new EventEmitter();
			
			module.getSystemInterface = () => self._systemInterface;
			
			return module;
		}
	};
	
	
	let Computer = this.Computer = class extends EventEmitter {
		constructor(p = {}) {
			super();
			this._pos = vec2();
			
			this.name = p.name||'Computer';
			this.uuid = Symbol(this.name);
			
			this.modules = {
				network: new NetworkModule(this),
				radar: new RadarModule(this)
			};
			
			this._signal = null;
			this._cachModule = {};
			
			this._state = {};
			
			
			this._api_this = {};
			
			let process = new function() {
				this.exit = () => this.disable();
			};
			
			this._api_environment = {
				process,
				
				require: module => module in this._cachModule ? this._cachModule[module] : this._cachModule[module] = globalModules[module](this),
				
				Vector2, vec2, VectorN, vecN, EventEmitter,
				console, Math, JSON,
				Object, Array, Function, Number, String, BigInt, Symbol
			};
			this._api_environment.global = this._api_environment;
			
			this._mainProgram = codeFunction(p.mainProgram||Computer.defaultMainProgram, this._api_environment, 'main-'+p.name);
		}
		
		connectToSystem(systemInterface) {
			if(this.isSystemConnected) return;
			this.isSystemConnected = true;
			this._systemInterface = systemInterface;
		}
		
		enable() {
			this._mainProgram.apply(this._api_this, arguments);
		}
		disable() {
			if(this.modules.network) this.module.network.disable();
		}
	};
	
	
	let NetworkModule = this.NetworkModule = class extends EventEmitter {
		constructor({name, uuid, pos}) {
			super();
			this._pos = pos;
			this.name = name;
			this.uuid = uuid;
			
			this._signal = null;
			this._plaggable = null;
			
			this.status = 0,	// null, connect, distribute (0-2)
			this.connection = null;
			this.accessPoint = null;
			this.signal = null;
			this.connectionList = new Set();
		}
		
		connectToAccessPoint(signal, res, rej) {
			if(this.status === 2) return;
			if(this.status === 1 && this.connection) this.disconnectToAccessPoint();
			this.status = 1;
			
			let connection = null;
			
			let plaggable = Object.assign(new EventEmitter(), {
				sourceName: this.name,
				sourceUUID: this.uuid,
				send: data => delay(() => this.connection === connection && connection.emit('accept', data))
			});
			
			this._plaggable = plaggable;
			
			signal.connect(plaggable).then(([s, data]) => {
				if(!s) {
					rej(data);
					return;
				};
				
				connection = data;
				
				this.connection = connection;
				this.signal = signal;
				
				res(connection);
			});
		}
		disconnectToAccessPoint() {
			if(this.status !== 1) return;
			this.status = 0;
			
			this.signal.disconnect(this._plaggable);
			this.connection = null;
			this.signal = null;
		}
		detectAccessPoint() {
			return G.environment.accessPointsSignals.map(i => Object.assign({}, i));
		}
		
		enableAccessPoint() {
			if(this.status !== 0) return;
			this.status = 2;
			
			this.accessPoint = Object.assign(new EventEmitter(), {});
			
			this._signal = {
				sourceName: this.name,
				sourceUUID: this.uuid,
				
				connect: plaggable => {
					let connection = Object.assign(new EventEmitter(), {
						sourceName: this.name,
						sourceUUID: this.uuid,
						close: () => {
							
						},
						send: data => delay(() => this.status === 2 && this.connectionList.has(plaggable) && (plaggable.emit('accept', data) || this.accessPoint.emit('accept', data, plaggable)))
					});
					
					
					return delay(() => {
						let s = false;
						let error = '';
						
						this.accessPoint.emit('connection', (validate, err) => {
							s = validate(plaggable.sourceName, plaggable.sourceUUID);
							error = err;
						});
						
						if(s) {
							this.connectionList.add(plaggable);
							this.accessPoint.emit('connect', plaggable);
						};
						
						return [s, s ? connection : error];
					});
				},
				
				disconnect: plaggable => {
					this.connectionList.delete(plaggable);
					delay(() => this.accessPoint.emit('disconnect', plaggable));
				}
			};
			
			G.environment.accessPointsSignals.push(this._signal);
			
			return this.accessPoint;
		}
		disableAccessPoint() {
			if(this.status !== 2) return;
			
			let l = G.environment.accessPointsSignals.indexOf(this._signal);
			G.environment.accessPointsSignals.splice(l, 1);
			
			this.status = 0;
			this.connectionList.clear();
		}
		closeConnection(connection) {
			connection.emit('disconnect');
			this.connectionList.delete(connection);
		}
		banConnection(connection) {
			
		}
		
		disable() {
			if(this.status === 1) this.disconnectToAccessPoint();
			else if(this.status === 2) this.disableAccessPoint();
		}
	};
	
	
	let RadarModule = this.RadarModule = class extends EventEmitter {
		constructor({ name, uuid, pos }) {
			super();
			this._pos = pos;
			this.name = name;
			this.uuid = uuid;
			
			this.isEmitedSignal = false;
			this._signal = {};
			
			this._signal.name = this.name;
			this._signal.uuid = this.uuid;
			this._signal.pos = () => this.pos;
		}
		
		detect() {
			return G.environment.radarsSignals.map(i => Object.assign({}, i));
		}
		
		enableSignalEmulation() {
			if(this.isEmitedSignal) return;
			this.isEmitedSignal = true;
			G.environment.radarsSignals.push(this._signal);
		}
		disableSignalEmulation() {
			if(!this.isEmitedSignal) return;
			this.isEmitedSignal = false;
			let l = G.environment.radarsSignals.indexOf(this._signal);
			if(~l) G.environment.radarsSignals.splice(l, 1);
		}
	};
};
