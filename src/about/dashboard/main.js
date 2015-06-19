require.config({
  scriptType: 'text/javascript;version=1.8',
  baseUrl: '../../../node_modules/',
  nodeIdCompat: true,
  paths: {
    about: '../src/about',
    browser: '../src/browser',
    common: '../src/common',
    lang: '../src/lang',
    service: '../src/service',
    shims: '../src/shims',
    // http://facebook.github.io/react/
    react: 'react/dist/react',
    // http://facebook.github.io/immutable-js/
    // Because of the bug https://github.com/facebook/immutable-js/pull/297
    // we use forked version until it's uplifted.
    immutable: 'immutable/dist/immutable',
    'typed-immutable': 'typed-immutable/lib/',
    // http://omniscientjs.github.io
    omniscient: 'omniscient/dist/omniscient',
    // https://github.com/broofa/node-uuid
    uuid: 'node-uuid/uuid',
    reflex: 'reflex/lib/index',
    pouchdb: 'pouchdb/dist/pouchdb',
    tinycolor: 'tinycolor2/tinycolor'
  },
  shim: {
    tinycolor: {
      exports: 'tinycolor'
    },
    omniscient: {
      deps: ['shims/omniscient']
    },
    pouchdb: {
      exports: 'PouchDB'
    }
  }
});


require(['about/dashboard/index']);
