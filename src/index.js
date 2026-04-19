import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';

import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { competenciesRouter } from './routes/competencies.js';
import { modulesRouter } from './routes/modules.js';
import { sessionsRouter } from './routes/sessions.js';
import { adminRouter } from './routes/admin.js';
import { matrixRouter } from './routes/matrix.js';

const app = express();
app.use(helmet());
app.use(express.json({ limit:'1mb' }));
app.use(morgan('combined'));
app.use(cors({
  origin: config.corsOrigin || false,
  credentials: config.corsCredentials,
}));

app.get('/health', (req,res)=>res.json({ ok:true }));

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/competencies', competenciesRouter);
app.use('/modules', modulesRouter);
app.use('/sessions', sessionsRouter);
app.use('/matrix', matrixRouter);

app.use((err,req,res,next)=>{
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(config.port, ()=>console.log(`LMS API listening on :${config.port}`));
