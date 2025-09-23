import React from 'react'
import { FortuneWheel } from './wheel/FortuneWheel'
import { ImageWheel } from './wheel/ImageWheel'

function Toast({ text, onClose }: { text: string, onClose?: () => void }) {
    React.useEffect(() => {
        const t = setTimeout(() => onClose?.(), 2000)
        return () => clearTimeout(t)
    }, [])
    return (
        <div style={toastWrap}><div style={toastCard}>{text}</div></div>
    )
}

function PressIcon({ src, alt, fallbackEmoji }: { src: string, alt: string, fallbackEmoji: string }) {
    const [ok, setOk] = React.useState(true)
    if (!ok) return <span style={{fontSize:30}}>{fallbackEmoji}</span>
    return <img src={src} alt={alt} style={menuIconImg} onError={() => setOk(false)} />
}

export function GameScreen() {
    const [username, setUsername] = React.useState<string>('')
    const [avatarUrl, setAvatarUrl] = React.useState<string>('')
    const [initials, setInitials] = React.useState<string>('')
    const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false)
    const [isRightMenuOpen, setIsRightMenuOpen] = React.useState<boolean>(false)
    const [toast, setToast] = React.useState<string | null>(null)
    // balances and game controls
    const [balanceW, setBalanceW] = React.useState<number>(() => {
        const v = Number(localStorage.getItem('balance_w') || '0')
        if (Number.isFinite(v) && v > 0) return v
        localStorage.setItem('balance_w', String(10000))
        return 10000
    })
    const [balanceB, setBalanceB] = React.useState<number>(() => Number(localStorage.getItem('balance_b') || '0'))
    type GameMode = 'normal' | 'pyramid' | 'allin'
    const [mode, setMode] = React.useState<GameMode>('normal')
    const [currency, setCurrency] = React.useState<'W'|'B'>('W')
    const [bet, setBet] = React.useState<number>(100)
    const [pickedDigit, setPickedDigit] = React.useState<number>(0)
    const [spinning, setSpinning] = React.useState<boolean>(false)
    const [pressedCardIdx, setPressedCardIdx] = React.useState<number | null>(null)
    const MID_RATE_PER_SEC = 0.01
    const MID_INTERVAL_MS = 1_000
    const MID_STOP_AFTER_MS = 3 * 60 * 60 * 1000
    const [midW, setMidW] = React.useState<number>(() => parseFloat(localStorage.getItem('mid_w') || '0') || 0)
    const [midAnim, setMidAnim] = React.useState<boolean>(false)

    React.useEffect(() => { setPressedCardIdx(null) }, [isMenuOpen, isRightMenuOpen])
    // Catch-up accrual based on time away with 3h cap
    React.useEffect(() => {
        function accrueIfDue() {
            const now = Date.now()
            const last = Number(localStorage.getItem('mid_w_last_ts') || String(now))
            const elapsed = Math.max(0, now - last)
            const accrualMs = Math.min(elapsed, MID_STOP_AFTER_MS)
            const ticks = Math.floor(accrualMs / 1000)
            if (ticks > 0) {
                setMidW(prev => {
                    const add = ticks * MID_RATE_PER_SEC
                    const next = Number(((prev || 0) + add).toFixed(2))
                    try {
                        localStorage.setItem('mid_w', String(next))
                        localStorage.setItem('mid_w_last_ts', String(now))
                    } catch {}
                    // анимацию показываем только когда прирост целого значения
                    if (Math.floor(next) > Math.floor(prev || 0)) {
                        setMidAnim(true)
                        setTimeout(() => setMidAnim(false), 900)
                    }
                    return next
                })
            } else {
                try { localStorage.setItem('mid_w_last_ts', String(last)) } catch {}
            }
        }
        accrueIfDue()
        const t = setInterval(() => {
            // regular tick while app is open
            setMidW(prev => {
                const nextRaw = (prev || 0) + MID_RATE_PER_SEC
                const next = Number(nextRaw.toFixed(2))
                try {
                    localStorage.setItem('mid_w', String(next))
                    localStorage.setItem('mid_w_last_ts', String(Date.now()))
                } catch {}
                if (Math.floor(next) > Math.floor(prev || 0)) {
                    setMidAnim(true)
                    setTimeout(() => setMidAnim(false), 900)
                }
                return next
            })
        }, MID_INTERVAL_MS)
        function onVis() { if (!document.hidden) accrueIfDue() }
        document.addEventListener('visibilitychange', onVis)
        return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
    }, [])

    function saveBalances(nextW: number, nextB: number) {
        setBalanceW(nextW)
        setBalanceB(nextB)
        try {
            localStorage.setItem('balance_w', String(nextW))
            localStorage.setItem('balance_b', String(nextB))
        } catch {}
    }

    function getMultiplier(m: GameMode) { return m === 'normal' ? 2 : m === 'allin' ? 5 : 0 }

    function getLimits(m: GameMode, cur: 'W'|'B') {
        // General limits
        const general = cur === 'W' ? { min: 100, max: 1_000_000_000 } : { min: 1, max: 1000 }
        // Mode-specific limits
        const modeLimits = (
            m === 'allin'
                ? (cur === 'W' ? { min: 1000, max: 10000 } : { min: 3, max: 10 })
                : (cur === 'W' ? { min: 100, max: 1000 } : { min: 1, max: 3 })
        )
        return { min: Math.max(general.min, modeLimits.min), max: Math.min(general.max, modeLimits.max) }
    }

    // Clamp bet when mode/currency changes
    React.useEffect(() => {
        const { min, max } = getLimits(mode, currency)
        const baseMin = Math.max(100, min)
        setBet(prev => Math.min(max, Math.max(baseMin, Math.floor(prev || baseMin))))
    }, [mode, currency])

    function onBeforeSpin() {
        if (spinning) return false
        if (pickedDigit == null) { setToast('Выбери число 0–9'); return false }
        const { min, max } = getLimits(mode, currency)
        const b = Math.max(min, Math.min(max, Math.floor(bet)))
        if (b !== bet) setBet(b)
        if (currency === 'W') {
            if (balanceW < b) { setToast('Недостаточно W'); return false }
            saveBalances(balanceW - b, balanceB)
        } else {
            if (balanceB < b) { setToast('Недостаточно B'); return false }
            saveBalances(balanceW, balanceB - b)
        }
        return true
    }

    function onSpinResult(index: number, label: string) {
        const b = Math.floor(bet)
        let delta = 0
        if (mode === 'normal' || mode === 'allin') {
            const won = String(pickedDigit) === label
            if (won) delta = b * getMultiplier(mode)
        } else {
            // pyramid: center 2x, cw neighbor +50%, ccw neighbor +25%
            const center = pickedDigit
            const cw = (pickedDigit + 1) % 10
            const ccw = (pickedDigit + 9) % 10
            const n = Number(label)
            if (n === center) delta = Math.max(1, b * 2)
            else if (n === cw) delta = Math.max(1, Math.floor(b * 1.5))
            else if (n === ccw) delta = Math.max(1, Math.floor(b * 1.25))
        }
        if (delta > 0) {
            if (currency === 'W') saveBalances(balanceW + delta, balanceB)
            else saveBalances(balanceW, balanceB + delta)
            setToast(`Победа! +${delta} ${currency}`)
        } else {
            setToast(`Промах (${label})`)
        }
    }

    function parseUserFromInitDataString(initData: string | undefined) {
        if (!initData) return null
        try {
            const sp = new URLSearchParams(initData)
            const userJson = sp.get('user')
            if (!userJson) return null
            return JSON.parse(userJson)
        } catch { return null }
    }

    React.useEffect(() => {
        try {
            const tg = (window as any).Telegram?.WebApp
            tg?.ready?.()
            const u = tg?.initDataUnsafe?.user || parseUserFromInitDataString(tg?.initData)
            if (u) {
                const uname = u.username || [u.first_name, u.last_name].filter(Boolean).join(' ')
                setUsername(uname)
                if (u.photo_url) setAvatarUrl(u.photo_url)
                const ini = (u.first_name?.[0] || '') + (u.last_name?.[0] || '') || (uname?.[0] || 'I')
                setInitials(ini.toUpperCase())
            }
        } catch {}
    }, [])

    return (
        <div style={root}>
            <div style={topBar}>
                <div style={leftUser}>
                    <div style={avatar}>
                        {avatarUrl
                            ? <img src={avatarUrl} alt="avatar" style={avatarImg} onError={() => setAvatarUrl('')} />
                            : <span style={avatarText}>{initials || '🧑'}</span>
                        }
                    </div>
                    <div style={usernameStyle}>{username || 'Игрок'}</div>
                </div>
                <div style={balances}>
                    <div style={balanceRow}><img src="/coin-w.png" alt="W" style={coinImg} /> <span style={{marginLeft: 6}}>{balanceW}</span></div>
                    <div style={balanceRow}><Coin /> <span style={{marginLeft: 6}}>{balanceB}</span></div>
                </div>
            </div>
            <div style={content}>
                {(!isMenuOpen && !isRightMenuOpen) ? (
                    <>
                        <div style={{...panelsWrap, pointerEvents: spinning ? 'none' : 'auto', opacity: spinning ? .6 : 1}}>
                            {/* Row 1: режим игры (с фоном панели) */}
                            <PanelShell>
                                <div style={rowGrid}>
                                    <Arrow onClick={() => setMode(prev => prev==='normal'?'allin': prev==='pyramid'?'normal':'pyramid')} dir="left" />
                                    <div style={controlBoxText}>{mode==='normal' ? 'Обычный x2 +100%' : mode==='pyramid' ? 'Пирамида 3/10 +100/50/25%' : 'Всё или ничего x5 +500%'}</div>
                                    <Arrow onClick={() => setMode(prev => prev==='normal'?'pyramid': prev==='pyramid'?'allin':'normal')} dir="right" />
                                </div>
                            </PanelShell>
                            {/* Row 2: валюта */}
                            <PanelShell>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                                    <div style={{...currencyCell, background: currency==='W' ? '#ffffff' : 'linear-gradient(180deg, #9cc9ff 0%, #7db6ff 100%)'}} onClick={() => setCurrency('W')}>
                                        <img src="/coin-w.png" alt="W" style={{width:22,height:22}} />
                                    </div>
                                    <div style={{...currencyCell, background: currency==='B' ? '#ffffff' : 'linear-gradient(180deg, #9cc9ff 0%, #7db6ff 100%)'}} onClick={() => setCurrency('B')}>
                                        <div style={{fontWeight:900, color:'#2b66b9'}}>B</div>
                                    </div>
                                </div>
                            </PanelShell>
                            {/* Row 3: ставка */}
                            <PanelShell>
                                <div style={rowGrid}>
                                    <RoundBtn onClick={() => setBet(b => {
                                        const {min} = getLimits(mode, currency)
                                        const baseMin = Math.max(100, min)
                                        const cur = Math.max(baseMin, Math.floor(b || baseMin))
                                        const next = cur - 25
                                        return Math.max(baseMin, next)
                                    })} kind="minus" />
                                    <div style={controlBoxText}>{bet}</div>
                                    <RoundBtn onClick={() => setBet(b => {
                                        const {max} = getLimits(mode, currency)
                                        const baseMin = Math.max(100, getLimits(mode, currency).min)
                                        const cur = Math.max(baseMin, Math.floor(b || baseMin))
                                        const next = cur + 25
                                        return Math.min(max, next)
                                    })} kind="plus" />
                                </div>
                            </PanelShell>

                            {/* Mid W ticker */}
                            <div style={midCounterShell}>
                                <div style={midCounterInner}>
                                    <div style={midValue}>{midW}</div>
                                    <div style={{position:'relative', width:48, height:48, display:'grid', placeItems:'center'}}>
                                        <img src="/coin-w.png" alt="W" style={{width:44,height:44, transform: midAnim? 'scale(1.15)': 'scale(1)', transition:'transform 240ms ease'}} />
                                        {midAnim && <div style={midPlusOne}>+1</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={wheelWrap}>
                            <ImageWheel imageSrc="/wheel.png" labels={["0","1","2","3","4","5","6","7","8","9"]}
                                onBeforeSpin={onBeforeSpin}
                                onResult={onSpinResult}
                                selectedIndex={pickedDigit}
                                onSelectIndex={(idx)=> setPickedDigit(idx)}
                                onSpinningChange={(v) => { setSpinning(v); if (v) { setIsMenuOpen(false); setIsRightMenuOpen(false) } }} />
                        </div>
                    </>
                ) : (
                    <div style={{padding:12}}>
                        <div style={menuList}>
                            {(isMenuOpen ? menuItemsLeft : menuItemsRight).map((item, idx) => (
                                <div
                                    key={`${isMenuOpen ? 'L' : 'R'}:${idx}`}
                                    style={{...menuCard, transform: pressedCardIdx===idx ? 'translateY(2px) scale(0.98)' : 'none'}}
                                    onPointerDown={() => setPressedCardIdx(idx)}
                                    onPointerUp={() => setPressedCardIdx(null)}
                                    onPointerLeave={() => setPressedCardIdx(null)}
                                >
                                    {item.badgeImg && <img src={item.badgeImg} alt="coming soon" style={comingSoonBanner} />}
                                    <div style={menuIconWrap}>{item.icon}</div>
                                    <div style={menuTextWrap}>
                                        <div style={menuTitle}>{item.title}</div>
                                        {item.subtitle && <div style={menuSubtitle}>{item.subtitle}</div>}
                                    </div>
                                    <div style={arrowWrapRight}>
                                        <div style={arrowIconRight}>›</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div style={{...bottomNav, pointerEvents: spinning ? 'none' : 'auto', opacity: spinning ? .6 : 1}}>
                <div
                    style={{...navBtn, ...(isMenuOpen && !isRightMenuOpen ? navBtnActive : {})}}
                    onClick={() => {
                        if (spinning) return
                        setIsRightMenuOpen(false)
                        setIsMenuOpen(true)
                    }}
                >
                    <img src="/zad.png" alt="Задания" style={navIcon} />
                </div>
                <div
                    style={{...navBtn, ...(!isMenuOpen && !isRightMenuOpen ? navBtnActive : {})}}
                    onClick={() => { if (spinning) return; setIsMenuOpen(false); setIsRightMenuOpen(false) }}
                >
                    <img src="/bank.png" alt="Банк" style={navIcon} />
                </div>
                <div
                    style={{...navBtn, ...(isRightMenuOpen ? navBtnActive : {})}}
                    onClick={() => {
                        if (spinning) return
                        setIsMenuOpen(false)
                        setIsRightMenuOpen(true)
                    }}
                >
                    <img src="/shop.png" alt="Магазин" style={navIcon} />
                </div>
            </div>
            {/* Меню теперь показывается в контенте, а не как оверлей */}
            {toast && <Toast text={toast} onClose={() => setToast(null)} />}
        </div>
    )
}

function Coin(){
    return (
        <div style={{width:20,height:20,borderRadius:'50%',background:'radial-gradient(circle,#ffd86b,#f2a93b)',border:'2px solid #7a4e06'}} />
    )
}

const root: React.CSSProperties = {
    minHeight: '100dvh',
    // Более светлый синий фон
    background: 'linear-gradient(180deg, #68b1ff 0%, #3f7ddb 60%, #2e63bf 100%)',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
}

const topBar: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }
const leftUser: React.CSSProperties = { display:'flex', alignItems:'center', gap:10 }

const avatar: React.CSSProperties = { width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '3px solid #2a5b9f', boxShadow:'0 2px 0 #0b2f68', display:'grid', placeItems:'center', overflow:'hidden' }
const avatarImg: React.CSSProperties = { width:'100%', height:'100%', objectFit:'cover' }
const usernameStyle: React.CSSProperties = { color:'#083068', fontWeight: 800, textShadow:'0 1px 0 rgba(255,255,255,0.6)', fontFamily:'"Rubik", Inter, system-ui' }
const avatarText: React.CSSProperties = { display:'grid', placeItems:'center', width:'100%', height:'100%', fontWeight:900, color:'#0b2f68' }
const balances: React.CSSProperties = { display:'grid', gap:8 }
const balanceRow: React.CSSProperties = { display:'flex', alignItems:'center', padding:'6px 10px', background: 'linear-gradient(90deg,#2a5b9f,#184b97)', borderRadius: 12, color:'#fff', boxShadow:'inset 0 0 0 2px #8cbcff' }
const coinImg: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }

const content: React.CSSProperties = { margin: '8px 10px', borderRadius: 12, boxShadow:'inset 0 0 0 3px #8cbcff', background:'rgba(0,0,0,0.05)', position:'relative' }
const wheelWrap: React.CSSProperties = { position:'absolute', bottom: 24, left: '50%', transform:'translateX(-50%) scale(1.16)' }
const panelsWrap: React.CSSProperties = { position:'absolute', top: 8, left: '50%', transform:'translateX(-50%)', display:'grid', gap:8, width:'calc(100% - 40px)', maxWidth: 440 }

const bottomNav: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, padding:8 }
const navBtn: React.CSSProperties = { background:'#244e96', color:'#fff', borderRadius:10, padding:'4px 4px', textAlign:'center', boxShadow:'inset 0 0 0 3px #0b2f68', transition:'transform 140ms ease, background 160ms ease, box-shadow 160ms ease' }
const navBtnActive: React.CSSProperties = { background:'#2b7bd9', boxShadow:'inset 0 0 0 3px #8cbcff, 0 2px 0 rgba(0,0,0,0.25)', transform:'translateY(1px)' }
const navIcon: React.CSSProperties = { width: 36, height: 36, objectFit: 'contain' }

const toastWrap: React.CSSProperties = { position:'fixed', left:0, right:0, bottom:18, display:'grid', placeItems:'center', zIndex:60, pointerEvents:'none' }
const toastCard: React.CSSProperties = {
    padding:'10px 14px',
    borderRadius:12,
    background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
    boxShadow:'0 8px 24px rgba(0,0,0,0.35), inset 0 0 0 3px #0b2f68',
    color:'#fff',
    fontWeight:800,
    letterSpacing:.6,
    fontFamily:'"Russo One", Inter, system-ui',
}

// Controls UI
function ControlRow({ children }: { children: React.ReactNode }){
    return <div style={{display:'grid', gridTemplateColumns:'36px 1fr 36px', alignItems:'center', gap:8}}>{children}</div>
}

function Arrow({ dir, onClick, variant = 'blue' }: { dir:'left'|'right', onClick?: () => void, variant?: 'blue' | 'red' }){
    const base: React.CSSProperties = {
        width: 36,
        height: 24,
        borderRadius: 6,
        background: variant==='red' ? 'linear-gradient(180deg, #e5534b 0%, #c83d37 100%)' : '#1e4b95',
        boxShadow: variant==='red'
            ? 'inset 0 0 0 2px #7a1d12, 0 1px 0 rgba(0,0,0,0.2)'
            : 'inset 0 0 0 2px #0b2f68',
        color: variant==='red' ? '#ffffff' : '#e5534b',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        fontWeight: 900
    }
    return <div style={base} onClick={onClick}>{dir==='left'?'◀':'▶'}</div>
}

function RoundBtn({ kind, onClick }: { kind:'plus'|'minus', onClick?: () => void }){
    const base: React.CSSProperties = {
        width:36, height:24, borderRadius:6,
        background:'#1e4b95',
        boxShadow:'inset 0 0 0 2px #0b2f68',
        color: kind==='plus' ? '#22c55e' : '#e5534b',
        display:'grid', placeItems:'center', cursor:'pointer', userSelect:'none', fontWeight:900
    }
    return <div style={base} onClick={onClick}>{kind==='plus'?'+':'−'}</div>
}

const controlBoxText: React.CSSProperties = {
    background: 'linear-gradient(180deg, #cbe6ff 0%, #9cc9ff 100%)',
    boxShadow: 'inset 0 0 0 3px #0b2f68',
    color: '#ffffff',
    borderRadius: 8,
    textAlign: 'center',
    padding: '6px 10px',
    fontFamily: '"Russo One", Inter, system-ui',
    textShadow: '0 1px 0 rgba(0,0,0,0.35)',
    fontSize: 16,
    letterSpacing: .4
}
const controlCurrency: React.CSSProperties = { display:'grid', placeItems:'center', height:36, borderRadius:8, background:'#2b66b9', boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer' }
const currencyCell: React.CSSProperties = {
    display:'grid', placeItems:'center', height:28, borderRadius:6,
    background: 'linear-gradient(180deg, #9cc9ff 0%, #7db6ff 100%)',
    boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer'
}
const rowGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'36px 1fr 36px', alignItems:'center', gap:8 }
const rowBare: React.CSSProperties = { background:'transparent', width:'88%', margin:'0 auto' }
const midCounterShell: React.CSSProperties = { width:'88%', margin:'2px auto 0', display:'grid' }
const midCounterInner: React.CSSProperties = { justifySelf:'center', display:'grid', gridAutoFlow:'column', alignItems:'center', gap:8, background:'transparent', padding:0, borderRadius:0, boxShadow:'none' }
const midValue: React.CSSProperties = { color:'#fff', fontWeight:900, minWidth:36, textAlign:'center', textShadow:'0 1px 0 rgba(0,0,0,0.35)', fontFamily:'"Russo One", Inter, system-ui', fontSize:48, lineHeight:1 }
const midPlusOne: React.CSSProperties = { position:'absolute', bottom:24, color:'#22c55e', fontWeight:900, animation:'midpop 900ms ease forwards', textShadow:'0 1px 0 rgba(0,0,0,0.35)' }

function PanelShell({ children }: { children: React.ReactNode }){
    return (
        <div style={{
            background: 'linear-gradient(180deg, #2b6fbe 0%, #1f57a0 100%)',
            borderRadius: 10,
            padding: 6,
            boxShadow: 'inset 0 0 0 3px #0b2f68, 0 2px 0 rgba(0,0,0,0.25)',
            width:'88%', margin:'0 auto'
        }}>
            {children}
        </div>
    )
}

function DigitsRow({ value, onChange }: { value: number | null, onChange: (n:number)=>void }){
    return (
        <div style={{display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:6}}>
            {Array.from({length:10}).map((_,i)=> (
                <div key={i} onClick={()=>onChange(i)} style={{padding:'6px 0', textAlign:'center', borderRadius:8, background: value===i ? '#ff6b57' : '#2b66b9', color:'#fff', boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer', fontWeight:900}}>{i}</div>
            ))}
        </div>
    )
}

function onMultiplier(mode: 'x1'|'x2'|'x3'){
    if (mode==='x1') return 1
    if (mode==='x2') return 2
    return 3
}

// betting hooks
function onBeforeSpin(this: any) { return true }
function onSpinResult(this: any, index: number, label: string) { return }

type MenuOverlayProps = { open: boolean, onClose: () => void, items: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> }

function MenuOverlay({ open, onClose, items }: MenuOverlayProps) {
    return (
        <div style={{...overlay, pointerEvents: open ? 'auto' : 'none', opacity: open ? 1 : 0}}>
            <div style={{...sheet, transform: open ? 'translate(-50%, -50%)' : 'translate(-50%, 20%)'}}>
                <div style={menuHeaderWrap}>
                    <button style={menuHeaderBackBtn} onClick={onClose}>‹</button>
                    <div style={menuHeaderTitle}>Меню</div>
                    <div style={{width:36}} />
                </div>
                <div style={menuList}>
                    {items.map((item, idx) => (
                        <div key={idx} style={menuCard}>
                            {item.badgeImg && <img src={item.badgeImg} alt="coming soon" style={comingSoonBanner} />}
                            <div style={menuIconWrap}>{item.icon}</div>
                            <div style={menuTextWrap}>
                                <div style={menuTitle}>{item.title}</div>
                                {item.subtitle && <div style={menuSubtitle}>{item.subtitle}</div>}
                            </div>
                            <div style={arrowWrap}>
                                <div style={arrowIcon}>›</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const overlay: React.CSSProperties = {
    position:'fixed', left:0, right:0, top:0, bottom:96,
    background:'linear-gradient(180deg, #3c76cc 0%, #2356a8 100%)',
    transition:'opacity 220ms ease',
    display:'grid', alignItems:'stretch',
    zIndex: 50
}

const sheet: React.CSSProperties = {
    position:'absolute',
    left:'50%',
    top:'50%',
    width:'92%',
    maxWidth: 420,
    maxHeight:'70vh',
    background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
    borderRadius: 16,
    boxShadow:'inset 0 0 0 3px #0b2f68, 0 8px 24px rgba(0,0,0,0.35)',
    padding: 12,
    transition:'transform 260ms cubic-bezier(.2,.8,.2,1)',
    overflowY:'auto'
}

const sheetHandle: React.CSSProperties = { display:'none' }
const menuHeaderWrap: React.CSSProperties = { display:'grid', gridTemplateColumns:'36px 1fr 36px', alignItems:'center', marginBottom:10 }
const menuHeaderBackBtn: React.CSSProperties = { width:36, height:36, borderRadius:10, border:'none', background:'#1e4b95', color:'#bfe0ff', fontSize:22, fontWeight:800, boxShadow:'inset 0 0 0 2px #0b2f68', cursor:'pointer' }
const menuHeaderTitle: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, letterSpacing:1, fontFamily:'"Russo One", Inter, system-ui' }

const menuList: React.CSSProperties = { display:'grid', gap:12 }

const menuCard: React.CSSProperties = {
    display:'grid',
    gridTemplateColumns:'48px 1fr',
    alignItems:'center',
    gap:10,
    padding:'10px 12px',
    background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
    borderRadius:14,
    boxShadow:'inset 0 0 0 3px #0b2f68, 0 2px 0 rgba(0,0,0,0.25)',
    position:'relative',
    overflow:'visible',
    transition:'transform 120ms ease'
}

const menuIconWrap: React.CSSProperties = { width:48, height:48, display:'grid', placeItems:'center' }
const menuIconImg: React.CSSProperties = { width:'100%', height:'100%', objectFit:'contain' }

const menuTextWrap: React.CSSProperties = { display:'grid', gap:4 }
const menuTitle: React.CSSProperties = { color:'#fff', fontWeight:800, textShadow:'0 1px 0 rgba(0,0,0,0.35)', fontFamily:'"Russo One", Inter, system-ui', letterSpacing:1 }
const menuSubtitle: React.CSSProperties = { color:'#dbe8ff', opacity:.85, fontSize:12, fontFamily:'"Rubik", Inter, system-ui' }

const menuBadge: React.CSSProperties = { marginLeft:6, padding:'4px 8px', background:'#ff6b57', color:'#fff', borderRadius:10, fontSize:12, fontWeight:800, boxShadow:'inset 0 0 0 2px #7a1d12' }

const arrowWrapRight: React.CSSProperties = {
    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
    display:'grid', placeItems:'center', pointerEvents:'none'
}
const arrowIconRight: React.CSSProperties = { color:'#bfe0ff', fontSize:22, lineHeight:1, textShadow:'0 1px 0 rgba(0,0,0,0.35)' }
const comingSoonBanner: React.CSSProperties = { position:'absolute', left:-6, bottom:-7, width:48, pointerEvents:'none', zIndex:2 }

const menuItemsLeft: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> = [
    { title: 'Подключай свой кошелёк TON', subtitle: 'Синхронизируй баланс в игре', icon: <PressIcon src="/press1.png" alt="press1" fallbackEmoji="👛" /> },
    { title: 'Приглашай друзей и получай', subtitle: 'свой процент в игре', icon: <PressIcon src="/press2.png" alt="press2" fallbackEmoji="👥" /> },
    { title: 'Забери ежедневный бонус', subtitle: 'и получай дополнительные очки', icon: <PressIcon src="/press3.png" alt="press3" fallbackEmoji="📝" /> },
    { title: 'Скоро', subtitle: 'Новые режимы', badgeImg:'/coming1.png', icon: <PressIcon src="/coming-soon.svg" alt="coming" fallbackEmoji="🛠️" /> },
    { title: 'Магазин и бонусы', subtitle: 'Покупки за W/TON', icon: <PressIcon src="/press1.png" alt="press1" fallbackEmoji="🛍️" /> },
    { title: 'Скоро', subtitle: 'Ещё функции', badgeImg:'/coming1.png', icon: <PressIcon src="/coming-soon.svg" alt="coming" fallbackEmoji="✈️" /> },
]

const menuItemsRight: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> = [
    { title: 'WHEEL SHOP', subtitle: 'проверь удачу', icon: <PressIcon src="/press1.png" alt="press1" fallbackEmoji="🛒" /> },
    { title: 'WHEEL конвертер', subtitle: 'покупка и обмен игровой валюты', icon: <PressIcon src="/press2.png" alt="press2" fallbackEmoji="💱" /> },
    { title: 'Получай WCOIN', subtitle: 'выполняя задания', icon: <PressIcon src="/press3.png" alt="press3" fallbackEmoji="📝" /> },
    { title: 'Повысил уровень?', subtitle: 'Забирай бонусы!', badgeImg:'/coming1.png', icon: <PressIcon src="/coming-soon.svg" alt="coming" fallbackEmoji="📈" /> },
    { title: 'WCOIN новости', subtitle: 'Будь в курсе всех событий', badgeImg:'/coming1.png', icon: <PressIcon src="/coming-soon.svg" alt="coming" fallbackEmoji="📰" /> },
]





