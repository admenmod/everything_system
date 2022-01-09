'use strict';
let code_ns = new function() {
	const BASE_API = {
		Vector2, vec2, VectorN, vecN, EventEmitter, random, JSONcopy,
		
		setTimeout: (cb, ...args) => setTimeout(cb.bind({}), ...args), clearTimeout: clearTimeout.bind(globalThis),
		setInterval: (cb, ...args) => setInterval(cb.bind({}), ...args), clearInterval: clearInterval.bind(globalThis),
		
		Promise, Proxy, WeakRef, FinalizationRegistry,
		console, Date, Math, JSON, Set, Map, WeakSet, WeakMap,
		Object, Array, Function, Number, String, RegExp, BigInt, Symbol
	};
	
	
	let delay = (cb, time = 0, ...args) => new Promise(res => {
		let t = setTimeout(() => {
			clearTimeout(t);
			res(cb(...args));
		}, time);
	});
	window.delay = delay;
	
	
	let FileSystem = class extends EventEmitter {
		constructor(id) {
			super();
			
			if(!String(id)) throw Error('invalid id');
			this.id = id;
			
			let storage = window.localStorage.getItem(this.id);
			if(storage) this.storage = JSON.parse(storage);
			else this.storage = {};
			
			if(!FileSystem._cached[this.id]) {
				window.addEventListener('beforeunload', e => window.localStorage.setItem(this.id, JSON.stringify(this.storage)));
				FileSystem._cached[this.id] = 1;
			};
		}
		
		removeFileSync(src) { return delete this.storage[src]; }
		removeFile(src) {
			return new Promise((res, rej) => res(this.removeFileSync(src)));
		}
		
		hasFileSync(src) { return src in this.storage; }
		hasFile(src) {
			return new Promise((res, rej) => res(this.hasFileSync(src)));
		}
		
		readFileSync(src) { return this.storage[src]; }
		readFile(src) {
			return new Promise((res, rej) => res(this.readFileSync(src)));
		}
		
		writeFileSync(src, content = '') {
			if(typeof content !== 'string') throw Error('content is not a string');
			return this.storage[src] = content;
		}
		writeFile(src, content = '') {
			return new Promise((res, rej) => res(this.writeFileSync(src, content)));
		}
		
	//	readDir() {}
		
		static _cached = {};
	};
	
	
	let NameSpace = class extends EventEmitter {
		constructor() {
			super();
		}
	};
	
	
	let VirtualEnv = this.VirtualEnv = class extends EventEmitter {
		constructor(fs_id = 'fs_storage') {
			super();
			
			let namespace = this.namespace = new NameSpace();
			namespace.PATH = '/';
			
			let fs = this.fs = new FileSystem(fs_id);
			fs.on('changedir', path => namespace.PATH = path);
			
			this.globalModules = {};
			this.createModule('fs', global => ({ exports: fs, filename: 'fs' }));
		}
		
		createModule(name, module) {
			return this.globalModules[name] = module;
		}
		
		createProcess() {
			let moduleCache = [];
			
			let runScript = filepath => {
				global.__proto__ = {
					module: {
						exports: {},
						filename: filepath
					}
				};
				
				codeShell(this.fs.readFileSync(filepath), global, { source: filepath }).call({});
				
				return global.module;
			};
			
			
			let process = {
				env: { ...this.namespace }
			};
			
			let require = name => {
				let module = null;
				
				if(name in moduleCache) module = moduleCache[name];
				else if(name in this.globalModules) module = this.globalModules[name](global);
				else if(this.fs.hasFileSync(name)) module = runScript(name);
				
				if(!module.exports) throw Error('module "' + name + '" is not found');
				
				moduleCache[name] = module;
				return module.exports;
			};
			
			
			let global = {
				require,
				process,
				
				...BASE_API
			};
			global.global = global;
			
			
			return runScript;
		}
		
		run(filepath) {
			this.createProcess()(filepath);
		}
	};
};
