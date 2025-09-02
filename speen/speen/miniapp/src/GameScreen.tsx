import React from 'react'
import { FortuneWheel } from './wheel/FortuneWheel'

export function GameScreen() {
    const [username, setUsername] = React.useState<string>('')
    const [avatarUrl, setAvatarUrl] = React.useState<string>('')
    const [initials, setInitials] = React.useState<string>('')
    const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false)
    const [isRightMenuOpen, setIsRightMenuOpen] = React.useState<boolean>(false)

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
                    <div style={balanceRow}><img src="/coin-w.png" alt="W" style={coinImg} /> <span style={{marginLeft: 6}}>0</span></div>
                    <div style={balanceRow}><Coin /> <span style={{marginLeft: 6}}>B: 0</span></div>
                </div>
            </div>
            <div style={content}>
                <div style={wheelWrap}>
                    <FortuneWheel size={260} />
                </div>
            </div>
            <div style={bottomNav}>
                <div style={navBtn} onClick={() => setIsMenuOpen(true)}><img src="/zad.png" alt="Задания" style={navIcon} /></div>
                <div style={navBtn}><img src="/bank.png" alt="Банк" style={navIcon} /></div>
                <div style={navBtn} onClick={() => setIsRightMenuOpen(true)}><img src="/shop.png" alt="Магазин" style={navIcon} /></div>
            </div>
            <MenuOverlay open={isMenuOpen} onClose={() => setIsMenuOpen(false)} items={menuItemsLeft} />
            <MenuOverlay open={isRightMenuOpen} onClose={() => setIsRightMenuOpen(false)} items={menuItemsRight} />
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
const usernameStyle: React.CSSProperties = { color:'#083068', fontWeight: 800, textShadow:'0 1px 0 rgba(255,255,255,0.6)' }
const avatarText: React.CSSProperties = { display:'grid', placeItems:'center', width:'100%', height:'100%', fontWeight:900, color:'#0b2f68' }
const balances: React.CSSProperties = { display:'grid', gap:8 }
const balanceRow: React.CSSProperties = { display:'flex', alignItems:'center', padding:'6px 10px', background: 'linear-gradient(90deg,#2a5b9f,#184b97)', borderRadius: 12, color:'#fff', boxShadow:'inset 0 0 0 2px #8cbcff' }
const coinImg: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }

const content: React.CSSProperties = { margin: '8px 10px', borderRadius: 12, boxShadow:'inset 0 0 0 3px #8cbcff', background:'rgba(0,0,0,0.05)', position:'relative' }
const wheelWrap: React.CSSProperties = { position:'absolute', bottom: 24, left: '50%', transform:'translateX(-50%) scale(1.16)' }

const bottomNav: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, padding:8 }
const navBtn: React.CSSProperties = { background:'#244e96', color:'#fff', borderRadius:10, padding:'6px 6px', textAlign:'center', boxShadow:'inset 0 0 0 3px #0b2f68' }
const navIcon: React.CSSProperties = { width: 42, height: 42, objectFit: 'contain' }

type MenuOverlayProps = { open: boolean, onClose: () => void, items: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> }

