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
    const [mode, setMode] = React.useState<'x1'|'x2'|'x3'>('x2')
    const [currency, setCurrency] = React.useState<'W'|'B'>('W')
    const [bet, setBet] = React.useState<number>(15)
    const [pickedDigit, setPickedDigit] = React.useState<number>(0)

    function saveBalances(nextW: number, nextB: number) {
        setBalanceW(nextW)
        setBalanceB(nextB)
        try {
            localStorage.setItem('balance_w', String(nextW))
            localStorage.setItem('balance_b', String(nextB))
        } catch {}
    }

    function getMultiplier(m: 'x1'|'x2'|'x3') { return m === 'x1' ? 1 : m === 'x2' ? 2 : 3 }

    function onBeforeSpin() {
        if (pickedDigit == null) { setToast('Выбери число 0–9'); return false }
        const b = Math.max(1, Math.floor(bet))
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
        const won = String(pickedDigit) === label
        if (!won) { setToast(`Промах (${label})`); return }
        const mult = getMultiplier(mode)
        const prize = Math.max(1, Math.floor(bet)) * mult
        if (currency === 'W') saveBalances(balanceW + prize, balanceB)
        else saveBalances(balanceW, balanceB + prize)
        setToast(`Победа! +${prize} ${currency}`)
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
                    <div style={{...avatar, backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined, backgroundSize:'cover', backgroundPosition:'center'}}>
                        {!avatarUrl && <span style={avatarText}>{initials || 'IG'}</span>}
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
                        <div style={panelsWrap}>
                            {/* Row 1: режим игры */}
                            <PanelShell>
                                <div style={rowGrid}>
                                    <Arrow onClick={() => setMode(prev => prev==='x1'?'x3': prev==='x2'?'x1':'x2')} dir="left" red />
                                    <div style={controlBoxText}>{mode.toUpperCase()} {mode==='x1'?'': mode==='x2'?'+100%':'+200%'}</div>
                                    <Arrow onClick={() => setMode(prev => prev==='x1'?'x2': prev==='x2'?'x3':'x1')} dir="right" red />
                                </div>
                            </PanelShell>
                            {/* Row 2: валюта */}
                            <PanelShell>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                                    <div style={{...currencyCell, background: currency==='W' ? '#ffffff' : '#8fbaff'}} onClick={() => setCurrency('W')}>
                                        <img src="/coin-w.png" alt="W" style={{width:22,height:22}} />
                                    </div>
                                    <div style={{...currencyCell, background: currency==='B' ? '#ffffff' : '#8fbaff'}} onClick={() => setCurrency('B')}>
                                        <div style={{fontWeight:900, color:'#2b66b9'}}>B</div>
                                    </div>
                                </div>
                            </PanelShell>
                            {/* Row 3: выбор сектора 0–9 */}
                            <PanelShell>
                                <div style={rowGrid}>
                                    <RoundBtn onClick={() => setPickedDigit(n => (n+9)%10)} kind="minus" />
                                    <div style={controlBoxText}>{pickedDigit}</div>
                                    <RoundBtn onClick={() => setPickedDigit(n => (n+1)%10)} kind="plus" />
                                </div>
                            </PanelShell>
                        </div>
                        <div style={wheelWrap}>
                            <ImageWheel imageSrc="/wheel.png" labels={["0","1","2","3","4","5","6","7","8","9"]}
                                onBeforeSpin={onBeforeSpin}
                                onResult={onSpinResult} />
                        </div>
                    </>
                ) : (
                    <div style={{padding:12}}>
                        <div style={menuList}>
                            {(isMenuOpen ? menuItemsLeft : menuItemsRight).map((item, idx) => (
                                <div key={idx} style={menuCard}>
                                    {item.badgeImg && <img src={item.badgeImg} alt="coming soon" style={comingSoonBanner} />}
                                    <div style={menuIconWrap}>{item.icon}</div>
                                    <div style={menuTextWrap}>
                                        <div style={menuTitle}>{item.title}</div>
                                        {item.subtitle && <div style={menuSubtitle}>{item.subtitle}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div style={bottomNav}>
                <div style={navBtn} onClick={() => setIsMenuOpen(true)}><img src="/zad.png" alt="Задания" style={navIcon} /></div>
                <div style={navBtn}><img src="/bank.png" alt="Банк" style={navIcon} /></div>
                <div style={navBtn} onClick={() => setIsRightMenuOpen(true)}><img src="/shop.png" alt="Магазин" style={navIcon} /></div>
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

const avatar: React.CSSProperties = { width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '3px solid #2a5b9f', boxShadow:'0 2px 0 #0b2f68' }
const usernameStyle: React.CSSProperties = { color:'#083068', fontWeight: 800, textShadow:'0 1px 0 rgba(255,255,255,0.6)', fontFamily:'"Rubik", Inter, system-ui' }
const avatarText: React.CSSProperties = { display:'grid', placeItems:'center', width:'100%', height:'100%', fontWeight:900, color:'#0b2f68' }
const balances: React.CSSProperties = { display:'grid', gap:8 }
const balanceRow: React.CSSProperties = { display:'flex', alignItems:'center', padding:'6px 10px', background: 'linear-gradient(90deg,#2a5b9f,#184b97)', borderRadius: 12, color:'#fff', boxShadow:'inset 0 0 0 2px #8cbcff' }
const coinImg: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }

const content: React.CSSProperties = { margin: '8px 10px', borderRadius: 12, boxShadow:'inset 0 0 0 3px #8cbcff', background:'rgba(0,0,0,0.05)', position:'relative' }
const wheelWrap: React.CSSProperties = { position:'absolute', bottom: 24, left: '50%', transform:'translateX(-50%) scale(1.16)' }
const panelsWrap: React.CSSProperties = { position:'absolute', top: 8, left: '50%', transform:'translateX(-50%)', display:'grid', gap:8, width:'calc(100% - 40px)', maxWidth: 440 }

const bottomNav: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, padding:8 }
const navBtn: React.CSSProperties = { background:'#244e96', color:'#fff', borderRadius:10, padding:'6px 6px', textAlign:'center', boxShadow:'inset 0 0 0 3px #0b2f68' }
const navIcon: React.CSSProperties = { width: 42, height: 42, objectFit: 'contain' }

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

function Arrow({ dir, onClick }: { dir:'left'|'right', onClick?: () => void }){
    const base: React.CSSProperties = { width:36, height:24, borderRadius:6, background:'#1e4b95', boxShadow:'inset 0 0 0 2px #0b2f68', color:'#bfe0ff', display:'grid', placeItems:'center', cursor:'pointer', userSelect:'none' }
    return <div style={base} onClick={onClick}>{dir==='left'?'◀':'▶'}</div>
}

function RoundBtn({ kind, onClick }: { kind:'plus'|'minus', onClick?: () => void }){
    const base: React.CSSProperties = { width:36, height:24, borderRadius:6, background: kind==='plus' ? '#2c9a41' : '#c0392b', boxShadow:'inset 0 0 0 2px #0b2f68', color:'#fff', display:'grid', placeItems:'center', cursor:'pointer', userSelect:'none', fontWeight:900 }
    return <div style={base} onClick={onClick}>{kind==='plus'?'+':'−'}</div>
}

const controlBoxText: React.CSSProperties = { background:'#8fbaff', boxShadow:'inset 0 0 0 3px #0b2f68', color:'#fff', borderRadius:8, textAlign:'center', padding:'6px 10px', fontFamily:'"Russo One", Inter, system-ui', textShadow:'0 1px 0 rgba(0,0,0,0.25)', fontSize:16 }
const controlCurrency: React.CSSProperties = { display:'grid', placeItems:'center', height:36, borderRadius:8, background:'#2b66b9', boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer' }
const currencyCell: React.CSSProperties = { display:'grid', placeItems:'center', height:28, borderRadius:6, boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer' }
const rowGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'36px 1fr 36px', alignItems:'center', gap:8 }

function PanelShell({ children }: { children: React.ReactNode }){
    return (
        <div style={{background:'#2b66b9', borderRadius:10, padding:6, boxShadow:'inset 0 0 0 3px #0b2f68', width:'88%', margin:'0 auto'}}>
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
    overflow:'visible'
}

const menuIconWrap: React.CSSProperties = { width:48, height:48, display:'grid', placeItems:'center' }
const menuIconImg: React.CSSProperties = { width:'100%', height:'100%', objectFit:'contain' }

const menuTextWrap: React.CSSProperties = { display:'grid', gap:4 }
const menuTitle: React.CSSProperties = { color:'#fff', fontWeight:800, textShadow:'0 1px 0 rgba(0,0,0,0.35)', fontFamily:'"Russo One", Inter, system-ui', letterSpacing:1 }
const menuSubtitle: React.CSSProperties = { color:'#dbe8ff', opacity:.85, fontSize:12, fontFamily:'"Rubik", Inter, system-ui' }

const menuBadge: React.CSSProperties = { marginLeft:6, padding:'4px 8px', background:'#ff6b57', color:'#fff', borderRadius:10, fontSize:12, fontWeight:800, boxShadow:'inset 0 0 0 2px #7a1d12' }

// right arrow removed per request: switching via bottom buttons only
const comingSoonBanner: React.CSSProperties = { position:'absolute', left:-6, bottom:-7, width:48, pointerEvents:'none', zIndex:2 }

const menuItemsLeft: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> = [
    { title: 'Подключай свой кошелёк TON', subtitle: 'Синхронизируй баланс в игре', icon: <PressIcon src="/press1.png" alt="press1" fallbackEmoji="👛" /> },
    { title: 'Приглашай друзей и получай', subtitle: 'свой процент в игре', icon: <PressIcon src="/press2.png" alt="press2" fallbackEmoji="👥" /> },
    { title: 'Забери ежедневный бонус', subtitle: 'и получай дополнительные очки', icon: <PressIcon src="/press3.png" alt="press3" fallbackEmoji="📝" /> },
    { title: 'Скоро', subtitle: 'Новые режимы', badgeImg:'/coming1.png', icon: <PressIcon src="/press4.png" alt="press4" fallbackEmoji="🛠️" /> },
    { title: 'Магазин и бонусы', subtitle: 'Покупки за W/TON', icon: <PressIcon src="/press5.png" alt="press5" fallbackEmoji="🛍️" /> },
    { title: 'Скоро', subtitle: 'Ещё функции', badgeImg:'/coming1.png', icon: <PressIcon src="/press6.png" alt="press6" fallbackEmoji="✈️" /> },
]

const menuItemsRight: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> = [
    { title: 'WHEEL SHOP', subtitle: 'проверь удачу', icon: <PressIcon src="/press7.png" alt="press7" fallbackEmoji="🛒" /> },
    { title: 'WHEEL конвертер', subtitle: 'покупка и обмен игровой валюты', icon: <PressIcon src="/press8.png" alt="press8" fallbackEmoji="💱" /> },
    { title: 'Получай WCOIN', subtitle: 'выполняя задания', icon: <PressIcon src="/press9.png" alt="press9" fallbackEmoji="📝" /> },
    { title: 'Повысил уровень?', subtitle: 'Забирай бонусы!', icon: <PressIcon src="/press10.png" alt="press10" fallbackEmoji="📈" /> },
    { title: 'WCOIN новости', subtitle: 'Будь в курсе всех событий', badgeImg:'/coming1.png', icon: <PressIcon src="/press11.png" alt="press11" fallbackEmoji="📰" /> },
]






