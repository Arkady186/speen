import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

let db
const DATA_PATH = process.env.SQLITE_PATH || './data.sqlite'

async function init(){
  db = await open({ filename: DATA_PATH, driver: sqlite3.Database })

  // Новости
  await db.exec(`CREATE TABLE IF NOT EXISTS news(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    text TEXT,
    images TEXT,
    ts INTEGER
  )`)

  // Профили игроков
  await db.exec(`CREATE TABLE IF NOT EXISTS players(
    id INTEGER PRIMARY KEY,
    username TEXT,
    photo TEXT,
    level INTEGER DEFAULT 1,
    balance_w INTEGER DEFAULT 10000,
    balance_b INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    daily_last TEXT,
    daily_streak INTEGER DEFAULT 0,
    profile_json TEXT,
    created_at INTEGER,
    updated_at INTEGER
  )`)

  // Рефералы
  await db.exec(`CREATE TABLE IF NOT EXISTS referrals(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inviter_id INTEGER,
    friend_id INTEGER,
    bonus_given INTEGER DEFAULT 0,
    created_at INTEGER
  )`)

  await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_pair
    ON referrals(inviter_id, friend_id)`)

  // Миграция из старой таблицы leaderboard (если есть)
  try {
    await db.exec(`
      INSERT OR IGNORE INTO players(id, username, photo, level, coins, created_at, updated_at)
      SELECT id, name, photo, level, coins,
             COALESCE(updated_at, strftime('%s','now') * 1000),
             COALESCE(updated_at, strftime('%s','now') * 1000)
      FROM leaderboard
    `)
  } catch {}
}

app.get('/health', (_req,res)=>res.send('ok'))

// ----- NEWS -----

// List news (newest first)
app.get('/api/news', async (_req,res)=>{
  try{
    const rows = await db.all('SELECT * FROM news ORDER BY ts DESC LIMIT 200')
    const items = rows.map(r => ({ id:r.id, title:r.title, text:r.text, images: JSON.parse(r.images||'[]'), ts:r.ts }))
    res.json({ items })
  }catch(e){ res.status(500).json({ error:'server_error' }) }
})

// Add news (admin only: id 1408757717)
app.post('/api/news', async (req,res)=>{
  try{
    const { adminId, title, text, images } = req.body || {}
    if (Number(adminId) !== 1408757717) return res.status(403).json({ error:'forbidden' })
    const imgs = Array.isArray(images) ? images : []
    const ts = Date.now()
    await db.run('INSERT INTO news(title,text,images,ts) VALUES(?,?,?,?)', title||'', text||'', JSON.stringify(imgs), ts)
    res.json({ ok:true })
  }catch(e){ res.status(500).json({ error:'server_error' }) }
})

// ----- PLAYERS / PROFILE -----

async function upsertPlayer(payload){
  const {
    id,
    username,
    photo,
    level,
    balanceW,
    balanceB,
    dailyLast,
    dailyStreak,
    profile,
    coinsOverride
  } = payload || {}

  if (!id) throw new Error('missing_id')

  const now = Date.now()
  const levelVal = typeof level === 'number' ? level : 1
  const balanceWVal = typeof balanceW === 'number' ? balanceW : null
  const balanceBVal = typeof balanceB === 'number' ? balanceB : null
  const dailyLastVal = typeof dailyLast === 'string' ? dailyLast : null
  const dailyStreakVal = typeof dailyStreak === 'number' ? dailyStreak : null
  const coins = typeof coinsOverride === 'number'
    ? coinsOverride
    : (balanceWVal || 0) + (balanceBVal || 0) * 10000

  const row = await db.get('SELECT id FROM players WHERE id = ?', id)
  if (row) {
    await db.run(
      `UPDATE players
       SET username = COALESCE(?, username),
           photo = COALESCE(?, photo),
           level = COALESCE(?, level),
           balance_w = COALESCE(?, balance_w),
           balance_b = COALESCE(?, balance_b),
           coins = ?,
           daily_last = COALESCE(?, daily_last),
           daily_streak = COALESCE(?, daily_streak),
           profile_json = COALESCE(?, profile_json),
           updated_at = ?
       WHERE id = ?`,
      username || null,
      photo || null,
      levelVal,
      balanceWVal,
      balanceBVal,
      coins,
      dailyLastVal,
      dailyStreakVal,
      profile ? JSON.stringify(profile) : null,
      now,
      id
    )
  } else {
    await db.run(
      `INSERT INTO players(
         id, username, photo, level,
         balance_w, balance_b, coins,
         daily_last, daily_streak, profile_json,
         created_at, updated_at
       ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      id,
      username || null,
      photo || null,
      levelVal,
      balanceWVal || 0,
      balanceBVal || 0,
      coins,
      dailyLastVal,
      dailyStreakVal || 0,
      profile ? JSON.stringify(profile) : null,
      now,
      now
    )
  }
}

