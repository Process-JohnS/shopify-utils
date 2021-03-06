
import * as fs from 'fs-extra';
import * as path from 'path';



interface ICacheParams {
	cacheDir: string;
	overwrite?: Boolean;
}

interface IRootCacheParams extends ICacheParams {
	parentCache?: Cache;
}

interface ICacheable {
	name: string;
}

interface ICacheableCSV extends ICacheable {
	overwrite?: boolean;
	payload: string;
}

interface ICacheableJSON extends ICacheable {
	payload: Object;
}



/* Cache

	import { Cache } from './cache';

	let rootCache = new Cache({
		cacheDir: 'Cache',
		overwrite: false
	});

*/

export class Cache {

	_cachePath: string;
	_parentCache?: Cache;


	constructor ({ cacheDir, overwrite, parentCache }: IRootCacheParams) {
		this._parentCache = parentCache == undefined ? null : parentCache;
		const parentCachePath = this._parentCache ? this._parentCache.cachePath : '';
		this._cachePath = path.resolve(parentCachePath, cacheDir);

		/* If local cache exists remove if option enabled */
		if (fs.existsSync(this._cachePath)) {
			if (overwrite) {
				fs.removeSync(this._cachePath);
				fs.mkdirSync(this._cachePath);
			}
		}

		/* If cache doesn't exist create it */
		else fs.mkdirSync(this._cachePath);
	}



	/* Cache Queries */

	get cachePath(): string {
		return this._cachePath;
	}
	get cacheDir(): string {
		return path.basename(this._cachePath);
	}
	get parentCache(): Cache {
		return this._parentCache;
	}



	/* CSV

		rootCache.cacheCSV({
			name: 'data-csv',
			overwrite: false,
			payload: 'hello there\n'
		});

	*/

	public cacheCSV(cacheable: ICacheableCSV): Boolean {
		const cacheFilePath = this.getOrCreateCSV(cacheable.name, cacheable.overwrite);
		if (!cacheFilePath) return false;

		/* Overwrite */
		if (cacheable.overwrite) fs.writeFileSync(cacheFilePath, cacheable.payload);

		/* Append */
		else fs.appendFileSync(cacheFilePath, cacheable.payload);
	}

	getOrCreateCSV (fileName: string, overwrite: boolean): string {
		return this._getOrCreateFile(fileName, overwrite, 'csv');
	}



	/* JSON

		rootCache.cacheJSON({
			name: 'data-json',
			payload: [{one:1,two:2,three:3}]
		});

	*/

	cacheJSON (cacheable: ICacheableJSON): Boolean {
		const cacheFilePath = this.getOrCreateJSON(cacheable.name, true);
		if (!cacheFilePath) return false;

		/* Always overwrite JSON */
		fs.writeFileSync(cacheFilePath, JSON.stringify(cacheable.payload, null, 2));

		return true;
	}

	getOrCreateJSON (fileName: string, overwrite: boolean): string {
		return this._getOrCreateFile(fileName, overwrite, 'json');
	}



	/* Files */

	_getOrCreateFile (fileName: string, overwrite: boolean, ext='json'): string {
		let filePath = this._getFilePath(fileName);
		filePath = !filePath ? path.resolve(this._cachePath, `${fileName}.${ext}`) : filePath;

		/* Create if file does not exist */
		if (!fs.existsSync(filePath)) {
			console.log(`Cache: Creating ${ext.toUpperCase()} file: ${this.cacheDir} > ${fileName}.${ext}`);
			fs.writeFileSync(filePath, '');
		} else {
			console.log(`Cache: ${overwrite ? 'Overwriting' : 'Appending'} ${ext.toUpperCase()} file: ${this.cacheDir} > ${fileName}.${ext}`);
		}
		return filePath;
	}

	_getFilePath (targetFileName: string, suppressErrors=true): string {
		const fileList = fs.readdirSync(this._cachePath);

		for (let fileName of fileList) {
			const filePath = path.resolve(this._cachePath, fileName);
			const baseName = path.parse(filePath).name;
			const extName = path.extname(filePath);

			const fileStats = fs.statSync(filePath);
			if (fileStats.isFile() && fileName == targetFileName) return filePath;
		}

		if (!suppressErrors) throw new Error(`Cache error: File ${targetFileName} does not exist.`);
	}

	getFilePath (fileName: string): string {
		try {
			return this._getFilePath(fileName, false);
		} catch (e) {
			console.error(e.message);
			return undefined;
		}
	}



	/* Subcache

		let subcache = rootCache.createSubcache({
			cacheDir: 'Subcache 1',
			overwrite: false
		});

	*/

	_getSubcache (subcacheDir: string): Cache {
		const subcachePath = path.resolve(this._cachePath, subcacheDir);
		if (!fs.existsSync(subcachePath)) throw Error(`Cache error: Subcache ${this.cacheDir} > ${subcacheDir} does not exist.`);
		return new Cache({
			cacheDir: subcachePath,
			overwrite: false,
			parentCache: this
		});
	}

	getSubcache (subcacheDir: string): Cache {
		try {
			return this._getSubcache(subcacheDir);
		} catch (e) {
			console.error(e.message);
			return undefined;
		}
	}

	createSubcache ({ cacheDir: subcacheDir, overwrite }: ICacheParams): Cache {
		let subcachePath = path.resolve(this._cachePath, subcacheDir);

		if (!fs.existsSync(subcachePath)) {
			console.log(`Cache: Creating ${this.cacheDir} > ${subcacheDir}.`);
		} else {
			console.log(`Cache: ${this.cacheDir} > ${subcacheDir} already exists.`);
		}
		
		return new Cache({
			cacheDir: subcacheDir,
			overwrite: overwrite,
			parentCache: this
		});
	}

}
