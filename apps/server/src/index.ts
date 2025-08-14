import express = require('express');
import cors = require('cors');
import crypto = require('crypto');
import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const app = express();
app.use(cors());
app.use(express.json());
// Telegram initData verification (minimal). Provide your bot token via env BOT_TOKEN.
const BOT_TOKEN = process.env.BOT_TOKEN || '';

function verifyInitData(initData: string | undefined): boolean {
  if (!initData) return false;
  if (!BOT_TOKEN) return true; // allow if token not provided (dev)
  try {
    const parsed = new URLSearchParams(initData);
    const hash = parsed.get('hash');
    if (!hash) return false;
    const dataCheckArray: string[] = [];
    parsed.sort();
    parsed.forEach((value, key) => {
      if (key !== 'hash') dataCheckArray.push(`${key}=${value}`);
    });
    const dataCheckString = dataCheckArray.join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculated = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    return calculated === hash;
  } catch {
    return false;
  }
}

const dataDir = join(process.cwd(), 'data');
const dbPath = join(dataDir, 'db.json');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
if (!existsSync(dbPath)) writeFileSync(dbPath, JSON.stringify({ users: {} }, null, 2));

type Db = { users: Record<string, { balance: number; spins: number }> };

function loadDb(): Db {
  return JSON.parse(readFileSync(dbPath, 'utf8')) as Db;
}

function saveDb(db: Db) {
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

const authSchema = z.object({ userId: z.string() });

app.post('/api/init', (req, res) => {
  const initData = req.header('x-telegram-init');
  if (initData && !verifyInitData(initData)) {
    return res.status(401).json({ error: 'bad initData' });
  }
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad payload' });
  const { userId } = parsed.data;
  const db = loadDb();
  if (!db.users[userId]) db.users[userId] = { balance: 0, spins: 5 };
  saveDb(db);
  res.json(db.users[userId]);
});

app.post('/api/reward', (req, res) => {
  const initData = req.header('x-telegram-init');
  if (initData && !verifyInitData(initData)) {
    return res.status(401).json({ error: 'bad initData' });
  }
  const schema = authSchema.extend({ amount: z.number().int().nonnegative() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad payload' });
  const { userId, amount } = parsed.data;
  const db = loadDb();
  const user = db.users[userId] ?? { balance: 0, spins: 5 };
  user.balance += amount;
  db.users[userId] = user;
  saveDb(db);
  res.json(user);
});

// simple order endpoint
app.post('/api/order', (req, res) => {
  const schema = z.object({
    userId: z.string(),
    name: z.string().min(1),
    phone: z.string().min(3),
    address: z.string().min(3),
    items: z.array(z.object({ sku: z.string(), title: z.string(), price: z.number(), qty: z.number().int().positive() })),
    total: z.number().nonnegative(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad payload' });
  console.log('ORDER', parsed.data);
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});


