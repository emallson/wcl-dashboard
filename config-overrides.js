const multipleEntry = require('react-app-rewire-multiple-entry')([
    {
        entry: 'src/index.tsx',
        template: 'public/index.html',
        outPath: '/index.html',
    },
    {
        entry: 'src/worker.ts',
        template: 'public/worker.html',
        outPath: '/worker.html',
    },
]);

module.exports = {
    webpack: function(config, env) {
        multipleEntry.addMultiEntry(config);
        return config;
    }
}
