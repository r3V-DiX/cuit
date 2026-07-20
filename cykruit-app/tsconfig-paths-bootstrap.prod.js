const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

const root = __dirname; // /app inside the container

// process.argv[1] is something like /app/dist/apps/auth-service/apps/auth-service/src/main.js
const match = process.argv[1].match(/dist\/apps\/([^\/]+)/);
const appName = match ? match[1] : 'auth-service';

const distLibs = path.join(root, `dist/apps/${appName}/libs`);

tsConfigPaths.register({
    baseUrl: root,
    paths: {
        '@cykruit/prisma': [path.join(distLibs, 'prisma/src/index.js')],
        '@cykruit/config': [path.join(distLibs, 'config/src/index.js')],
        '@cykruit/context': [path.join(distLibs, 'context/src/index.js')],
        '@cykruit/logger': [path.join(distLibs, 'logger/src/index.js')],
        '@cykruit/common': [path.join(distLibs, 'common/src/index.js')],
        '@cykruit/auth-core': [path.join(distLibs, 'auth-core/src/index.js')],
        '@cykruit/queue': [path.join(distLibs, 'queue/src/index.js')],
        '@cykruit/mail': [path.join(distLibs, 'mail/src/index.js')],
        '@cykruit/upload': [path.join(distLibs, 'upload/src/index.js')],
        '@cykruit/ai': [path.join(distLibs, 'ai/src/index.js')],
        '@cykruit/rate-limit': [path.join(distLibs, 'rate-limit/src/index.js')],
        '@cykruit/audit': [path.join(distLibs, 'audit/src/index.js')],
        '@cykruit/permissions': [path.join(distLibs, 'permissions/src/index.js')],
        '@cykruit/events': [path.join(distLibs, 'events/src/index.js')],
        '@cykruit/subscription': [path.join(distLibs, 'subscription/src/index.js')],
    },
});