app.post('/api/player/upsert', async (req,res)=>{
  try{
    const { id, username, photo, level, balanceW, balanceB, dailyLast, dailyStreak, profile } = req.body || {}
    if (!id) return res.status(400).json({ error:'bad_input' })
    await upsertPlayer({ id, username, photo, level, balanceW, balanceB, dailyLast, dailyStreak, profile })
    res.json({ ok:true })
  }catch(e){
    if (e && e.message === 'missing_id') return res.status(400).json({ error:'bad_input' })
    res.status(500).json({ error:'server_error' })
  }
})

app.get('/api/player/profile/:id', async (req,res)=>{
  try{
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error:'bad_input' })
    const row = await db.get('SELECT * FROM players WHERE id = ?', id)
    if (!row) return res.json({ exists:false, profile:null })

    let extra = null
    try{
      extra = row.profile_json ? JSON.parse(row.profile_json) : null
    }catch{
      extra = null
    }

    const profile = {
      id: row.id,
      username: row.username,
      photo: row.photo,
      level: row.level,
      balanceW: row.balance_w,
      balanceB: row.balance_b,
      coins: row.coins,
      dailyLast: row.daily_last,
      dailyStreak: row.daily_streak,
      extra
    }
    res.json({ exists:true, profile })
  }catch{
    res.status(500).json({ error:'server_error' })
  }
})

// ----- REFERRALS -----

app.post('/api/referrals/register', async (req,res)=>{
  try{
    const { inviterId, friendId, alreadyRegistered } = req.body || {}
    const inviter = Number(inviterId)
    const friend = Number(friendId)
    if (!inviter || !friend || inviter === friend) {
      return res.status(400).json({ error:'bad_input' })
    }

    const existing = await db.get(
      'SELECT id, bonus_given FROM referrals WHERE inviter_id = ? AND friend_id = ?',
      inviter,
      friend
    )

    const now = Date.now()
    let isNew = false
    let shouldReward = false
    let rewardW = 0

    if (!existing) {
      const baseReward = alreadyRegistered ? 0 : 5000
      await db.run(
        'INSERT INTO referrals(inviter_id, friend_id, bonus_given, created_at) VALUES(?,?,?,?)',
        inviter,
        friend,
        baseReward,
        now
      )
      isNew = true
      if (baseReward > 0) {
        shouldReward = true
        rewardW = baseReward
      }
    } else {
      rewardW = existing.bonus_given || 0
    }

    res.json({ ok:true, isNew, shouldReward, rewardW })
  }catch{
    res.status(500).json({ error:'server_error' })
  }
})

app.get('/api/referrals/my/:inviterId', async (req,res)=>{
  try{
    const inviterId = Number(req.params.inviterId)
    if (!inviterId) return res.status(400).json({ error:'bad_input' })

    const rows = await db.all(
      `SELECT r.friend_id as id,
              p.username,
              p.photo,
              p.level,
              r.bonus_given
       FROM referrals r
       LEFT JOIN players p ON p.id = r.friend_id
       WHERE r.inviter_id = ?
       ORDER BY r.created_at DESC`,
      inviterId
    )

    const items = rows.map(r => ({
      id: r.id,
      name: r.username || 'Unknown account',
      photo: r.photo || null,
      level: r.level || 1,
      rewardW: r.bonus_given || 0
    }))

    res.json({ items })
  }catch{
    res.status(500).json({ error:'server_error' })
  }
})

// ----- LEADERBOARD (поверх players) -----

app.post('/api/leaderboard/upsert', async (req,res)=>{
  try{
    const { id, name, photo, level, coins } = req.body || {}
    if(!id || typeof coins !== 'number') return res.status(400).json({ error:'bad_input' })
    await upsertPlayer({ id, username:name, photo, level, coinsOverride: coins })
    res.json({ ok:true })
  }catch{
    res.status(500).json({ error:'server_error' })
  }
})

app.get('/api/leaderboard/top', async (req,res)=>{
  try{
    const limit = Math.max(1, Math.min(100, Number(req.query.limit||'50')))
    const rows = await db.all(
      'SELECT id, username as name, photo, level, coins FROM players ORDER BY level DESC, coins DESC LIMIT ?',
      limit
    )
    res.json({ items: rows })
  }catch{
    res.status(500).json({ error:'server_error' })
  }
})

app.get('/api/leaderboard/rank/:id', async (req,res)=>{
  try{
    const id = Number(req.params.id)
    if(!id) return res.status(400).json({ error:'bad_input' })
    const player = await db.get('SELECT id, username as name, photo, level, coins FROM players WHERE id = ?', id)
    if(!player) return res.json({ rank: null, total: 0, player: null })
    
    const betterCount = await db.get(
      'SELECT COUNT(*) as cnt FROM players WHERE level > ? OR (level = ? AND coins > ?)',
      player.level, player.level, player.coins
    )
    const total = await db.get('SELECT COUNT(*) as cnt FROM players')
    
    res.json({ rank: (betterCount?.cnt || 0) + 1, total: total?.cnt || 0, player })
  }catch{
    res.status(500).json({ error:'server_error' })
  }
})

const port = process.env.PORT || 8080
init().then(()=> app.listen(port, ()=> console.log('server on', port)))