function MenuOverlay({ open, onClose, items }: MenuOverlayProps) {
    return (
        <div style={{...overlay, pointerEvents: open ? 'auto' : 'none', opacity: open ? 1 : 0}} onClick={onClose}>
            <div style={{...sheet, transform: open ? 'translateY(0%)' : 'translateY(100%)'}} onClick={e => e.stopPropagation()}>
                <div style={sheetHandle} />
                <div style={menuList}>
                    {items.map((item, idx) => (
                        <div key={idx} style={menuCard}>
                            {item.badgeImg && <img src={item.badgeImg} alt="coming soon" style={comingSoonBanner} />}
                            <div style={menuIconWrap}>{item.icon}</div>
                            <div style={menuTextWrap}>
                                <div style={menuTitle}>{item.title}</div>
                                {item.subtitle && <div style={menuSubtitle}>{item.subtitle}</div>}
                            </div>
                            {/* text badge kept for potential reuse, but hidden by default */}
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
    position:'fixed', left:0, right:0, top:0, bottom:0,
    background:'rgba(5,20,50,0.45)',
    transition:'opacity 220ms ease',
    display:'grid', alignItems:'end',
    zIndex: 50
}

const sheet: React.CSSProperties = {
    background:'linear-gradient(180deg, #3c76cc 0%, #2356a8 100%)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    boxShadow:'0 -8px 24px rgba(0,0,0,0.35), inset 0 0 0 3px #0b2f68',
    padding: 12,
    transition:'transform 260ms cubic-bezier(.2,.8,.2,1)',
    maxHeight:'78vh',
    overflowY:'auto'
}

const sheetHandle: React.CSSProperties = { width: 48, height: 5, borderRadius: 3, background:'#8cbcff', opacity:.85, margin:'6px auto 10px' }

const menuList: React.CSSProperties = { display:'grid', gap:12 }

const menuCard: React.CSSProperties = {
    display:'grid',
    gridTemplateColumns:'48px 1fr auto 24px',
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

const menuTextWrap: React.CSSProperties = { display:'grid', gap:4 }
const menuTitle: React.CSSProperties = { color:'#fff', fontWeight:800, textShadow:'0 1px 0 rgba(0,0,0,0.35)' }
const menuSubtitle: React.CSSProperties = { color:'#dbe8ff', opacity:.85, fontSize:12 }

const menuBadge: React.CSSProperties = { marginLeft:6, padding:'4px 8px', background:'#ff6b57', color:'#fff', borderRadius:10, fontSize:12, fontWeight:800, boxShadow:'inset 0 0 0 2px #7a1d12' }

const arrowWrap: React.CSSProperties = { width:24, height:24, borderRadius:12, background:'#1e4b95', display:'grid', placeItems:'center', boxShadow:'inset 0 0 0 2px #0b2f68' }
const arrowIcon: React.CSSProperties = { color:'#bfe0ff', fontSize:22, lineHeight:1, transform:'translateX(1px)' }
const comingSoonBanner: React.CSSProperties = { position:'absolute', left:-12, top:-14, width:96, pointerEvents:'none', zIndex:2 }

const menuItemsLeft: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> = [
    { title: 'Подключай свой кошелёк TON', subtitle: 'Синхронизируй баланс в игре', icon: <span style={{fontSize:30}}>👛</span> },
    { title: 'Приглашай друзей и получай', subtitle: 'свой процент в игре', icon: <span style={{fontSize:30}}>👥</span> },
    { title: 'Забери ежедневный бонус', subtitle: 'и получай дополнительные очки', icon: <span style={{fontSize:30}}>📝</span> },
    { title: 'Скоро', subtitle: 'Новые режимы', badgeImg:'/coming-soon.svg', icon: <span style={{fontSize:30}}>🛠️</span> },
    { title: 'Магазин и бонусы', subtitle: 'Покупки за W/TON', icon: <span style={{fontSize:30}}>🛍️</span> },
    { title: 'Скоро', subtitle: 'Ещё функции', badgeImg:'/coming-soon.svg', icon: <span style={{fontSize:30}}>✈️</span> },
]

const menuItemsRight: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> = [
    { title: 'WHEEL SHOP', subtitle: 'проверь удачу', icon: <span style={{fontSize:30}}>🛒</span> },
    { title: 'WHEEL конвертер', subtitle: 'покупка и обмен игровой валюты', icon: <span style={{fontSize:30}}>💱</span> },
    { title: 'Получай WCOIN', subtitle: 'выполняя задания', icon: <span style={{fontSize:30}}>📝</span> },
    { title: 'Повысил уровень?', subtitle: 'Забирай бонусы!', icon: <span style={{fontSize:30}}>📈</span> },
    { title: 'WCOIN новости', subtitle: 'Будь в курсе всех событий', badgeImg:'/coming-soon.svg', icon: <span style={{fontSize:30}}>📰</span> },
]


