'use strict';
let code_ns = new function() {
	let delay = cb => new Promise(res => {
		let t = setTimeout(() => {
			clearTimeout(t);
			res(cb());
		}, 0);
	});
	
	
	let globalModules = {
		network(self) {
			let module = new EventEmitter();
			
			let m = self.modules.network;
			if(!m) return module;
			
			[
				'detectAccessPoint', 'connect', 'disconnect',
				'enableAccessPoint', 'disableAccessPoint',
				'getStatus', 'getConnections', 'getConnectionObject', 'getAccessPointObject'
			].forEach(i => module[i] = (...args) => m[i](...args));
			
			return module;
		},
		radar(self) {
			let module = new EventEmitter();
			
			let m = self.modules.radar;
			if(!m) return module;
			
			[
				'detect', 'enableSignalEmulation', 'disableSignalEmulation'
			].forEach(i => module[i] = (...args) => m[i](...args));
			
			return module;
		},
		system(self) {
			let module = new EventEmitter();
			
			module.getSystemInterface = () => self._systemInterface||null;
			let si = self._systemInterface;
			
		//	si.on('update', e => module.emit('update', e));
			
			self._iInterval = setInterval(() => self._systemInterface.emit('update', self._systemInterface._newEventAPI()), 1000/20);
			
			return module;
		}
	};
	
	
	let Processor = this.Processor = class extends EventEmitter {
		constructor(p = {}) {
			super();
			this._pos = vec2();
			
			this.name = p.name||'Processor';
			this.uuid = Symbol(this.name);
			
			this.modules = {
				network: new NetworkModule(this),
				radar: new RadarModule(this)
			};
			
			this._cacheModules = {};
			
			this._state = {};
			this._systemInterface = null;
			this._isSystemConnected = false;
			
			
			let process = new function() {
				this.exit = () => this.disable();
			};
			
			this._api_this = {};
			
			this._api_environment = {
				process,
				
				require: module => module in this._cacheModules ? this._cacheModules[module] : this._cacheModules[module] = globalModules[module](this),
				
				Vector2, vec2, VectorN, vecN, EventEmitter, random, JSONcopy,
				Promise, Proxy, WeakRef,
				console, Date, Math, JSON, Set, Map, WeakSet, WeakMap,
				Object, Array, Function, Number, String, RegExp, BigInt, Symbol
			};
			this._api_environment.global = this._api_environment;
			
			Object.freeze(this._api_environment);
			this._mainProgram = codeShell(p.mainProgram||Processor.defaultMainProgram, this._api_environment, 'main-'+p.name);
		}
		
		connectToSystem(systemInterface) {
			if(this._isSystemConnected) return;
			this._isSystemConnected = true;
			this._systemInterface = systemInterface;
		}
		disconnectToSystem() {
			if(!this._isSystemConnected) return;
			this._isSystemConnected = false;
			this._systemInterface = null;
		}
		
		enable() {
			this._mainProgram.apply(this._api_this);
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
			this._accessPointObject = null;
			this._connectionObject = null;
			
			this.status = 0,	// null, connect, distribute (0-2)
			this.connections = new Set();
		}
		
		detectAccessPoint() {
			return global_ns.environment.accessPointsSignals.map(i => Object.assign({}, i));
		}
		
		connect(signal, res, rej = err => this._api_environment.console.log(err)) {
			if(this.status === 2) return;
			if(this.status === 1) this.disconnect();
			this.status = 1;
			
			let connection = null;
			
			let plaggable = Object.assign(new EventEmitter(), {
				sourceName: this.name,
				sourceUUID: this.uuid,
				isConnected: true,
				close: () => {
					if(!plaggable.isConnected) return;
					plaggable.isConnected = false;
					
					delay(() => connection.emit('disconnect', connection));
					connection.close();
				},
				send: data => delay(() => plaggable.isConnected && this.status === 1 && connection.emit('accept', data))
			});
			
			signal.connect(plaggable).then(([err, data]) => {
				if(err) return rej(err);
				
				this.connections.add(connection = data);
				res(connection);
			});
		}
		disconnect() {
			if(this.status !== 1) return;
			this.status = 0;
			
			this._connectionObject = null;
			
			this.connections.clear();
		}
		
		enableAccessPoint() {
			if(this.status !== 0) return;
			this.status = 2;
			
			let accessPoint = Object.assign(new EventEmitter(), {});
			
			this._signal = {
				sourceName: this.name,
				sourceUUID: this.uuid,
				
				connect: plaggable => {
					let connection = Object.assign(new EventEmitter(), {
						sourceName: this.name,
						sourceUUID: this.uuid,
						isConnected: true,
						close: () => {
							if(!connection.isConnected) return;
							connection.isConnected = false;
							
							this.connections.delete(plaggable);
							delay(() => accessPoint.emit('disconnect', plaggable));
							plaggable.close();
						},
						send: data => delay(() => plaggable.isConnected && this.status === 2 && (plaggable.emit('accept', data) || accessPoint.emit('accept', data, plaggable)))
					});
					
					
					return delay(() => {
						let reasonForDenial = '',
							allowed = false;
						
						accessPoint.emit('connecting', () => {	// allow
							allowed = true;
						}, reason => {	// deny
							reasonForDenial = reason||'access denied';
						}, { name: plaggable.sourceName, uuid: plaggable.sourceUUID });
						
						if(!reasonForDenial && allowed) {
							this.connections.add(plaggable);
							accessPoint.emit('connect', plaggable);
						};
						
						return [reasonForDenial, connection];
					});
				}
			};
			
			G.environment.accessPointsSignals.push(this._signal);
			
			this._accessPointObject = accessPoint;
			
			return accessPoint;
		}
		disableAccessPoint() {
			if(this.status !== 2) return;
			
			let l = G.environment.accessPointsSignals.indexOf(this._signal);
			if(~l) G.environment.accessPointsSignals.splice(l, 1);
			else console.error('access point signal not found');
			
			this.status = 0;
			this.connections.clear();
			
			this._accessPointObject = null;
		}
		// todo: [o]
		closeConnection() {
			
		}
		
		getStatus() { return this.status; }
		getAccessPointObject() {
			if(this.status !== 2) return null;
			return this._accessPointObject;
		}
		getConnectionObject() {
			if(this.status !== 1) return null;
			return this._connectionObject;
		}
		
		disable() {
			if(this.status === 1) this.disconnectToAccessPoint();
			else if(this.status === 2) this.disableAccessPoint();
		}
	};
	
	
	let RadarModule = this.RadarModule = class extends EventEmitter {
		constructor({name, uuid, pos}) {
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
