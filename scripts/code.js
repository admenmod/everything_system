'use strict';
let Code = new function() {
	let globalModules = {
		network(self) {
			let module = new EventEmitter();
			
			module.connect = signal => self.connectToAccessPoint(signal);
			module.disconnect = () => self.disconnectToAccessPoint();
			module.detectAccessPoint = () => self.detectAccessPoint();
			
			module.enableAccessPoint = () => self.enableAccessPoint();
			module.disableAccessPoint = () => self.disableAccessPoint();
			
			
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
			
			this.name = p.name||'Computer';
			this.uuid = Symbol(this.name);
			
			
			this._signal = null;
			this._cachModule = {};
			
			this._state = {
				
			};
			
			this._connection = Object.assign(new EventEmitter(), {
				status: 0,	// null, connect, distribute (0-2)
				connection: null,
				accessPoint: null,
				signal: null,
				list: new Set()
			});
			
			
			this._api_this = {};
			
			let process = new function() {
				this.exit = () => this.disable();
			};
			
			this._api_environment = {
				process,
				
				require: module => module in this._cachModule ? this._cachModule[module] : this._cachModule[module] = globalModules[module](this),
				
				Vector2, vec2, VectorN, vecN, EventEmitter,
				JSON,
				Object, Array, Function, Number, String, BigInt, Symbol
			};
			
			this._mainProgram = codeFunction(p.mainProgram||Computer.defaultMainProgram, this._api_environment, 'main-'+p.name);
		}
		
		connectToAccessPoint(signal) {
			if(this._connection.status === 2) return;
			if(this._connection.connection) this.disconnectToAccessPoint();
			this._connection.status = 1;
			
			let connection = null;
			
			let plaggable = Object.assign(new EventEmitter(), {
				sourceName: this.name,
				sourceUUID: this.uuid,
				send: data => this._connection.connection === connection && connection.emit('accept', data)
			});
			
			connection = signal.connect(plaggable);
			
			this._connection.connection = connection;
			this._connection.signal = signal;
			
			return connection;
		}
		disconnectToAccessPoint() {
			if(this._connection.status === 2) return;
			this._connection.status = 0;
			
			this._connection.signal.disconnect();
			this._connection.connection = null;
			this._connection.signal = null;
		}
		detectAccessPoint() {
			return G.eviroment.signals.map(i => Object.assign({}, i));
		}
		
		enableAccessPoint() {
			if(this._connection.status !== 0) return;
			this._connection.status = 2;
			
			
			this._connection.accessPoint = Object.assign(new EventEmitter(), {});
			
			this._signal = {
				sourceName: this.name,
				sourceUUID: this.uuid,
				
				connect: plaggable => {
					let connection = Object.assign(new EventEmitter(), {
						sourceName: this.name,
						sourceUUID: this.uuid,
						send: data => this._connection.status === 2 && this._connection.list.has(connection) && connection?.emit('accept', data) && this._connection.accessPoint.emit('accept', data, connection)
					});
					
					this._connection.list.add(connection);
					this._connection.accessPoint.emit('connect', connection);
					
					return connection;
				},
				disconnect: () => {
					let connection = [...this._connection.list][this._connection.list.size-1];
					this._connection.list.delete(connection);
					this._connection.accessPoint.emit('disconnect', connection);
				}
			};
			
				
			return this._connection.accessPoint;
		}
		disableAccessPoint() {
			if(this._connection.status !== 2) return;
			
			this._connection.status = 0;
			this._connection.list.clear();
		}
		
		enable() {
			this._mainProgram.apply(this._api_this, arguments);
		}
		disable() {
			
		}
	};
};