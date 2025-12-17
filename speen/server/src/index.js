import express from 'express'
import cors from 'cors'
import pg from 'pg'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const { Pool } = pg
const DATABASE_URL = (process.env.DATABASE_URL || '').trim()
if (!DATABASE_URL) {
  console.error('[DB] DATABASE_URL is required. Create a Postgres DB (Neon/Supabase/Render) and set DATABASE_URL env var.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  // Most hosted Postgres require TLS; pg accepts boolean or object
  ssl: (process.env.RENDER || DATABASE_URL.includes('sslmode=require')) ? { rejectUnauthorized: false } : undefined,
})

async function q(text, params) {
  const res = await pool.query(text, params)
  return res.rows
}

async function init(){
  console.log('[DB] Connecting to Postgres…')
  await pool.query('SELECT 1')

  // Новости
  await pool.query(`CREATE TABLE IF NOT EXISTS news(
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL DEFAULT '',
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    ts BIGINT NOT NULL
  )`)

  // Рейтинг (старая таблица)
  await pool.query(`CREATE TABLE IF NOT EXISTS leaderboard(
    id BIGINT PRIMARY KEY,
    name TEXT,
    photo TEXT,
    level INTEGER DEFAULT 1,
    coins BIGINT DEFAULT 0,
    updated_at BIGINT
  )`)

  // Профили игроков (для рефералок и будущей синхронизации)
  await pool.query(`CREATE TABLE IF NOT EXISTS players(
    id BIGINT PRIMARY KEY,
    username TEXT,
    photo TEXT,
    level INTEGER DEFAULT 1,
    coins BIGINT DEFAULT 0,
    created_at BIGINT,
    updated_at BIGINT
  )`)

  // Рефералы: кто кого пригласил
  await pool.query(`CREATE TABLE IF NOT EXISTS referrals(
    id BIGSERIAL PRIMARY KEY,
    inviter_id BIGINT NOT NULL,
    friend_id BIGINT NOT NULL,
    reward_w BIGINT DEFAULT 0,
    created_at BIGINT,
    UNIQUE(inviter_id, friend_id)
  )`)

  await pool.query('CREATE INDEX IF NOT EXISTS idx_leaderboard_sort ON leaderboard(level DESC, coins DESC)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_referrals_friend ON referrals(friend_id)')
}

app.get('/health', (_req,res)=>res.send('ok'))

// ----- NEWS -----

app.get('/api/news', async (_req,res)=>{
  try{
    const rows = await q('SELECT id,title,text,images,ts FROM news ORDER BY ts DESC LIMIT 200')
    const items = rows.map(r => ({ id:r.id, title:r.title, text:r.text, images: r.images || [], ts:r.ts }))
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
    await pool.query('INSERT INTO news(title,text,images,ts) VALUES($1,$2,$3,$4)', [title||'', text||'', JSON.stringify(imgs), ts])
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
    await pool.query(
      `INSERT INTO leaderboard(id,name,photo,level,coins,updated_at)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET
         name=EXCLUDED.name,
         photo=EXCLUDED.photo,
         level=EXCLUDED.level,
         coins=EXCLUDED.coins,
         updated_at=EXCLUDED.updated_at`,
      [Number(id), name||null, photo||null, playerLevel, Math.floor(coins), now]
    )
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
    const rows = await q('SELECT id,name,photo,level,coins,updated_at FROM leaderboard ORDER BY level DESC, coins DESC LIMIT $1', [limit])
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
    const playerRows = await q('SELECT id,name,photo,level,coins,updated_at FROM leaderboard WHERE id = $1', [id])
    const player = playerRows[0]
    if(!player) return res.json({ rank: null, total: 0, player: null })
    
    const betterRows = await q(
      'SELECT COUNT(*)::bigint as cnt FROM leaderboard WHERE level > $1 OR (level = $1 AND coins > $2)',
      [player.level, player.coins]
    )
    const betterCount = Number(betterRows?.[0]?.cnt || 0)
    const rank = betterCount + 1
    const totalRows = await q('SELECT COUNT(*)::bigint as cnt FROM leaderboard')
    
    const total = Number(totalRows?.[0]?.cnt || 0)
    console.log('[Leaderboard rank]', { id, rank, total })
    res.json({ rank, total, player })
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
    const uname = (username || name) || null
    const lvl = typeof level === 'number' ? level : 1
    const c = typeof coins === 'number' ? coins : 0
    await pool.query(
      `INSERT INTO players(id,username,photo,level,coins,created_at,updated_at)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET
         username=COALESCE(EXCLUDED.username, players.username),
         photo=COALESCE(EXCLUDED.photo, players.photo),
         level=EXCLUDED.level,
         coins=EXCLUDED.coins,
         updated_at=EXCLUDED.updated_at`,
      [Number(id), uname, photo || null, lvl, Math.floor(c), now, now]
    )
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
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // upsert friend profile
      await client.query(
        `INSERT INTO players(id,username,photo,level,coins,created_at,updated_at)
         VALUES($1,$2,$3,1,0,$4,$4)
         ON CONFLICT (id) DO UPDATE SET
           username=COALESCE(EXCLUDED.username, players.username),
           photo=COALESCE(EXCLUDED.photo, players.photo),
           updated_at=EXCLUDED.updated_at`,
        [friendId, name || null, photo || null, now]
      )

      // existing pair?
      const pairRes = await client.query(
        'SELECT reward_w FROM referrals WHERE inviter_id = $1 AND friend_id = $2',
        [inviterId, friendId]
      )
      if (pairRes.rows[0]) {
        await client.query('COMMIT')
        return res.json({ ok:true, already:true, shouldReward:false, rewardW: Number(pairRes.rows[0].reward_w || 0) })
      }

      // friend already referred by anyone?
      const anyRefRes = await client.query('SELECT 1 FROM referrals WHERE friend_id = $1 LIMIT 1', [friendId])
      const rewardW = anyRefRes.rows[0] ? 0 : 5000

      await client.query(
        'INSERT INTO referrals(inviter_id, friend_id, reward_w, created_at) VALUES($1,$2,$3,$4)',
        [inviterId, friendId, rewardW, now]
      )

      await client.query('COMMIT')
      res.json({ ok:true, already:false, shouldReward: rewardW > 0, rewardW })
    } catch (e) {
      try { await client.query('ROLLBACK') } catch {}
      throw e
    } finally {
      client.release()
    }
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

    const rows = await q(`
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
      WHERE r.inviter_id = $1
      ORDER BY r.created_at DESC
    `, [inviterId])

    res.json({ items: rows })
  } catch(e){
    console.error('Referrals my error:', e)
    res.status(500).json({ error:'server_error' })
  }
})

const port = process.env.PORT || 8080
init().then(()=> app.listen(port, ()=> console.log('Server running on port', port)))
