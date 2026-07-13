import "./configs/instrument.js"
import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import clerkWebhooks from './controllers/clerk.js';
import * as Sentry from '@sentry/node';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import type { Server } from 'node:http';

declare global {
  // eslint-disable-next-line no-var
  var __adGenServer: Server | undefined;
}

const app = express();

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '127.0.0.1';

// Middleware
app.use(cors());

// Clerk webhooks must be verified against the original request body.
app.post("/api/clerk", express.raw({ type: "application/json" }), clerkWebhooks);

app.use(express.json());
app.use(clerkMiddleware());

app.get('/', (req: Request, res: Response) => {
  res.send('Server is Live!');
});
app.use('/api/user', userRouter)
app.use('/api/project', projectRouter)

if (process.env.NODE_ENV !== 'production') {
  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });
}

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server failed to start:', error);
});

// Keep a strong reference to the listener in runtimes that aggressively clean up
// module-local resources.
globalThis.__adGenServer = server;
