import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const app = express()
app.use(cors())
app.use(express.json())

let db
const DATA_PATH = process.env.SQLITE_PATH || './data.sqlite'
async function init(){
  db = await open({ filename: DATA_PATH, driver: sqlite3.Database })
  await db.exec(`CREATE TABLE IF NOT EXISTS leaderboard(
    id INTEGER PRIMARY KEY,
    name TEXT,
    photo TEXT,
    coins INTEGER DEFAULT 0,
    updated_at INTEGER
  )`)
}

app.get('/health', (_,res)=>res.send('ok'))

// upsert player coins
app.post('/api/leaderboard/upsert', async (req,res) => {
  try{
    const { id, name, photo, coins } = req.body || {}
    if(!id || typeof coins !== 'number') return res.status(400).json({ error:'bad_input' })
    const now = Date.now()
    const row = await db.get('SELECT id FROM leaderboard WHERE id = ?', id)
    if(row){
      await db.run('UPDATE leaderboard SET name=?, photo=?, coins=?, updated_at=? WHERE id=?', name||null, photo||null, coins, now, id)
    }else{
      await db.run('INSERT INTO leaderboard(id,name,photo,coins,updated_at) VALUES(?,?,?,?,?)', id, name||null, photo||null, coins, now)
    }
    res.json({ ok:true })
  }catch(e){ res.status(500).json({ error:'server_error' }) }
})

// top N
app.get('/api/leaderboard/top', async (req,res)=>{
  try{
    const limit = Math.max(1, Math.min(100, Number(req.query.limit||'50')))
    const rows = await db.all('SELECT * FROM leaderboard ORDER BY coins DESC LIMIT ?', limit)
    res.json({ items: rows })
  }catch(e){ res.status(500).json({ error:'server_error' }) }
})

// around player
app.get('/api/leaderboard/around/:id', async (req,res)=>{
  try{
    const id = Number(req.params.id)
    const row = await db.get('SELECT coins FROM leaderboard WHERE id = ?', id)
    if(!row) return res.json({ items: [] })
    const higher = await db.all('SELECT * FROM leaderboard WHERE coins > ? ORDER BY coins ASC LIMIT 5', row.coins)
    const lower = await db.all('SELECT * FROM leaderboard WHERE coins <= ? ORDER BY coins DESC LIMIT 5', row.coins)
    const combined = [...higher.reverse(), ...(await db.all('SELECT * FROM leaderboard WHERE id=?', id)), ...lower]
    res.json({ items: combined })
  }catch(e){ res.status(500).json({ error:'server_error' }) }
})

const port = process.env.PORT || 8080
init().then(()=> app.listen(port, ()=> console.log('server on', port)))


