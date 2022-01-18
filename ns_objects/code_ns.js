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
	
	
	const MODE_BLOB    = 0x000001;
	const MODE_TREE    = 0x000002;
	const MODE_SYMLINK = 0x000003;
	
	const TYPE_BLOB = 'blob';
	const TYPE_TREE = 'tree';
	
	const INDEX_MODE = 0;
	const INDEX_TYPE = 1;
	const INDEX_ID = 2;
	const INDEX_FILENAME = 3;
	
	
	let generateID = () => Number(String(Math.random()).replace('0.', '')).toString(16).padStart(14, '0');
	
	
	let FileSystem = class extends EventEmitter {
		constructor(id) {
			super();
			
			if(!String(id)) throw Error('invalid id');
			
			this._id = id;
			this.rootId = generateID();
			
			let storage = null;
			
			if(FileSystem._cacheStorage[this.id]) {
				storage = FileSystem._cacheStorage[this.id];
			} else if(storage = window.localStorage.getItem(this.id)) {
				storage = JSON.parse(storage);
			} else {
				storage = {};
				storage[this.rootId] = ``;
			};
			
			this._storage = storage;
			
			
			if(!FileSystem._cacheStorage[this.id]) {
				window.addEventListener('beforeunload', e => {
					window.localStorage.setItem(this.id, JSON.stringify(this._storage));
				});
				
				FileSystem._cacheStorage[this.id] = this._storage;
			};
		}
		
		get id() { return this._id; }
		
		getJSONtoPath(src) {
			
		}
		
		getDirFiles(id) { return this._storage[id].split('\n').filter(Boolean); }
		
		getIdByPath(src) {
			if(src === '/') return this.rootId;
			
			let id = '';
			
			let path = FileSystem.parsePath(src).path;
			
			
			let prevDirId = this.rootId;
			let dirId = this.rootId;
			
			for(let i = 0; i < path.length; i++) {
				let filename = path[i];
				let isTarget = i === path.length-1;
				
				let files = this.getDirFiles(dirId);
				
				for(let file of files) {
					let data = file.split(' ');
					
					if(data[INDEX_FILENAME] === filename) {
						dirId = data[INDEX_ID];
						break;
					};
				};
				
				if(dirId === prevDirId) return false;
				
				prevDirId = dirId;
				
				if(isTarget) id = dirId;
			};
			
			return id;
		}
		
		removeFileSync(src, error = console.error) {
			let parentPath = FileSystem.parsePath(src).path.slice(0, -1).join('/');
			
			let fileId = this.getIdByPath(src);
			let parentId = this.getIdByPath(parentPath);
			
			if(!fileId) return void error(Error(`path is empty "${fileId}"`));
			
			
			let files = this.getDirFiles(parentId);
			
			let l = files.findIndex(i => {
				let data = i.split(' ');
				return data[INDEX_ID] === fileId && data[INDEX_TYPE] === TYPE_BLOB;
			});
			
			if(!~l) return void error(Error(`пока что нельзя ужалять директории`));
			files.splice(l, 1);
			
			this._storage[parentId] = files.join('\n');
			delete this._storage[fileId];
			
			return true;
		}
			
		removeFile(src) {
			return new Promise((res, rej) => res(this.removeFileSync(src, rej)));
		}
		
		hasFileSync(src) { return Boolean(this.getIdByPath(src)); }
		hasFile(src) {
			return new Promise((res, rej) => res(this.hasFileSync(src)));
		}
		
		readFileSync(src, error = console.error) {
			let fileId = this.getIdByPath(src);
			
			if(!fileId) return void error(Error(`file not found "${src}"`));
			return this._storage[fileId];
		}
		
		readFile(src) {
			return new Promise((res, rej) => res(this.readFileSync(src, rej)));
		}
		
		writeFileSync(src, content = '', error = console.error) {
			if(typeof content !== 'string') return void error(Error('content is not a string'));
			
			let targetId = '';
			
			let path = FileSystem.parsePath(src).path;
			let filename = path.splice(-1, 1)[0];
			
			if(!filename) return void error(Error(`invalid path "${src}"`));
			
			let prevDirId = this.rootId;
			let dirId = this.rootId;
			
			for(let i = 0; i < path.length; i++) {
				let filename = path[i];
				
				let files = this.getDirFiles(dirId);
				
				for(let file of files) {
					let data = file.split(' ');
					
					if(data[INDEX_FILENAME] === filename) {
						dirId = data[INDEX_ID];
						break;
					};
				};
				
				if(dirId === prevDirId) {
					dirId = generateID();
					
					this._storage[prevDirId] += FileSystem.generateFile(MODE_TREE, TYPE_TREE, dirId, filename);
					this._storage[dirId] = '';
				};
				
				prevDirId = dirId;
			};
			
			
			let blobId = generateID();
			
			this._storage[dirId] += FileSystem.generateFile(MODE_BLOB, TYPE_BLOB, blobId, filename);
			this._storage[blobId] = content;
			
			return true;
		}
		
		writeFile(src, content = '') {
			return new Promise((res, rej) => res(this.writeFileSync(src, content, rej)));
		}
		
		readDirSync(src, error = console.error) {
			let res = [];
			
			let dirId = this.getIdByPath(src);
			if(!dirId) return false;
			
			
			let files = this.getDirFiles(dirId);
			
			for(let file of files) {
				let data = file.split(' ');
				res.push(data[INDEX_FILENAME]);
			};
			
			return res;
		}
		
		readDir(src, error) {
			return new Promise((res, rej) => res(this.readDirSync(src, rej)));
		}
		
		
		static generateFile(mode, type, id, filename) {
			mode = String(mode.toString(16)).padStart(6, '0');
			return `${mode} ${type} ${id} ${filename}\n`;
		}
		
		static parsePath = src => {
			let data = {};
			
			data.src = src;
			data.path = src.split(/\//).filter(Boolean);
		//	data.path = src.split(/\/(?!\/)[^\/]/).filter(Boolean);
		//	console.log(src, data.path);
			
			
		//	data.root = path[0]; // host port protocol
			
		//	data.isRoot = path[0] === '/';
			
			return data;
		};
		
		static _cacheStorage = {};
	};
	
	
	/*
	let fs = new FileSystem('test_fs');
	
	fs.writeFileSync('root/dir/test.txt', 'content kelsldllelsd ekekemd dekms ee');
	let fff = fs.readFileSync('root/dir/test.txt');
	
	console.log(fs._storage);
	console.log(fff);
	
	console.log('directory', fs.readDirSync('root'));
	
	console.log(JSONcopy(fs._storage));
	console.log(fs.removeFileSync('root/dir/test.txt'));
	console.log(JSONcopy(fs._storage));
	*/
	
	
	
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
				
				if(!module?.exports) throw Error('module "' + name + '" is not found');
				
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
