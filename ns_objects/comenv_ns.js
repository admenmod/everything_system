'use strict';
let comenv_ns = new function() {
	let replaceToN = z => String(z).replace('0.', '');
	window.getSeed = () => Math.random();
	window.generateID = () => replaceToN(getSeed()) +''+ replaceToN(Math.abs(Math.sin(performance.now())));
	
	
	class Signal extends EventEmitter {
		constructor(p, getpos) {
			super();
			this.uuid = generateID();
			
			this._getpos = getpos;
			
			this._info = JSONcopy(p.info);
			this._data = JSONcopy(p.data);
			this.verify = p.verify || (key => key);
			
			this.getData = (...args) => this.verify(...args) && this.data;
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
	
	
	let CommunicationEnvironment = this.CommunicationEnvironment = class extends EventEmitter {
		constructor() {
			super();
			
			this.signals = [];
		}
		
		pushSignal(p, getpos) {
			let signal = new Signal(p, getpos);
			this.signals.push(signal);
			
			signal.once('destroy', () => this.removeSignal(signal));
			
			this.emit('push:signal', signal);
			
			return signal;
		}
		
		removeSignal(signalUUID) {
			let l = this.signals.findIndex(i => i.uuid === signalUUID);
			if(!~l) return;
			
			let signal = this.signals.splice(l, 1)[0];
			this.emit('remove:signal', signal.info, { position: signal._getpos() });
		}
		
		getSignals() { return this.signals.map(i => i); }
	};
	
	
	let AccessPoint = this.AccessPoint = class extends EventEmitter {
		constructor() {
			super();
			
			this.id = generateID();
			this.isEnabled = false;
			
			this.connectionMode = AccessPoint.AD_HOC_MODE;
			
			this._ = {};
			
			this._.publicInfo = {
				id: this.id
			};
		}
		
		enable() {
		//	let h = signal => this.emit('detect', signal.getPublicObject());
			
		//	worldAccessPoint.on('push:signal', h);
		//	this.once('disable', () => worldAccessPoint.off('push:signal', h));
			
			this.isEnabled = true;
			this.emit('enable');
		}
		
		disable() {
			this.isEnabled = false;
			this.emit('disable');
		}
		
		setMode(mode) {
			if(this.isEnabled) return;
			if(mode !== AccessPoint.AD_HOC_MODE || mode !== AccessPoint.INFRASTRUCTURE_MODE) {
				return console.error('invalid mode "'+mode+'"');
			};
			
			this.connectionMode = mode;
		}
		
		pushSignal(signal) {
			if(!this.isEnabled) return;
			
		//	worldAccessPoint.pushSignal(signal);
		}
		
		detectSignals() {
			if(!this.isEnabled) return;
			
		//	return worldAccessPoint.signals.map(i => i.getPublicObject());
		}
		
		static AD_HOC_MODE = 'ad-hoc';
		static INFRASTRUCTURE_MODE = 'infrastructure';
	};
	
	
	let worldAccessPoint = new CommunicationEnvironment();
	
	
	
	(function() {
		let accessPoint1 = new AccessPoint();
		let accessPoint2 = new AccessPoint();
		
		accessPoint1.enable();
		accessPoint2.enable();
		
		
		
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
