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

  // Рейтинг (старая таблица)
  await db.exec(`CREATE TABLE IF NOT EXISTS leaderboard(
    id INTEGER PRIMARY KEY,
    name TEXT,
    photo TEXT,
    level INTEGER DEFAULT 1,
    coins INTEGER DEFAULT 0,
    updated_at INTEGER
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

const port = process.env.PORT || 8080
init().then(()=> app.listen(port, ()=> console.log('Server running on port', port)))
