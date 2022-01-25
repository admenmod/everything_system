'use strict';
let components_ns = new function() {
	let { VirtualEnv } = code_ns;
	let { CommunicationEnvironment, AccessPoint } = comenv_ns;
	
	let world = new CommunicationEnvironment();
	
	
	let Processor = this.Processor = class extends EventEmitter {
		constructor(super_this, p = {}) {
			super();
			this.uuid = generateID();
			this.isEnabled = false;
			
			this.virenv = new VirtualEnv(`fs_storage[uuid:${this.uuid}]`);
			this.virenv.namespace.UUID = this.uuid;
			
			this.virenv.fs.writeFileSync('main.js', p.main_script);
			
			
			this._getpos = () => super_this.globalPosition;
			
			this.modules = {};
			this.connectModule(GUIModule, super_this);
			this.connectModule(RadioModule, super_this);
			this.connectModule(NetworkModule, super_this);
		}
		
		connectModule(Module, super_this) {
			this.modules[Module.NAME] = new Module(super_this);
			this.virenv.appendModule(Module.NAME, this.modules[Module.NAME].module_exports());
		}
		
		enable() {
			if(this.isEnabled) return;
			
			for(let i in this.modules) this.modules[i].enable();
			
			this.isEnabled = false;
			this.virenv.run('main.js');
			this.emit('enable');
		}
		
		disable() {
			if(!this.isEnabled) return;
			
			this.isEnabled = false;
			this.emit('disable');
		}
	};
	
	
	/*
		структура модуля
		
		имя -> путь файла
		способ получения api
		модули / свойства
	*/
	
	let GUIModule = this.GUIModule = class extends EventEmitter {
		static NAME = 'gui';
		
		constructor(super_this) {
			super();
			this.isEnabled = false;
			
			this._getpos = () => super_this.globalPos;
		}
		
		enable() {
			if(this.isEnabled) return;
			
			this.isEnabled = true;
			this.emit('enable');
		}
		
		disable() {
			if(!this.isEnabled) return;
			
			this.isEnabled = false;
			this.emit('disable');
		}
		
		module_exports() {
			return global => {
				let module = new EventEmitter();
				
				module.sey = (cb, time) => {
					let pos = this._getpos();
					
					let ii = ctx => cb(ctx, pos);
					globalThis.enarr.push(ii);
					
					let iii = setTimeout(() => {
						let l = globalThis.enarr.indexOf(ii);
						if(~l) globalThis.enarr.splice(l, 1);
						
						clearTimeout(iii);
					}, time);
				};
				
				return { exports: module, filename: GUIModule.NAME };
			};
		}
	};
	
	globalThis.enarr = [];
	
	
	
	let RadioModule = this.RadioModule = class extends EventEmitter {
		static NAME = 'radio';
		
		constructor(super_this) {
			super();
			this.isEnabled = false;
			
			this._availableSignals = [];
			
			this._getpos = () => super_this.globalPos;
			
			this.config = Object.assign({
				radius: 0
			}, super_this.modulesInfo['radio'] || {});
		}
		
		get coverageRadius() { return this.config.radius; }
		
		
		enable() {
			if(this.isEnabled) return;
			
			//*
			let h_pushSignal = signal => {
				// fixme: неучитывается движение, подумать надресурсами для вычисления октуального состаяния
				let distance = this._getpos().getDistance(signal._getpos());
				
				if(distance > this.coverageRadius) return;
				
				let info = {
					distance
				};
				
				this._availableSignals[signal.uuid];
				signal.once('destroy', () => delete this._availableSignals[signal.uuid]);
				
				delay(() => this.emit('detect', signal, info), distance);
			};
			
			world.on('push:signal', h_pushSignal);
			
			this.once('disable', () => {
				world.off('push:signal', h_pushSignal);
			});
			//*/
			
			this.isEnabled = true;
			this.emit('enable');
		}
		
		disable() {
			if(!this.isEnabled) return;
			
			this.isEnabled = false;
			this.emit('disable');
		}
		
		emitSignal(p) {
			if(!this.isEnabled) return;
			
			let signal = world.pushSignal(p, this._getpos);
			
			this.once('disable', signal.emit('destroy'));
			
			return signal.uuid;
		}
		
		revokeSignal(signalUUID) {
			if(!this.isEnabled) return;
			
			world.removeSignal(signalUUID);
		}
		
	//	мысль вынести логику проверки в таймауте получать детект
		detectSignals() {
			if(!this.isEnabled) return;
			
			return world.signals.filter(signal => {
				let distance = signal._getpos().getDistance(this._getpos());
				return distance < this.coverageRadius;
			});
		}
		
		module_exports() {
			return global => {
				let module = new EventEmitter();
				
				module.enable = (...args) => this.enable(...args);
				module.disable = (...args) => this.disable(...args);
				
				module.emitSignal = (...args) => this.emitSignal(...args);
				module.revokeSignal = (...args) => this.revokeSignal(...args);
				
				module.detectSignals = (...args) => this.detectSignals().map(signal => signal.getPublicObject());
				
				
				this.on('enable', (...args) => module.emit('enable', ...args))
				this.on('disable', (...args) => module.emit('disable', ...args))
				
				this.on('detect', (signal, ...args) => module.emit('detect', signal.getPublicObject(), ...args));
				
				
				return { exports: module, filename: RadioModule.NAME };
			};
		}
	};
	
	
	
	
	(function() {
		let rad1 = new RadioModule();
		let rad2 = new RadioModule();
		
		rad1.emitSignal({
			info: { name: 'main_server', isServer: true, public_key: '444444' },
			data: { accessPoints_id: 112222 },
			verify: key => key === '444444'
		});
		
		let signal = rad2.detectSignals().find(({ info }) => info.isServer);
		console.log(signal);
		
		console.log('data: ', signal.getData('444444'));
		
	//	console.log(world.getById(data.accessPoints_id));
	});
	
	
	
	
	let NetworkModule = this.NetworkModule = class extends EventEmitter {
		static NAME = 'network';
		
		constructor(super_this) {
			super();
			this.uuid = generateID();
			
			this._getpos = () => super_this.globalPos;
			
			
			this.accessPoint = new AccessPoint();
			
			this.connectionMode = null;
			this.status = 0;	// null, connect, distribute (0-2)
		//	this.connections = new Set();
			
		//	this._signalUUID = null;
		//	this._connectionObject = null;
		}
		
		enable() {
			this.isEnabled = true;
			this.emit('enable');
		}
		
		disable() {
			this.isEnabled = false;
			this.disableAccessPoint();
			
			this.emit('disable');
		}
		
		enableAccessPoint({ mode }) {
			if(!this.isEnabled || this.status !== 0) return;
			this.status = 2;
			
			console.log('mode: ', mode);
			
			this.accessPoint.setMode(mode || AccessPoint.AD_HOC_MODE);
			this.accessPoint.enable();
			
			
		/*	let radio = this.super_this.modules[RadioModule.NAME];
			radio.emitSignal({
				info: {
					isAccessPoint: true
				}
			});
		});*/
			
			
		//	console.log('создание Signal');
		}
		
		disableAccessPoint() {
			if(!this.isEnabled) return;
			
			this.accessPoint.disable();
		}
		
		/*
			создание соединения
			и на стороне клиента и на стороне сервера
		*/
		connect(signal) {
			if(!this.isEnabled) return;
			
			return;
		}
		
		disconnect() {
			if(!this.isEnabled) return;
			
		}
		
		detectAccessPoint() {
			if(!this.isEnabled) return;
			
			return global_ns.worldEnv.signals.filter(i => i.isAccessPoint);
		}
		
		module_exports() {
			return global => {
				let module = new EventEmitter();
				
				return { exports: module, filename: 'network' };
			};
		}
	};
	
	
	console.log('============================================================');
	/*
	let net1 = new NetworkModule();
	let net2 = new NetworkModule();
	
	net1.enable();
	net2.enable();
	
	net1.enableAccessPoint();
	
	let signal = net2.detectAccessPoint(i => console.log(JSON.parse(i.data).uuid) || 1)[0];
	console.log(signal);
	
	let con = net2.connect(signal);
	
	con.on('send', function(req) {
		console.log(req);
	});
	*/
	
	
		/*
		detectAccessPoint() {
			return global_ns.worldEnv.signals.accessPoints.map(i => Object.assign({}, i));
		}
		
		connect(signal, res, rej = err => console.log(err)) {
			if(this.status === 2) return;
			if(this.status === 1) this.disconnect();
			this.status = 1;
			
			let connection = null;
			
			let plaggable = Object.assign(new EventEmitter(), {
			//	sourceName: this.name,
			//	sourceUUID: this.uuid,
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
		
		enableAccessPoint(pos) {
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
			
			this._signal = new Signal(pos);
			global_ns.worldEnv.signals.accessPoints.push(this._signal);
			
			this._accessPointObject = accessPoint;
			
			return accessPoint;
		}
		
		disableAccessPoint() {
			if(this.status !== 2) return;
			
			let l = global_ns.worldEnv.signals.accessPoints.indexOf(this._signal);
			if(~l) global_ns.worldEnv.signals.accessPoints.splice(l, 1);
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
		
		module_exports() {
			return global => {
				let module = new EventEmitter();
				
				[
					'detectAccessPoint', 'connect', 'disconnect',
					'enableAccessPoint', 'disableAccessPoint',
					'getStatus', 'getConnections', 'getConnectionObject', 'getAccessPointObject'
				].forEach(i => module[i] = (...args) => this[i](...args));
				
				return { exports: module, filename: 'network' };
			};
		}
	};
	//*/
};
