'use strict';
let components_ns = new function() {
	let { VirtualEnv } = code_ns;
	let { SpatialEnvironment, AccessPoint } = spatialenv_ns;
	
	let world = new SpatialEnvironment();
	
	
	/*
		создается:
			юнит
			процессор
			модульи
			
		инициализируется:
			процесор
			модули
	*/
	
	let Processor = this.Processor = class extends EventEmitter {
		constructor(p = {}) {
			super();
			this.uuid = generateID();
			
			this.virenv = new VirtualEnv(`fs_storage[uuid:${this.uuid}]`);
			this.virenv.namespace.UUID = this.uuid;
			
			this.virenv.fs.writeFileSync('main.js', p.main_script);
			
			
			this._getpos = p.getpos;
			
			this.modules = {};
			this.connectModule(GUIModule);
			this.connectModule(RadioModule);
			this.connectModule(NetworkModule);
		}
		
		connectModule(Module) {
			this.modules[Module.NAME] = new Module(this);
			this.virenv.createModule(Module.NAME, this.modules[Module.NAME].module_exports());
		//	this.virenv.fs.writeFileSync('system/network', );
		}
		
		enable() {
			for(let i in this.modules) this.modules[i].enable();
			
			this.virenv.run('main.js');
			this.emit('enable');
		}
		
		disable() {
			this.emit('disable');
		}
	};
	
	
	let GUIModule = this.GUIModule = class extends EventEmitter {
		static NAME = 'gui';
		
		constructor(super_this) {
			super();
			
			this._getpos = super_this._getpos;
		}
		
		enable() {
			this.emit('enable');
		}
		
		disable() {
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
				
				return { exports: module, filename: 'gui' };
			};
		}
	};
	
	globalThis.enarr = [];
	
	
	
	let RadioModule = this.RadioModule = class extends EventEmitter {
		static NAME = 'radio';
		
		constructor(super_this) {
			super();
			
			this._getpos = super_this._getpos;
			
			
			let h_pushSignal = signal => {
				let distance = this._getpos().getDistance(signal.getpos());
				
				delay(() => this.emit('detect', signal, { distance }), distance);
			};
			
			world.on('push:signal', h_pushSignal);
			
			this.once('disable', () => {
				world.off('push:signal', h_pushSignal);
			});
		}
		
		enable() { this.emit('enable'); }
		disable() { this.emit('disable'); }
		
		emitSignal(p) {
			let destroy = world.pushSignal(p, this._getpos);
			
			this.once('disable', destroy);
		}
		
		detectSignals() { return world.getSignals(); }
		
		module_exports() {
			return global => {
				let module = new EventEmitter();
				
				let dd = (name, a) => module[name] = (...args) => this[a||name](...args);
				
				dd('enable');
				dd('disable');
				dd('emitSignal');
				dd('detectSignals');
				
				
				this.on('enable', (...args) => module.emit('enable', ...args))
				this.on('disable', (...args) => module.emit('disable', ...args))
				
				this.on('detect', (signal, ...args) => module.emit('detect', signal.getPublicObject(), ...args));
				
				
				return { exports: module, filename: 'radio' };
			};
		}
	};
	
	
	
	
	(function() {
		let rad1 = new RadioModule();
		let rad2 = new RadioModule();
		
		rad1.emitSignal({
			info: { name: 'main_server', isServer: true, public_key: '444444' },
			data: { accessPoints_id: 112222 },
			verification: key => key === '444444'
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
			
			this._getpos = super_this._getpos;
			
			const INFRASTRUCTURE_MODE = 'infrastructure';
			const AD_HOC_MODE = 'ad-hoc';
			
			this.connectionMode = null;
			this.status = 0;	// null, connect, distribute (0-2)
		//	this.connections = new Set();
			
		//	this._signal = null;
		//	this._accessPointObject = null;
		//	this._connectionObject = null;
		}
		
		enable() {
			this.emit('enable');
		}
		
		disable() {
			this.emit('disable');
		}
		
		enableAccessPoint({ mode }) {
			if(this.status !== 0) return;
			this.status = 2;
			
			console.log('mode: ', mode);
			
			// console.log('создание accessPoint');
			// let accessPoint = new AccessPoint();
			
		//	console.log('создание Signal');
			
			
			return ;
		}
		
		disableAccessPoint() {
			
		}
		
		/*
			создание соединения
			и на стороне клиента и на стороне сервера
		*/
		connect(signal) {
			
			return;
		}
		
		disconnect() {
			
		}
		
		detectAccessPoint(findSignal) {
			return global_ns.worldEnv.signals.accessPoints.filter(i => findSignal({ ...i }));
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
