// Production-only path mapping — used by the Docker image's CMD.
// Maps @cykruit/* to the COMPILED JS emitted by `npm run build` (tsc puts
// admin-app at dist/admin-app/src and the shared libs at dist/cykruit-app/libs
// because rootDir spans both trees). Local dev keeps using
// tsconfig-paths-bootstrap.js, which points at the .ts source for ts-node.
const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

const root = __dirname; // /app/admin-app inside the container
const dist = path.join(root, 'dist');
const distLibs = path.join(dist, 'cykruit-app/libs');
const cykruitAppModules = path.join(root, '../cykruit-app/node_modules');

tsConfigPaths.register({
    baseUrl: root,
    paths: {
        '@cykruit/prisma':      [path.join(distLibs, 'prisma/src/index.js')],
        '@cykruit/config':      [path.join(distLibs, 'config/src/index.js')],
        '@cykruit/context':     [path.join(distLibs, 'context/src/index.js')],
        '@cykruit/logger':      [path.join(distLibs, 'logger/src/index.js')],
        '@cykruit/common':      [path.join(distLibs, 'common/src/index.js')],
        '@cykruit/auth-core':   [path.join(distLibs, 'auth-core/src/index.js')],
        '@cykruit/mail':        [path.join(distLibs, 'mail/src/index.js')],
        '@cykruit/audit':       [path.join(distLibs, 'audit/src/index.js')],
        '@cykruit/events':      [path.join(distLibs, 'events/src/index.js')],
        '@cykruit/rate-limit':  [path.join(distLibs, 'rate-limit/src/index.js')],
        '@cykruit/permissions': [path.join(distLibs, 'permissions/src/index.js')],
        '@cykruit/policy-config': [path.join(distLibs, 'policy-config/src/index.js')],
        '@cykruit/blacklist':   [path.join(distLibs, 'blacklist/src/index.js')],
        '@cykruit/upload':      [path.join(distLibs, 'upload/src/index.js')],
        '@cykruit/subscription':  [path.join(distLibs, 'subscription/src/index.js')],
        'bcryptjs':             [path.join(cykruitAppModules, 'bcryptjs/index.js')],
        '@prisma/client':       [path.join(cykruitAppModules, '@prisma/client/index.js')],
        '.prisma/client':       [path.join(cykruitAppModules, '.prisma/client/index.js')],
        '@nestjs/*':            [path.join(root, 'node_modules/@nestjs/*')],
    },
});
