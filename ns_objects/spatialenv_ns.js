'use strict';
let spatialenv_ns = new function() {
	let replaceToN = z => String(z).replace('0.', '');
	window.getSid = () => Math.random();
	window.generateID = () => replaceToN(getSid()) +''+ replaceToN(Math.abs(Math.sin(performance.now())));
	
	
	class Signal extends EventEmitter {
		constructor(p, getpos) {
			super();
			this.uuid = generateID();
			
			this.getpos = getpos;
			
			this._info = JSONcopy(p.info);
			this._data = JSONcopy(p.data);
			this.verification = p.verification || (key => key);
			
			this.getData = (...args) => this.verification(...args) && this.data;
		}
		
		get info() { return JSONcopy(this._info); }
		get data() { return JSONcopy(this._data); }
		
		getPublicObject() {
			return { info: this.info, getData: this.getData };
		}
	};
	
	
	class Connection extends EventEmitter {
		constructor() {
			super();
			
			this.isConnected = false;
			this._connection = null;
		}
		
		send(data) {
			if(!this.isConnected) return;
			
		//	this._connection.onsend(data);
			this._connection.emit('send', data);
		}
		
		close() {
			if(!this.isConnected) return;
			this.isConnected = false;
			
			this._connection.close();
			this._connection = null;
		}
		
		bind(connection) {
			if(this.isConnected) return;
			this.isConnected = true;
			
			this._connection = connection;
			this._connection.bind(this);
			
			return this;
		}
	};
	
	
	let SpatialEnvironment = this.SpatialEnvironment = class extends EventEmitter {
		constructor() {
			super();
			
			this.signals = [];
		}
		
		pushSignal(p, getpos) {
			let signal = new Signal(p, getpos);
			this.signals.push(signal);
			
			signal.once('destroy', () => this.removeSignal(signal));
			
			this.emit('push:signal', signal);
			
			return () => signal.emit('destroy');
		}
		
		removeSignal(signal) {
			let l = this.signals.indexOf(signal);
			if(!~l) return;
			
			this.signals.splice(l, 1);
			this.emit('remove:signal', signal);
		}
		
		getSignals() { return this.signals.map(i => i); }
	};
	
	
	let AccessPoint = this.AccessPoint = class extends EventEmitter {
		constructor() {
			super();
			
			this.id = generateID();
			
			this._ = {};
			
			this._.publicInfo = {
				id: this.id
			};
		}
		
		enable() {
			this.emit('enable');
			
			let h = signal => this.emit('detect', signal.getPublicObject());
			
			worldAccessPoint.on('push:signal', h);
			this.once('disable', () => worldAccessPoint.off('push:signal', h));
		}
		
		disable() {
			this.emit('disable');
		}
		
		pushSignal(signal) {
			worldAccessPoint.pushSignal(signal);
		}
		
		detectSignals() {
			return worldAccessPoint.signals.map(i => i.getPublicObject());
		}
	};
	
	
	let worldAccessPoint = new SpatialEnvironment();
	
	// fixme: rename AccessPoint to "приемник, радар"
	(function() {
		let accessPoint1 = new AccessPoint();
		let accessPoint2 = new AccessPoint();
		
		accessPoint1.enable();
		accessPoint2.enable();
		
		
		accessPoint1.on('detect', ({ info, getData }) => {
			console.log(info, accessPoint1.id);
			console.log(accessPoint1.id === info.id);
			console.log(getData(info.key+'11'));
		});
		
		
		accessPoint2.pushSignal({
			verification: key => key === '3333311',
			info: {
				key: '33333',
				...accessPoint2._.publicInfo
			},
			data: {
				data: 'BIGDATA'
			}
		});
		
		accessPoint1.disable();
		accessPoint2.disable();
	});
	
	
	
	
	let reg = new WeakMap();
	
	let Rrr = class {
		constructor(unit) {
			this.xx = 39
			
			reg.add(this, Object.assign({
				unit: unit
			}));
		}
		
		up() {
			let priv = reg.get(this);
			console.log(priv);
		}
	};
};
