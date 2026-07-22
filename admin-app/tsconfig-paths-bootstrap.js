const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

const root = __dirname;
const cykruitApp = path.join(root, '../cykruit-app');

tsConfigPaths.register({
    baseUrl: root,
    paths: {
        '@cykruit/prisma':      [path.join(cykruitApp, 'libs/prisma/src/index.ts')],
        '@cykruit/config':      [path.join(cykruitApp, 'libs/config/src/index.ts')],
        '@cykruit/context':     [path.join(cykruitApp, 'libs/context/src/index.ts')],
        '@cykruit/logger':      [path.join(cykruitApp, 'libs/logger/src/index.ts')],
        '@cykruit/common':      [path.join(cykruitApp, 'libs/common/src/index.ts')],
        '@cykruit/auth-core':   [path.join(cykruitApp, 'libs/auth-core/src/index.ts')],
        '@cykruit/mail':        [path.join(cykruitApp, 'libs/mail/src/index.ts')],
        '@cykruit/audit':       [path.join(cykruitApp, 'libs/audit/src/index.ts')],
        '@cykruit/events':      [path.join(cykruitApp, 'libs/events/src/index.ts')],
        '@cykruit/rate-limit':  [path.join(cykruitApp, 'libs/rate-limit/src/index.ts')],
        '@cykruit/permissions': [path.join(cykruitApp, 'libs/permissions/src/index.ts')],
        '@cykruit/policy-config': [path.join(cykruitApp, 'libs/policy-config/src/index.ts')],
        '@cykruit/upload':      [path.join(cykruitApp, 'libs/upload/src/index.ts')],
        'bcryptjs':             [path.join(cykruitApp, 'node_modules/bcryptjs/index.js')],
        '@prisma/client':       [path.join(cykruitApp, 'node_modules/@prisma/client/index.js')],
        '.prisma/client':       [path.join(cykruitApp, 'node_modules/.prisma/client/index.js')],
        '@nestjs/*':            [path.join(root, 'node_modules/@nestjs/*')],
    },
});
