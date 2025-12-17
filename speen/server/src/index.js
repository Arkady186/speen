import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import fs from 'node:fs'
import path from 'node:path'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

let db

function pickSqlitePath() {
  const envPath = (process.env.SQLITE_PATH || '').trim()
  const candidates = [
    envPath || null,
    process.env.RENDER ? '/var/data/data.sqlite' : null,
    process.env.RENDER ? '/app/data/data.sqlite' : null,
    process.env.RENDER ? '/opt/render/project/src/server/data.sqlite' : null,
    path.resolve(process.cwd(), 'data.sqlite'),
  ].filter(Boolean)

  for (const p of candidates) {
    try {
      const dir = path.dirname(p)
      fs.mkdirSync(dir, { recursive: true })
      return p
    } catch {
      // try next candidate
    }
  }
  // last resort (should never happen)
  return path.resolve(process.cwd(), 'data.sqlite')
}

const DATA_PATH = pickSqlitePath()

async function init(){
  console.log('[DB] Using sqlite file:', DATA_PATH)
  db = await open({ filename: DATA_PATH, driver: sqlite3.Database })
  // Pragmas for durability & stability across restarts
  try {
    await db.exec('PRAGMA journal_mode=WAL;')
    await db.exec('PRAGMA synchronous=NORMAL;')
    await db.exec('PRAGMA foreign_keys=ON;')
  } catch (e) {
    console.warn('[DB] Failed to apply pragmas:', e)
  }

  // Новости
  await db.exec(`CREATE TABLE IF NOT EXISTS news(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    text TEXT,
    images TEXT,
    ts INTEGER
  )`)

  // Рейтинг (старая таблица)
  await db.exec(`CREATE TABLE IF NOT EXISTS leaderboard(
    id INTEGER PRIMARY KEY,
    name TEXT,
    photo TEXT,
    level INTEGER DEFAULT 1,
    coins INTEGER DEFAULT 0,
    updated_at INTEGER
  )`)

  // Профили игроков (для рефералок и будущей синхронизации)
  await db.exec(`CREATE TABLE IF NOT EXISTS players(
    id INTEGER PRIMARY KEY,
    username TEXT,
    photo TEXT,
    level INTEGER DEFAULT 1,
    coins INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
  )`)

  // Рефералы: кто кого пригласил
  await db.exec(`CREATE TABLE IF NOT EXISTS referrals(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inviter_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    reward_w INTEGER DEFAULT 0,
    created_at INTEGER,
    UNIQUE(inviter_id, friend_id)
  )`)
}

app.get('/health', (_req,res)=>res.send('ok'))

// ----- NEWS -----

app.get('/api/news', async (_req,res)=>{
  try{
    const rows = await db.all('SELECT * FROM news ORDER BY ts DESC LIMIT 200')
    const items = rows.map(r => ({ id:r.id, title:r.title, text:r.text, images: JSON.parse(r.images||'[]'), ts:r.ts }))
    res.json({ items })
  }catch(e){ 
    console.error('News error:', e)
    res.status(500).json({ error:'server_error' }) 
  }
})

app.post('/api/news', async (req,res)=>{
  try{
    const { adminId, title, text, images } = req.body || {}
    if (Number(adminId) !== 1408757717) return res.status(403).json({ error:'forbidden' })
    const imgs = Array.isArray(images) ? images : []
    const ts = Date.now()
    await db.run('INSERT INTO news(title,text,images,ts) VALUES(?,?,?,?)', title||'', text||'', JSON.stringify(imgs), ts)
    res.json({ ok:true })
  }catch(e){ 
    console.error('News post error:', e)
    res.status(500).json({ error:'server_error' }) 
  }
})

// ----- LEADERBOARD -----

app.post('/api/leaderboard/upsert', async (req,res)=>{
  try{
    const { id, name, photo, level, coins } = req.body || {}
    console.log('[Leaderboard upsert]', { id, name, level, coins })
    if(!id || typeof coins !== 'number') return res.status(400).json({ error:'bad_input' })
    
    const now = Date.now()
    const playerLevel = typeof level === 'number' ? level : 1
    const row = await db.get('SELECT id FROM leaderboard WHERE id = ?', id)
    
    if(row){
      await db.run(
        'UPDATE leaderboard SET name=?, photo=?, level=?, coins=?, updated_at=? WHERE id=?',
        name||null, photo||null, playerLevel, coins, now, id
      )
    }else{
      await db.run(
        'INSERT INTO leaderboard(id,name,photo,level,coins,updated_at) VALUES(?,?,?,?,?,?)',
        id, name||null, photo||null, playerLevel, coins, now
      )
    }
    console.log('[Leaderboard upsert] Success')
    res.json({ ok:true })
  }catch(e){ 
    console.error('Leaderboard upsert error:', e)
    res.status(500).json({ error:'server_error' }) 
  }
})

app.get('/api/leaderboard/top', async (req,res)=>{
  try{
    const limit = Math.max(1, Math.min(100, Number(req.query.limit||'50')))
    const rows = await db.all('SELECT * FROM leaderboard ORDER BY level DESC, coins DESC LIMIT ?', limit)
    console.log('[Leaderboard top] Found', rows.length, 'players')
    res.json({ items: rows })
  }catch(e){ 
    console.error('Leaderboard top error:', e)
    res.status(500).json({ error:'server_error' }) 
  }
})

