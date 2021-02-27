



import { Cache } from './cache';

let rootCache = new Cache({
  cacheDir: 'Cache',
  overwrite: true
});

let subcache = rootCache.createSubcache({
  cacheDir: 'Subcache 1',
  overwrite: false
});

subcache.cacheCSV({
  name: 'data-csv',
  overwrite: false,
  payload: 'hello there\n'
});

subcache.cacheJSON({
  name: 'data-json',
  payload: [{one:1,two:2,three:3}]
});


console.log(subcache);
