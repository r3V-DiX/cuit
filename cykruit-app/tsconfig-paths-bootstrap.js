const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

const root = __dirname; // project root — this file lives at root

tsConfigPaths.register({
    baseUrl: root,
    paths: {
        '@cykruit/prisma': [path.join(root, 'libs/prisma/src/index.ts')],
        '@cykruit/config': [path.join(root, 'libs/config/src/index.ts')],
        '@cykruit/context': [path.join(root, 'libs/context/src/index.ts')],
        '@cykruit/logger': [path.join(root, 'libs/logger/src/index.ts')],
        '@cykruit/common': [path.join(root, 'libs/common/src/index.ts')],
        '@cykruit/auth-core': [path.join(root, 'libs/auth-core/src/index.ts')],
        '@cykruit/queue': [path.join(root, 'libs/queue/src/index.ts')],
        '@cykruit/mail': [path.join(root, 'libs/mail/src/index.ts')],
        '@cykruit/upload': [path.join(root, 'libs/upload/src/index.ts')],
        '@cykruit/ai': [path.join(root, 'libs/ai/src/index.ts')],
        '@cykruit/rate-limit': [path.join(root, 'libs/rate-limit/src/index.ts')],
        '@cykruit/audit': [path.join(root, 'libs/audit/src/index.ts')],
        '@cykruit/permissions': [path.join(root, 'libs/permissions/src/index.ts')],
        '@cykruit/events': [path.join(root, 'libs/events/src/index.ts')],
        '@cykruit/subscription': [path.join(root, 'libs/subscription/src/index.ts')],
        '@cykruit/policy-config': [path.join(root, 'libs/policy-config/src/index.ts')],
        '@cykruit/blacklist': [path.join(root, 'libs/blacklist/src/index.ts')],
    },
});