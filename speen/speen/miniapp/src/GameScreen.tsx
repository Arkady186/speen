import React from 'react'
import { FortuneWheel } from './wheel/FortuneWheel'
function PressIcon({ src, alt }: { src: string, alt: string }) {
    return <img src={src} alt={alt} style={menuIconImg} onError={e => { (e.currentTarget as HTMLImageElement).src = '/coin-w.png' }} />
}

export function GameScreen() {
    const [username, setUsername] = React.useState<string>('')
    const [avatarUrl, setAvatarUrl] = React.useState<string>('')
    const [initials, setInitials] = React.useState<string>('')
    const [view, setView] = React.useState<'game' | 'left' | 'right'>('game')
    const [uiScale, setUiScale] = React.useState<number>(1)

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

    React.useEffect(() => {
        function computeScale() {
            const baseWidth = 390
            const w = Math.max(320, Math.min(window.innerWidth || baseWidth, 480))
            const s = w / baseWidth
            const clamped = Math.max(0.82, Math.min(1.05, s))
            setUiScale(clamped)
        }
        computeScale()
        window.addEventListener('resize', computeScale)
        return () => window.removeEventListener('resize', computeScale)
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
            {(() => {
                const navIconSize = Math.max(30, Math.min(42, Math.round(42 * uiScale)))
                const navBtnPad = Math.max(4, Math.round(6 * uiScale))
                const navHeight = navIconSize + navBtnPad * 2 + 8
                const contentPad = navHeight + 24
                const wheelSize = Math.round(260 * Math.max(0.8, Math.min(1, uiScale)))
                return (
                    <div style={{...content, paddingBottom: contentPad}}>
                        {view === 'game' && (
                            <div style={{...wheelWrap, bottom: contentPad}}>
                                <FortuneWheel size={wheelSize} />
                            </div>
                        )}
                        {view === 'left' && (
                            <MenuScreen title="Задания и бонусы" items={menuItemsLeft} scale={uiScale} />
                        )}
                        {view === 'right' && (
                            <MenuScreen title="Магазин и новости" items={menuItemsRight} scale={uiScale} />
                        )}
                    </div>
                )
            })()}
            {(() => {
                const navIconSize = Math.max(30, Math.min(42, Math.round(42 * uiScale)))
                const navBtnPad = Math.max(4, Math.round(6 * uiScale))
                const navRadius = Math.max(8, Math.round(10 * uiScale))
                const btnStyle: React.CSSProperties = { ...navBtn, padding: `${navBtnPad}px ${navBtnPad}px`, borderRadius: navRadius }
                const bottomFixed: React.CSSProperties = { 
                    ...bottomNav, position:'fixed', left:0, right:0, bottom:0, 
                    paddingBottom: `calc(${navBtnPad + 2}px + env(safe-area-inset-bottom))`,
                    background:'linear-gradient(180deg, rgba(8,35,80,0.00) 0%, rgba(8,35,80,0.35) 55%, rgba(8,35,80,0.55) 100%)',
                    zIndex: 40
                }
                return (
                    <div style={bottomFixed}>
                        <div style={{...btnStyle, ...(view === 'left' ? navBtnActive : undefined)}} onClick={() => setView('left')}><img src="/zad.png" alt="Задания" style={{...navIcon, width: navIconSize, height: navIconSize}} /></div>
                        <div style={{...btnStyle, ...(view === 'game' ? navBtnActive : undefined)}} onClick={() => setView('game')}><img src="/bank.png" alt="Банк" style={{...navIcon, width: navIconSize, height: navIconSize}} /></div>
                        <div style={{...btnStyle, ...(view === 'right' ? navBtnActive : undefined)}} onClick={() => setView('right')}><img src="/shop.png" alt="Магазин" style={{...navIcon, width: navIconSize, height: navIconSize}} /></div>
                    </div>
                )
            })()}
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
const navBtn: React.CSSProperties = { background:'#244e96', color:'#fff', borderRadius:10, padding:'6px 6px', textAlign:'center', boxShadow:'inset 0 0 0 3px #0b2f68', transition:'filter 180ms ease, transform 180ms ease' }
const navBtnActive: React.CSSProperties = { filter:'brightness(0.85)', transform:'translateY(1px)' }
const navIcon: React.CSSProperties = { width: 42, height: 42, objectFit: 'contain' }

type MenuScreenProps = { title: string, items: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }>, scale: number }

function MenuScreen({ title, items, scale }: MenuScreenProps) {
    const cardPad = Math.round(10 * scale)
    const iconBox = Math.round(48 * scale)
    const titleStyle: React.CSSProperties = { ...menuTitle, fontSize: Math.round(16 * scale) }
    const subtitleStyle: React.CSSProperties = { ...menuSubtitle, fontSize: Math.max(11, Math.round(12 * scale)) }
    const arrowWrapSize = Math.round(24 * scale)
    const bannerW = Math.round(48 * scale)
    return (
        <div style={menuContainer}>
            <div style={menuHeaderWrap}>
                <div style={{...menuHeaderTitle, fontSize: Math.round(18 * scale)}}>{title}</div>
            </div>
            <div style={menuList}>
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        style={{...menuCard, padding: `${cardPad}px ${cardPad + 2}px`}}
                        onMouseDown={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(1px) scale(0.995)' }}
                        onMouseUp={e => { (e.currentTarget as HTMLDivElement).style.transform = '' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = '' }}
                        onTouchStart={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(1px) scale(0.995)' }}
                        onTouchEnd={e => { (e.currentTarget as HTMLDivElement).style.transform = '' }}
                    >
                        {item.badgeImg && <img src={item.badgeImg} alt="coming soon" style={{...comingSoonBanner, width: bannerW}} />}
                        <div style={{...menuIconWrap, width: iconBox, height: iconBox}}>{item.icon}</div>
                        <div style={menuTextWrap}>
                            <div style={titleStyle}>{item.title}</div>
                            {item.subtitle && <div style={subtitleStyle}>{item.subtitle}</div>}
                        </div>
                        <div style={{...arrowWrap, width: arrowWrapSize, height: arrowWrapSize, borderRadius: Math.round(arrowWrapSize/2)}}>
                            <div style={{...arrowIcon, fontSize: Math.round(22 * scale)}}>›</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const menuContainer: React.CSSProperties = { padding: 12, minHeight: '100%', overflowY:'auto' }
const menuHeaderWrap: React.CSSProperties = { marginBottom: 8 }
const menuHeaderTitle: React.CSSProperties = { color:'#e8f1ff', fontWeight: 900, textShadow:'0 1px 0 rgba(0,0,0,0.3)' }
const menuList: React.CSSProperties = { display:'grid', gap:12 }

const menuCard: React.CSSProperties = {
    display:'grid',
    gridTemplateColumns:'48px 1fr auto 24px',
    alignItems:'center',
    gap:10,
    padding:'10px 12px',
    background:'linear-gradient(180deg, #447bd1 0%, #2c63b9 60%, #2556a7 100%)',
    borderRadius:16,
    boxShadow:'inset 0 0 0 3px #0b2f68, 0 4px 10px rgba(0,0,0,0.25)',
    position:'relative',
    overflow:'visible'
}

const menuIconWrap: React.CSSProperties = { width:48, height:48, display:'grid', placeItems:'center', borderRadius:999, background:'linear-gradient(180deg, #5c95f0, #386dcc)', boxShadow:'inset 0 0 0 2px #0b2f68', overflow:'hidden' }
const menuIconImg: React.CSSProperties = { width:'100%', height:'100%', objectFit:'contain' }

const menuTextWrap: React.CSSProperties = { display:'grid', gap:4 }
const menuTitle: React.CSSProperties = { color:'#fff', fontWeight:800, textShadow:'0 1px 0 rgba(0,0,0,0.35)' }
const menuSubtitle: React.CSSProperties = { color:'#dbe8ff', opacity:.85, fontSize:12 }

const menuBadge: React.CSSProperties = { marginLeft:6, padding:'4px 8px', background:'#ff6b57', color:'#fff', borderRadius:10, fontSize:12, fontWeight:800, boxShadow:'inset 0 0 0 2px #7a1d12' }

const arrowWrap: React.CSSProperties = { width:24, height:24, borderRadius:12, background:'linear-gradient(180deg,#2a5b9f,#1d4b8d)', display:'grid', placeItems:'center', boxShadow:'inset 0 0 0 2px #0b2f68, 0 1px 0 rgba(0,0,0,0.25)' }
const arrowIcon: React.CSSProperties = { color:'#d3e8ff', fontSize:22, lineHeight:1, transform:'translateX(1px)' }
const comingSoonBanner: React.CSSProperties = { position:'absolute', left:-6, bottom:-7, width:48, pointerEvents:'none', zIndex:2 }

const menuItemsLeft: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> = [
    { title: 'Подключай свой кошелёк TON', subtitle: 'Синхронизируй баланс в игре', icon: <PressIcon src="/press1.png" alt="press1" /> },
    { title: 'Приглашай друзей и получай', subtitle: 'свой процент в игре', icon: <PressIcon src="/press2.png" alt="press2" /> },
    { title: 'Забери ежедневный бонус', subtitle: 'и получай дополнительные очки', icon: <PressIcon src="/press3.png" alt="press3" /> },
    { title: 'Скоро', subtitle: 'Новые режимы', badgeImg:'/coming1.png', icon: <PressIcon src="/press4.png" alt="press4" /> },
    { title: 'Магазин и бонусы', subtitle: 'Покупки за W/TON', icon: <PressIcon src="/press5.png" alt="press5" /> },
    { title: 'Скоро', subtitle: 'Ещё функции', badgeImg:'/coming1.png', icon: <PressIcon src="/press6.png" alt="press6" /> },
]

const menuItemsRight: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode }> = [
    { title: 'WHEEL SHOP', subtitle: 'проверь удачу', icon: <PressIcon src="/press7.png" alt="press7" /> },
    { title: 'WHEEL конвертер', subtitle: 'покупка и обмен игровой валюты', icon: <PressIcon src="/press8.png" alt="press8" /> },
    { title: 'Получай WCOIN', subtitle: 'выполняя задания', icon: <PressIcon src="/press9.png" alt="press9" /> },
    { title: 'Повысил уровень?', subtitle: 'Забирай бонусы!', icon: <PressIcon src="/press10.png" alt="press10" /> },
    { title: 'WCOIN новости', subtitle: 'Будь в курсе всех событий', badgeImg:'/coming1.png', icon: <PressIcon src="/press11.png" alt="press11" /> },
]


