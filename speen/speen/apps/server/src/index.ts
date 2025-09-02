import express = require('express');
import cors = require('cors');
import path = require('path');
import serveStatic = require('serve-static');

const app = express();
app.use(cors());

// serve built miniapp from ../../miniapp/dist
const staticRoot = path.join(__dirname, '..', '..', 'miniapp', 'dist');
app.use(serveStatic(staticRoot));

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Static server on :${port}`));



