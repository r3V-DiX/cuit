// apps/gateway/src/main.ts

import express from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

const app = express();

// Trust 1 proxy hop (Nginx). Makes req.ip = real client IP from X-Forwarded-For.
app.set('trust proxy', 1);

const GATEWAY_PORT = parseInt(process.env.GATEWAY_PORT || '5000', 10);

const SERVICES = {
    auth:           process.env.AUTH_SERVICE_URL           || 'http://localhost:4001',
    settings:       process.env.SETTINGS_SERVICE_URL       || 'http://localhost:4002',
    'seeker-profile': process.env.SEEKER_PROFILE_SERVICE_URL || 'http://localhost:4003',
    employer:       process.env.EMPLOYER_SERVICE_URL       || 'http://localhost:4004',
    seeker:         process.env.SEEKER_SERVICE_URL         || 'http://localhost:4005',
    public:         process.env.PUBLIC_SERVICE_URL         || 'http://localhost:4006',
    notification:   process.env.NOTIFICATION_SERVICE_URL   || 'http://localhost:4007',
    subscription:   process.env.SUBSCRIPTION_SERVICE_URL   || 'http://localhost:4008',
};

const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:4000',
];

app.use(helmet({ frameguard: { action: 'deny' }, noSniff: true }));
app.use(compression());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept', 'x-csrf-token'],
    exposedHeaders: ['Set-Cookie'],
}));

function proxy(target: string, pathRewrite?: Record<string, string>) {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        xfwd: true,
        pathRewrite,
        on: {
            proxyReq: fixRequestBody,
            error: (err, _req, res) => {
                console.error(`[Gateway] Proxy error → ${target}:`, err.message);
                const httpRes = res as express.Response;
                if (!httpRes.headersSent) {
                    httpRes.status(502).json({
                        statusCode: 502,
                        message: 'Service temporarily unavailable',
                        error: 'Bad Gateway',
                    });
                }
            },
        },
    });
}

// ── Route table ────────────────────────────────────────────────────────
// /auth/*                    → auth-service:4001
// /settings/*                → user-settings-service:4002
// /seeker-profile/*          → seeker-profile-service:4003
// /employer/*                → employer-service:4004
// /seeker/*                  → seeker-service:4005
// /public/*                  → public-service:4006     (service uses setGlobalPrefix("public"))
// /notifications/*           → notification-service:4007
// /subscriptions/*           → subscription-service:4008
// /ws/*                      → notification-service:4007 (WebSocket)

app.use('/auth', proxy(SERVICES.auth, { '^/': '/auth/' }));
app.use('/api/auth', proxy(SERVICES.auth, { '^/api/auth': '/auth' }));
app.use('/settings', proxy(SERVICES.settings));
app.use('/seeker-profile', proxy(SERVICES['seeker-profile']));
app.use('/resumes', proxy(SERVICES['seeker-profile']));
app.use('/employer', proxy(SERVICES.employer));
app.use('/seeker', proxy(SERVICES.seeker));
app.use('/public', proxy(SERVICES.public));
app.use('/notifications', proxy(SERVICES.notification));
app.use('/subscriptions', proxy(SERVICES.subscription));

// WebSocket upgrade forwarded to notification-service
const wsProxy = createProxyMiddleware({
    target: SERVICES.notification,
    changeOrigin: true,
    ws: true,
});
app.use('/ws', wsProxy);

// ── Health aggregator ──────────────────────────────────────────────────
app.get('/gateway/health', (_req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.json({
        status: 'ok',
        gateway: 'running',
        ...(isProd ? {} : { services: SERVICES }),
        timestamp: new Date().toISOString(),
    });
});

const server = app.listen(GATEWAY_PORT, '0.0.0.0', () => {
    console.log(`[Gateway] Running on http://0.0.0.0:${GATEWAY_PORT}`);
    console.log('[Gateway] Routes:');
    Object.entries(SERVICES).forEach(([name, url]) => {
        console.log(`  /${name.padEnd(14)} → ${url}`);
    });
});

// Upgrade WebSocket connections
server.on('upgrade', wsProxy.upgrade as any);

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT',  () => { server.close(() => process.exit(0)); });