app.get('/api/leaderboard/rank/:id', async (req,res)=>{
  try{
    const id = Number(req.params.id)
    const player = await db.get('SELECT * FROM leaderboard WHERE id = ?', id)
    if(!player) return res.json({ rank: null, total: 0, player: null })
    
    const betterCount = await db.get(
      'SELECT COUNT(*) as cnt FROM leaderboard WHERE level > ? OR (level = ? AND coins > ?)',
      player.level, player.level, player.coins
    )
    const rank = (betterCount?.cnt || 0) + 1
    const total = await db.get('SELECT COUNT(*) as cnt FROM leaderboard')
    
    console.log('[Leaderboard rank]', { id, rank, total: total?.cnt })
    res.json({ rank, total: total?.cnt || 0, player })
  }catch(e){ 
    console.error('Leaderboard rank error:', e)
    res.status(500).json({ error:'server_error' }) 
  }
})

// ----- PLAYER PROFILE (минимально, для рефералок) -----

app.post('/api/player/upsert', async (req,res)=>{
  try{
    const { id, username, name, photo, level, coins } = req.body || {}
    if (!id) return res.status(400).json({ error:'bad_input' })
    const now = Date.now()
    const row = await db.get('SELECT id FROM players WHERE id = ?', id)
    const uname = (username || name) || null
    const lvl = typeof level === 'number' ? level : 1
    const c = typeof coins === 'number' ? coins : 0
    if (row) {
      await db.run(
        'UPDATE players SET username=?, photo=?, level=?, coins=?, updated_at=? WHERE id=?',
        uname, photo || null, lvl, c, now, id
      )
    } else {
      await db.run(
        'INSERT INTO players(id,username,photo,level,coins,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
        id, uname, photo || null, lvl, c, now, now
      )
    }
    res.json({ ok:true })
  } catch(e){
    console.error('Player upsert error:', e)
    res.status(500).json({ error:'server_error' })
  }
})

// ----- REFERRALS -----

// Регистрация перехода по реф-ссылке
app.post('/api/referrals/register', async (req,res)=>{
  try{
    const { inviter_id, friend_id, name, photo } = req.body || {}
    const inviterId = Number(inviter_id)
    const friendId = Number(friend_id)
    if (!inviterId || !friendId) return res.status(400).json({ error:'bad_input' })
    if (inviterId === friendId) return res.json({ ok:true, shouldReward:false, already:true })

    const now = Date.now()

    // Обновляем/создаём профиль друга
    const existingPlayer = await db.get('SELECT id FROM players WHERE id = ?', friendId)
    if (existingPlayer) {
      await db.run(
        'UPDATE players SET username=COALESCE(?, username), photo=COALESCE(?, photo), updated_at=? WHERE id=?',
        name || null, photo || null, now, friendId
      )
    } else {
      await db.run(
        'INSERT INTO players(id,username,photo,level,coins,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
        friendId, name || null, photo || null, 1, 0, now, now
      )
    }

    // Уже есть пара inviter-friend?
    const existingPair = await db.get(
      'SELECT * FROM referrals WHERE inviter_id = ? AND friend_id = ?',
      inviterId, friendId
    )
    if (existingPair) {
      return res.json({ ok:true, already:true, shouldReward:false, rewardW: existingPair.reward_w || 0 })
    }

    // Друг уже был рефералом у кого-то ещё?
    const anyRef = await db.get('SELECT * FROM referrals WHERE friend_id = ?', friendId)
    let rewardW = 0
    if (!anyRef) {
      rewardW = 5000 // Бонус только за "первое приглашение" этого друга
    }

    await db.run(
      'INSERT INTO referrals(inviter_id, friend_id, reward_w, created_at) VALUES(?,?,?,?)',
      inviterId, friendId, rewardW, now
    )

    res.json({ ok:true, already:false, shouldReward: rewardW > 0, rewardW })
  } catch(e){
    console.error('Referrals register error:', e)
    res.status(500).json({ error:'server_error' })
  }
})

// Список друзей-инвайтов для конкретного игрока
app.get('/api/referrals/my/:inviterId', async (req,res)=>{
  try{
    const inviterId = Number(req.params.inviterId)
    if (!inviterId) return res.status(400).json({ error:'bad_input' })

    const rows = await db.all(`
      SELECT 
        r.friend_id as id,
        COALESCE(p.username, lb.name) as name,
        COALESCE(p.photo, lb.photo) as photo,
        COALESCE(p.level, lb.level, 1) as level,
        COALESCE(lb.coins, 0) as coins,
        r.reward_w as rewardW,
        r.created_at as createdAt
      FROM referrals r
      LEFT JOIN players p ON p.id = r.friend_id
      LEFT JOIN leaderboard lb ON lb.id = r.friend_id
      WHERE r.inviter_id = ?
      ORDER BY r.created_at DESC
    `, inviterId)

    res.json({ items: rows })
  } catch(e){
    console.error('Referrals my error:', e)
    res.status(500).json({ error:'server_error' })
  }
})

const port = process.env.PORT || 8080
init().then(()=> app.listen(port, ()=> console.log('Server running on port', port)))
