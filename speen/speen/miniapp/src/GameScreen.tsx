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
    const [userId, setUserId] = React.useState<number | null>(null)
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
    const [bonusesOpen, setBonusesOpen] = React.useState<boolean>(false)
    const [inviteOpen, setInviteOpen] = React.useState<boolean>(false)
    const [dailyOpen, setDailyOpen] = React.useState<boolean>(false)
    const [shopOpen, setShopOpen] = React.useState<boolean>(false)
    const [wheelShopOpen, setWheelShopOpen] = React.useState<boolean>(false)
    const [starsOpen, setStarsOpen] = React.useState<boolean>(false)
    const [tasksOpen, setTasksOpen] = React.useState<boolean>(false)
    const [newsOpen, setNewsOpen] = React.useState<boolean>(false)
    // (reverted) responsive sizing for right menu cards
    const BONUS_LABELS: string[] = ['x2','x3','+50%','+25%']
    const BONUS_IMAGES: string[] = ['/battery.png', '/heardwh.png', '/moneywheel.png', '/spacewh.png']
    const SECTOR_TO_BONUS: number[] = [0,1,2,3,0,1,2,3,0,1]
    const getSectorBonusIndex = (i: number) => SECTOR_TO_BONUS[((i % 10) + 10) % 10]
    const [selectedBonusSector, setSelectedBonusSector] = React.useState<number | null>(null)
    const [selectedBonusBucket, setSelectedBonusBucket] = React.useState<number | null>(null)
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
    async function openStarsPurchase(stars: number, toB: number) {
        try {
            const tg = (window as any).Telegram?.WebApp
            // 1) пробуем взять ссылку из env (например, VITE_STARS_LINK_10)
            const envKey = `VITE_STARS_LINK_${stars}`
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const env: any = (import.meta as any)?.env || {}
            let invoiceLink: string | null = env[envKey] || null
            // 2) иначе пробуем получить с бэкенда (если настроен)
            if (!invoiceLink) {
                try {
                    const res = await fetch(`/api/stars-invoice?stars=${encodeURIComponent(stars)}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (data?.link) invoiceLink = data.link
                    }
                } catch {}
            }
            if (!invoiceLink) {
                setToast('Платёжная ссылка недоступна')
                return
            }
            const onPaid = () => {
                saveBalances(balanceW, balanceB + toB)
                setToast(`+${toB} B за ${stars}⭐`)
            }
            if (tg?.openInvoice) {
                tg.openInvoice(invoiceLink, (status: string) => {
                    if (status === 'paid') onPaid()
                })
            } else if (tg?.openTelegramLink) {
                tg.openTelegramLink(invoiceLink)
            } else {
                window.open(invoiceLink, '_blank')
            }
        } catch {
            setToast('Ошибка открытия оплаты')
        }
    }

    function getLimits(m: GameMode, cur: 'W'|'B') {
        // General limits
        const general = cur === 'W' ? { min: 100, max: 1_000_000_000 } : { min: 1, max: 1000 }
        // Mode-specific limits per spec
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
        setBet(prev => {
            const cur = Math.floor(prev || baseMin)
            return Math.min(max, Math.max(baseMin, cur))
        })
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

        const numCorrect = String(pickedDigit) === label
        const sectorBonusIdx = getSectorBonusIndex(index)
        const bonusCorrect = selectedBonusSector != null && selectedBonusSector === index

        // Если верная цифра, но бонус неверный — возвращаем ставку
        if (numCorrect && !bonusCorrect) {
            if (currency === 'W') saveBalances(balanceW + b, balanceB)
            else saveBalances(balanceW, balanceB + b)
            setToast('Цифра угадана! Ставка возвращена')
            return
        }

        // Если неверная цифра, но бонус верный — выдаём бонус (инвентарь)
        if (!numCorrect && bonusCorrect) {
            try {
                const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                const inv: string[] = JSON.parse(invRaw)
                const bonusName = BONUS_LABELS[sectorBonusIdx] || `Бонус ${sectorBonusIdx}`
                inv.push(bonusName)
                localStorage.setItem('bonuses_inv', JSON.stringify(inv))
            } catch {}
            setToast('Бонус получен!')
            return
        }

        // Иначе — стандартная логика выигрыша по цифре/режиму
        let delta = 0
        if (mode === 'normal' || mode === 'allin') {
            const won = numCorrect
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

        // задачи: учёт спинов
        try {
            const spins = Number(localStorage.getItem('task_spins') || '0') + 1
            localStorage.setItem('task_spins', String(spins))
            // 50 спинов -> +1000 W
            if (spins === 50) {
                saveBalances(balanceW + 1000, balanceB)
                setToast('+1000 W (за 50 спинов)')
            }
            // 100 спинов -> +1 B
            if (spins === 100) {
                saveBalances(balanceW, balanceB + 1)
                setToast('+1 B (за 100 спинов)')
            }
        } catch {}
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
                if (u.id) setUserId(Number(u.id))
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
                    <div style={{display:'grid'}}>
                        <div style={usernameStyle}>{username || 'Игрок'}</div>
                        <div style={levelStyle}>1 lvl</div>
                    </div>
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
                                onSpinningChange={(v) => { setSpinning(v); if (v) { setIsMenuOpen(false); setIsRightMenuOpen(false) } }}
                                 onOpenBonuses={() => setBonusesOpen(true)}
                                 selectedBonusIndex={selectedBonusSector}
                                 onSelectBonusSector={(idx) => { setSelectedBonusSector(idx); setSelectedBonusBucket(getSectorBonusIndex(idx)) }} />
                        </div>
                        {bonusesOpen && (
                            <div style={bonusOverlay} onClick={() => setBonusesOpen(false)}>
                                <div style={bonusSheet} onClick={(e)=>e.stopPropagation()}>
                                    <div style={bonusHeader}>Выбор бонусов</div>
                                    <div style={{...bonusGrid, gridTemplateColumns:'repeat(2, 1fr)'}}>
                                         {BONUS_LABELS.map((b, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                     ...bonusCard,
                                                     boxShadow: selectedBonusBucket===i ? 'inset 0 0 0 3px #22c55e' : bonusCard.boxShadow as string
                                                }}
                                                 onClick={()=>{ setSelectedBonusBucket(i); setBonusesOpen(false); setToast(`Выбран бонус: ${b}`) }}
                                            >
                                                <img src={BONUS_IMAGES[i]} alt={b} style={{width:36,height:36,objectFit:'contain'}} />
                                                <div style={{fontWeight:800, color:'#fff'}}>{b}</div>
                                                {/* count placeholder: show current count from inventory */}
                                                <div style={{marginTop:6, color:'#e8f1ff', fontWeight:800, opacity:.9}}>
                                                    {(() => {
                                                        try {
                                                            const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                                                            const inv: string[] = JSON.parse(invRaw)
                                                            const count = inv.filter(x => x === b).length
                                                            return `x${count}`
                                                        } catch { return 'x0' }
                                                    })()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{display:'grid', placeItems:'center', marginTop:10}}>
                                        <button style={bonusCloseBtn} onClick={()=>setBonusesOpen(false)}>Закрыть</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
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
                                onClick={() => {
                                    const left = isMenuOpen
                                    const act = (item as any).action
                                    if (left) {
                                        if (act === 'invite') setInviteOpen(true)
                                        if (act === 'daily') setDailyOpen(true)
                                        if (act === 'shop') setShopOpen(true)
                                        if (act === 'stars') setStarsOpen(true)
                                    } else {
                                        if (act === 'wheelshop') setWheelShopOpen(true)
                                        if (act === 'tasks') setTasksOpen(true)
                                        if (act === 'news') setNewsOpen(true)
                                    }
                                }}
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
            {starsOpen && (
                <div style={{...overlay, bottom: 0}}>
                    <div style={sheet}>
                        <div style={menuHeaderWrap}>
                            <button style={menuHeaderBackBtn} onClick={() => setStarsOpen(false)}>‹</button>
                            <div style={menuHeaderTitle}>Пополнить за ⭐</div>
                            <div style={{width:36}} />
                        </div>
                        <div style={{display:'grid', gap:10}}>
                            <div style={{textAlign:'center', color:'#e8f1ff', fontWeight:900}}>10⭐ = 1 B</div>
                            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
                                {[10, 30, 100].map((stars, i) => (
                                    <div key={`st-${i}`} style={{display:'grid', gap:6, placeItems:'center', background:'linear-gradient(180deg,#3d74c6,#2b66b9)', borderRadius:12, boxShadow:'inset 0 0 0 3px #0b2f68', padding:'8px 10px'}}>
                                        <div style={{color:'#fff', fontWeight:800}}>{stars} ⭐</div>
                                        <button style={{ padding:'6px 10px', borderRadius:8, border:'none', background:'#ffd23a', color:'#0b2f68', fontWeight:900, boxShadow:'inset 0 0 0 3px #7a4e06', cursor:'pointer' }} onClick={() => openStarsPurchase(stars, Math.floor(stars/10))}>
                                            Получить {Math.floor(stars/10)} B
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {inviteOpen && (
                <div style={{...overlay, bottom: 0}}>
                    <div style={sheet}>
                        <div style={menuHeaderWrap}>
                            <button style={menuHeaderBackBtn} onClick={() => setInviteOpen(false)}>‹</button>
                            <div style={menuHeaderTitle}>Пригласи друга</div>
                            <div style={{width:36}} />
                        </div>
                        <div style={{display:'grid', gap:10}}>
                            <div style={{textAlign:'center', color:'#e8f1ff', fontWeight:800}}>Поделись ссылкой на игру и получай бонусы за друзей</div>
                            <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center'}}>
                                <input readOnly value={(() => {
                                    try {
                                        const tg = (window as any).Telegram?.WebApp
                                        const bot = (import.meta as any)?.env?.VITE_TG_BOT || 'TestCodeTg_bot'
                                        const uid = tg?.initDataUnsafe?.user?.id
                                        const payload = uid ? `ref_${uid}` : 'invite'
                                        return `https://t.me/${bot}?startapp=${encodeURIComponent(payload)}`
                                    } catch { return 'https://t.me' }
                                })() as any} style={inviteInput} />
                                <button style={inviteBtn} onClick={() => {
                                    let url = 'https://t.me'
                                    try {
                                        const tg = (window as any).Telegram?.WebApp
                                        const bot = (import.meta as any)?.env?.VITE_TG_BOT || 'TestCodeTg_bot'
                                        const uid = tg?.initDataUnsafe?.user?.id
                                        const payload = uid ? `ref_${uid}` : 'invite'
                                        url = `https://t.me/${bot}?startapp=${encodeURIComponent(payload)}`
                                    } catch {}
                                    const text = 'Присоединяйся в игру!'
                                    try {
                                        const tg = (window as any).Telegram?.WebApp
                                        if (tg?.openTelegramLink) {
                                            const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
                                            tg.openTelegramLink(share)
                                            return
                                        }
                                    } catch {}
                                    if ((navigator as any)?.share) {
                                        (navigator as any).share({ title:'WHEEL', text, url }).catch(()=>{})
                                        return
                                    }
                                    navigator.clipboard?.writeText(url).then(()=> setToast('Ссылка скопирована'))
                                }}>Поделиться</button>
                            </div>
                            <div style={{display:'grid', placeItems:'center'}}>
                                <button style={inviteSecondaryBtn} onClick={() => setInviteOpen(false)}>Закрыть</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {shopOpen && (
                <div style={{...overlay, bottom: 0}}>
                    <div style={sheet}>
                        <div style={menuHeaderWrap}>
                            <button style={menuHeaderBackBtn} onClick={() => setShopOpen(false)}>‹</button>
                            <div style={menuHeaderTitle}>Покупки и бонусы</div>
                            <div style={{width:36}} />
                        </div>
                        <ShopPanel
                            onClose={() => setShopOpen(false)}
                            bonusLabels={BONUS_LABELS}
                            bonusImages={BONUS_IMAGES}
                            onPurchase={(title, priceB) => {
                                // списываем B, добавляем в инвентарь покупок
                                if (balanceB < priceB) { setToast('Недостаточно B'); return false }
                                saveBalances(balanceW, balanceB - priceB)
                                try {
                                    const raw = localStorage.getItem('purchases') || '[]'
                                    const list: Array<{title:string, priceB:number, ts:number}> = JSON.parse(raw)
                                    list.push({ title, priceB, ts: Date.now() })
                                    localStorage.setItem('purchases', JSON.stringify(list))
                                } catch {}
                                setToast(`Куплено: ${title} за ${priceB} B`)
                                return true
                            }}
                            onBuyStars={(stars, toB) => openStarsPurchase(stars, toB)}
                        />
                    </div>
                </div>
            )}
            {wheelShopOpen && (
                <div style={{...overlay, bottom: 0}}>
                    <div style={sheet}>
                        <div style={menuHeaderWrap}>
                            <button style={menuHeaderBackBtn} onClick={() => setWheelShopOpen(false)}>‹</button>
                            <div style={menuHeaderTitle}>WHEEL SHOP</div>
                            <div style={{width:36}} />
                        </div>
                        <div style={{display:'grid', gap:12}}>
                            <div style={{color:'#e8f1ff', textAlign:'center', fontWeight:900}}>Купить бонусы за 1 B</div>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                                {BONUS_LABELS.map((b, i) => (
                                    <div key={`wb-${i}`} style={{display:'grid', gridTemplateColumns:'48px 1fr auto', alignItems:'center', gap:8, background:'linear-gradient(180deg,#3d74c6,#2b66b9)', borderRadius:12, boxShadow:'inset 0 0 0 3px #0b2f68', padding:'8px 10px'}}>
                                        <img src={BONUS_IMAGES[i]} alt={b} style={{width:44,height:44,objectFit:'contain'}} />
                                        <div style={{color:'#fff', fontWeight:800}}>{b}</div>
                                        <button style={{ padding:'6px 10px', borderRadius:8, border:'none', background:'#ffd23a', color:'#0b2f68', fontWeight:900, boxShadow:'inset 0 0 0 3px #7a4e06', cursor:'pointer' }} onClick={() => {
                                            if (balanceB < 1) { setToast('Недостаточно B'); return }
                                            saveBalances(balanceW, balanceB - 1)
                                            try {
                                                const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                                                const inv: string[] = JSON.parse(invRaw)
                                                inv.push(b)
                                                localStorage.setItem('bonuses_inv', JSON.stringify(inv))
                                            } catch {}
                                            setToast(`Куплено: ${b} за 1 B`)
                                        }}>1 B</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {tasksOpen && (
                <div style={{...overlay, bottom: 0}}>
                    <div style={sheet}>
                        <div style={menuHeaderWrap}>
                            <button style={menuHeaderBackBtn} onClick={() => setTasksOpen(false)}>‹</button>
                            <div style={menuHeaderTitle}>Задания</div>
                            <div style={{width:36}} />
                        </div>
                        <TasksPanel onClose={() => setTasksOpen(false)} onShare5={() => {
                            try {
                                const tg = (window as any).Telegram?.WebApp
                                const url = window.location.href
                                const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Присоединяйся в игру!')}`
                                if (tg?.openTelegramLink) tg.openTelegramLink(share)
                                else window.open(share, '_blank')
                            } catch {}
                        }} />
                    </div>
                </div>
            )}
            {newsOpen && (
                <div style={overlayDim} onClick={() => setNewsOpen(false)}>
                    <div style={newsPopup} onClick={(e)=>e.stopPropagation()}>
                        <div style={newsPopupHeader}>
                            <div style={newsPopupTitle}>📰 WCOIN новости</div>
                            <button style={newsCloseBtn} onClick={() => setNewsOpen(false)}>✕</button>
                        </div>
                        <NewsPanel onClose={() => setNewsOpen(false)} isAdmin={userId === 1408757717} />
                    </div>
                </div>
            )}
            {dailyOpen && (
                <div style={{...overlay, bottom: 0}}>
                    <div style={sheet}>
                        <div style={menuHeaderWrap}>
                            <button style={menuHeaderBackBtn} onClick={() => setDailyOpen(false)}>‹</button>
                            <div style={menuHeaderTitle}>Ежедневный бонус</div>
                            <div style={{width:36}} />
                        </div>
                        <DailyBonus
                            onClose={() => setDailyOpen(false)}
                            onClaim={(amount) => {
                                saveBalances(balanceW + amount, balanceB)
                                setToast(`+${amount} W за ежедневный вход`)
                                setDailyOpen(false)
                            }}
                        />
                    </div>
                </div>
            )}
            {toast && <Toast text={toast} onClose={() => setToast(null)} />}
        </div>
    )
}

function Coin(){
    return (
        <div style={{width:20,height:20,borderRadius:'50%',background:'radial-gradient(circle,#ffd86b,#f2a93b)',border:'2px solid #7a4e06'}} />
    )
}

function DailyBonus({ onClose, onClaim }: { onClose: () => void, onClaim: (amount: number) => void }){
    const [todayClaimed, setTodayClaimed] = React.useState<boolean>(() => {
        try {
            const d = localStorage.getItem('daily_claim_date')
            const today = new Date().toDateString()
            return d === today
        } catch { return false }
    })
    const amount = 50
    function handleClaim(){
        if (todayClaimed) return
        try { localStorage.setItem('daily_claim_date', new Date().toDateString()) } catch {}
        setTodayClaimed(true)
        onClaim(amount)
    }
    return (
        <div style={{display:'grid', gap:12}}>
            <div style={{textAlign:'center', color:'#fff', fontWeight:900}}>Заходи каждый день и получай +{amount} W</div>
            <div style={{display:'grid', placeItems:'center'}}>
                <button style={{ padding:'10px 14px', borderRadius:10, border:'none', background: todayClaimed ? '#889bb9' : '#22c55e', color:'#0b2f68', fontWeight:900, boxShadow:'inset 0 0 0 3px #0a5d2b', cursor: todayClaimed ? 'default' : 'pointer' }} onClick={handleClaim} disabled={todayClaimed}>
                    {todayClaimed ? 'Уже получено сегодня' : 'Забрать бонус'}
                </button>
            </div>
            <div style={{display:'grid', placeItems:'center'}}>
                <button style={inviteSecondaryBtn} onClick={onClose}>Закрыть</button>
            </div>
        </div>
    )
}

function TasksPanel({ onClose, onShare5 }: { onClose: () => void, onShare5: () => void }){
    const spins = Number(localStorage.getItem('task_spins') || '0')
    const loginStreak = (()=>{
        try {
            const today = new Date().toDateString()
            const last = localStorage.getItem('task_last_login')
            let streak = Number(localStorage.getItem('task_streak') || '0')
            if (last !== today) {
                if (last) streak = (new Date(today).getTime() - new Date(last).getTime()) <= 86400000*2 ? streak + 1 : 1
                else streak = 1
                localStorage.setItem('task_last_login', today)
                localStorage.setItem('task_streak', String(streak))
            }
            return streak
        } catch { return 1 }
    })()
    const sharedCount = Number(localStorage.getItem('task_shared') || '0')
    function claim(name: string, reward: {W?:number, B?:number}){
        const key = `task_done_${name}`
        if (localStorage.getItem(key) === '1') return
        if (reward.W) saveBalances(Number(localStorage.getItem('balance_w')||'0') + reward.W, Number(localStorage.getItem('balance_b')||'0'))
        if (reward.B) saveBalances(Number(localStorage.getItem('balance_w')||'0'), Number(localStorage.getItem('balance_b')||'0') + reward.B)
        try { localStorage.setItem(key,'1') } catch {}
    }
    const card = (title: string, progress: string, canClaim: boolean, onClick: () => void) => (
        <div style={{display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:8, background:'linear-gradient(180deg,#3d74c6,#2b66b9)', borderRadius:12, boxShadow:'inset 0 0 0 3px #0b2f68', padding:'8px 10px'}}>
            <div>
                <div style={{color:'#fff', fontWeight:900}}>{title}</div>
                <div style={{color:'#e8f1ff', opacity:.9, fontSize:12}}>{progress}</div>
            </div>
            <button disabled={!canClaim} style={{ padding:'6px 10px', borderRadius:8, border:'none', background: canClaim ? '#22c55e' : '#889bb9', color:'#0b2f68', fontWeight:900, boxShadow:'inset 0 0 0 3px #0a5d2b', cursor: canClaim ? 'pointer' : 'default' }} onClick={onClick}>Забрать</button>
        </div>
    )
    const spin50Done = (localStorage.getItem('task_done_spin50') === '1')
    const spin100Done = (localStorage.getItem('task_done_spin100') === '1')
    const streak7Done = (localStorage.getItem('task_done_streak7') === '1')
    const share5Done = (localStorage.getItem('task_done_share5') === '1')
    return (
        <div style={{display:'grid', gap:10}}>
            {card('50 прокрутов — 1000 W', `${Math.min(50, spins)}/50`, !spin50Done && spins >= 50, () => claim('spin50', {W:1000}))}
            {card('100 прокрутов — 1 B', `${Math.min(100, spins)}/100`, !spin100Done && spins >= 100, () => claim('spin100', {B:1}))}
            {card('Заходи 7 дней подряд — 1 B', `${Math.min(7, loginStreak)}/7`, !streak7Done && loginStreak >= 7, () => claim('streak7', {B:1}))}
            {card('Поделись с 5 друзьями — 5000 W', `${Math.min(5, sharedCount)}/5`, !share5Done && sharedCount >= 5, () => claim('share5', {W:5000}))}
            <div style={{display:'grid', placeItems:'center'}}>
                <button style={inviteSecondaryBtn} onClick={onClose}>Закрыть</button>
            </div>
        </div>
    )
}

function NewsPanel({ onClose, isAdmin }: { onClose: () => void, isAdmin: boolean }){
    const [title, setTitle] = React.useState('')
    const [text, setText] = React.useState('')
    const [images, setImages] = React.useState<string[]>([])
    const list: Array<{title:string, text:string, images:string[], ts:number}> = (()=>{
        try { return JSON.parse(localStorage.getItem('news_list') || '[]') } catch { return [] }
    })()
    function addNews(){
        if (!isAdmin) return
        const next = [{ title, text, images, ts: Date.now() }, ...list]
        try { localStorage.setItem('news_list', JSON.stringify(next)) } catch {}
        setTitle(''); setText(''); setImages([])
    }
    function addImage(){
        const url = prompt('Ссылка на картинку') || ''
        if (!url) return
        setImages(prev => [...prev, url])
    }
    const newsInputStyle: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:10, border:'none', background:'rgba(255,255,255,0.95)', boxShadow:'inset 0 0 0 2px #0b2f68', color:'#083068', fontWeight:700, fontFamily:'"Rubik", Inter, system-ui' }
    const newsAddBtn: React.CSSProperties = { padding:'10px 14px', borderRadius:10, border:'none', background:'#22c55e', color:'#fff', fontWeight:900, boxShadow:'0 4px 12px rgba(34,197,94,0.35)', cursor:'pointer', transition:'transform 120ms ease' }
    const newsCard: React.CSSProperties = { background:'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))', borderRadius:16, boxShadow:'0 8px 20px rgba(0,0,0,0.2), inset 0 0 0 2px rgba(255,255,255,0.25)', padding:'12px 14px' }
    return (
        <div style={{display:'grid', gap:14}}>
            {isAdmin && (
                <div style={{display:'grid', gap:10, background:'rgba(255,255,255,0.12)', borderRadius:14, boxShadow:'inset 0 0 0 2px rgba(255,255,255,0.25)', padding:'12px 14px'}}>
                    <div style={{color:'#fff', fontWeight:900, fontSize:16}}>➕ Добавить новость</div>
                    <input placeholder="Заголовок" value={title} onChange={e=>setTitle(e.target.value)} style={newsInputStyle} />
                    <textarea placeholder="Текст" value={text} onChange={e=>setText(e.target.value)} style={{...newsInputStyle, minHeight:90, resize:'vertical' as any}} />
                    <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                        {images.map((src,i)=>(<img key={i} src={src} alt="img" style={{width:72,height:72,objectFit:'cover',borderRadius:10,boxShadow:'0 4px 12px rgba(0,0,0,0.25)'}} />))}
                        <button style={{...newsAddBtn, fontSize:13}} onClick={addImage}>📷 Фото</button>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:10}}>
                        <div />
                        <button style={newsAddBtn} onClick={addNews}>🚀 Опубликовать</button>
                    </div>
                </div>
            )}
            <div style={{display:'grid', gap:12}}>
                {list.length===0 ? (
                    <div style={{color:'#e8f1ff', textAlign:'center', opacity:.85, padding:20}}>Новостей пока нет</div>
                ) : list.map((n, idx) => (
                    <div key={idx} style={newsCard}>
                        <div style={{color:'#fff', fontWeight:900, fontSize:17, marginBottom:8, textShadow:'0 2px 4px rgba(0,0,0,0.25)'}}>{n.title}</div>
                        <div style={{color:'#e8f1ff', whiteSpace:'pre-wrap', lineHeight:1.5, fontSize:14}}>{n.text}</div>
                        {n.images.length>0 && (
                            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(90px, 1fr))', gap:8, marginTop:10}}>
                                {n.images.map((src,i)=>(<img key={i} src={src} alt="news" style={{width:'100%', height:96, objectFit:'cover', borderRadius:10, boxShadow:'0 4px 12px rgba(0,0,0,0.25)'}} />))}
                            </div>
                        )}
                        <div style={{color:'rgba(255,255,255,0.7)', fontSize:11, marginTop:10, textAlign:'right', fontWeight:600}}>{new Date(n.ts).toLocaleString('ru-RU')}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ShopPanel({ onClose, onPurchase, bonusLabels, bonusImages, onBuyStars }: { onClose: () => void, onPurchase: (title: string, priceB: number) => boolean, bonusLabels: string[], bonusImages: string[], onBuyStars: (stars: number, toB: number) => void }){
    const items: Array<{ title: string, priceB: number, img?: string }> = [
        { title: 'VIP значок', priceB: 3, img:'/press10.png' },
        { title: 'Скин колеса', priceB: 4, img:'/press8.png' },
    ]
    const purchases: Array<{title:string, priceB:number, ts:number}> = (()=>{
        try { return JSON.parse(localStorage.getItem('purchases') || '[]') } catch { return [] }
    })()
    return (
        <div style={{display:'grid', gap:12}}>
            <div style={{color:'#e8f1ff', textAlign:'center', fontWeight:900}}>Покупки за B</div>
            <div style={{display:'grid', gap:8}}>
                {items.map((it, i) => (
                    <div key={i} style={{display:'grid', gridTemplateColumns:'48px 1fr auto', alignItems:'center', gap:8, background:'linear-gradient(180deg,#3d74c6,#2b66b9)', borderRadius:12, boxShadow:'inset 0 0 0 3px #0b2f68', padding:'8px 10px'}}>
                        <img src={it.img} alt={it.title} style={{width:44,height:44,objectFit:'contain'}} />
                        <div style={{color:'#fff', fontWeight:800}}>{it.title}</div>
                        <button style={{ padding:'8px 10px', borderRadius:8, border:'none', background:'#ffd23a', color:'#0b2f68', fontWeight:900, boxShadow:'inset 0 0 0 3px #7a4e06', cursor:'pointer' }} onClick={() => onPurchase(it.title, it.priceB)}>
                            Купить {it.priceB} B
                        </button>
                    </div>
                ))}
            </div>
            {/* Покупка бонусов перенесена в Wheel Shop (правое меню) */}
            {/* блок Stars перемещен в отдельную модалку */}
            <div style={{color:'#e8f1ff', textAlign:'center', fontWeight:900}}>Мои бонусы и покупки</div>
            <div style={{display:'grid', gap:6}}>
                {purchases.length === 0 ? (
                    <div style={{color:'#e8f1ff', textAlign:'center', opacity:.8}}>Пока пусто</div>
                ) : purchases.map((p, idx) => (
                    <div key={idx} style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center', background:'rgba(0,0,0,0.15)', borderRadius:10, padding:'6px 8px', boxShadow:'inset 0 0 0 2px #0b2f68'}}>
                        <div style={{color:'#fff', fontWeight:800}}>{p.title}</div>
                        <div style={{color:'#ffd23a', fontWeight:900}}>{p.priceB} B</div>
                    </div>
                ))}
            </div>
            <div style={{display:'grid', placeItems:'center'}}>
                <button style={inviteSecondaryBtn} onClick={onClose}>Закрыть</button>
            </div>
        </div>
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
const levelStyle: React.CSSProperties = { color:'#e8f1ff', fontWeight:800, fontSize:12, lineHeight:1.1, textShadow:'0 1px 0 rgba(0,0,0,0.25)' }
const avatarText: React.CSSProperties = { display:'grid', placeItems:'center', width:'100%', height:'100%', fontWeight:900, color:'#0b2f68' }
const balances: React.CSSProperties = { display:'grid', gap:8 }
const balanceRow: React.CSSProperties = { display:'flex', alignItems:'center', padding:'6px 10px', background: 'linear-gradient(90deg,#2a5b9f,#184b97)', borderRadius: 12, color:'#fff', boxShadow:'inset 0 0 0 2px #8cbcff' }
const coinImg: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }

const content: React.CSSProperties = { margin: '8px 10px', borderRadius: 12, boxShadow:'inset 0 0 0 3px #8cbcff', background:'rgba(0,0,0,0.05)', position:'relative' }
const wheelWrap: React.CSSProperties = { position:'absolute', bottom: 24, left: '50%', transform:'translateX(-50%) scale(1.16)' }
const plusNearWheel: React.CSSProperties = { position:'absolute', left: -56, bottom: -8, width: 40, height: 40, objectFit:'contain', pointerEvents:'none', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }
// removed external plusOutsideWrap
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

// Bonuses UI
const bonusOverlay: React.CSSProperties = { position:'fixed', left:0, right:0, top:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:80 }
const bonusSheet: React.CSSProperties = { width:'90%', maxWidth:420, background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)', borderRadius:14, boxShadow:'inset 0 0 0 3px #0b2f68, 0 8px 24px rgba(0,0,0,0.35)', padding:12 }
const bonusHeader: React.CSSProperties = { color:'#fff', fontWeight:900, textAlign:'center', marginBottom:10, fontFamily:'"Russo One", Inter, system-ui' }
const bonusGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }
const bonusCard: React.CSSProperties = { display:'grid', placeItems:'center', gap:6, padding:'10px 8px', background:'#1e4b95', boxShadow:'inset 0 0 0 2px #0b2f68', borderRadius:10, cursor:'pointer' }
const bonusCloseBtn: React.CSSProperties = { padding:'8px 12px', borderRadius:8, background:'#244e96', color:'#fff', fontWeight:800, border:'none', boxShadow:'inset 0 0 0 2px #0b2f68', cursor:'pointer' }
const bonusOptions = ['x2', 'x3', '+50%', '+25%', 'Free Spin', 'Shield']

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
                            <div style={arrowWrapRight}>
                                <div style={arrowIconRight}>›</div>
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

const overlayDim: React.CSSProperties = {
    position:'fixed', left:0, right:0, top:0, bottom:0,
    background:'rgba(0,0,0,0.5)',
    display:'grid', alignItems:'center', justifyItems:'center',
    zIndex: 70
}

const newsPopup: React.CSSProperties = {
    width:'92%',
    maxWidth: 480,
    maxHeight:'80vh',
    background:'linear-gradient(135deg, #4a90e2 0%, #357abd 50%, #2a5b9f 100%)',
    borderRadius: 20,
    boxShadow:'inset 0 0 0 4px #8cbcff, 0 16px 48px rgba(0,0,0,0.4)',
    padding: 16,
    overflowY:'auto',
    animation: 'newsSlideUp 300ms cubic-bezier(.2,.8,.2,1)'
}

const newsPopupHeader: React.CSSProperties = {
    display:'grid',
    gridTemplateColumns:'1fr auto',
    alignItems:'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '2px solid rgba(255,255,255,0.25)'
}

const newsPopupTitle: React.CSSProperties = {
    color:'#fff',
    fontWeight:900,
    fontSize: 20,
    letterSpacing: 1,
    fontFamily:'"Russo One", Inter, system-ui',
    textShadow:'0 2px 8px rgba(0,0,0,0.35)'
}

const newsCloseBtn: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border:'none',
    background:'rgba(255,255,255,0.2)',
    color:'#fff',
    fontSize: 18,
    fontWeight:900,
    cursor:'pointer',
    boxShadow:'inset 0 0 0 2px rgba(255,255,255,0.3)',
    transition:'transform 120ms ease'
}

const sheet: React.CSSProperties = {
    position:'absolute',
    left:'50%',
    top:'50%',
    transform:'translate(-50%, -50%)',
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

const newsSheet: React.CSSProperties = {
    position:'absolute', left:'50%', bottom:0, transform:'translateX(-50%)',
    width:'96%', maxWidth: 460, maxHeight:'72vh',
    background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    boxShadow:'inset 0 0 0 3px #0b2f68, 0 -8px 24px rgba(0,0,0,0.35)',
    padding: 12,
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
const menuTitle: React.CSSProperties = { color:'#fff', fontWeight:800, textShadow:'0 1px 0 rgba(0,0,0,0.35)', fontFamily:'"Russo One", Inter, system-ui', letterSpacing:1, textAlign:'center' }
const menuSubtitle: React.CSSProperties = { color:'#dbe8ff', opacity:.85, fontSize:12, fontFamily:'"Rubik", Inter, system-ui', textAlign:'center' }

const menuBadge: React.CSSProperties = { marginLeft:6, padding:'4px 8px', background:'#ff6b57', color:'#fff', borderRadius:10, fontSize:12, fontWeight:800, boxShadow:'inset 0 0 0 2px #7a1d12' }

const arrowWrapRight: React.CSSProperties = {
    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
    display:'grid', placeItems:'center', pointerEvents:'none'
}
const arrowIconRight: React.CSSProperties = { color:'#bfe0ff', fontSize:22, lineHeight:1, textShadow:'0 1px 0 rgba(0,0,0,0.35)' }
const comingSoonBanner: React.CSSProperties = { position:'absolute', left:-6, bottom:-7, width:48, pointerEvents:'none', zIndex:2 }
const inviteInput: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:8, border:'none', background:'#cbe6ff', boxShadow:'inset 0 0 0 3px #0b2f68', color:'#083068', fontWeight:800 }
const inviteBtn: React.CSSProperties = { padding:'8px 12px', borderRadius:8, border:'none', background:'#22c55e', color:'#0b2f68', fontWeight:900, boxShadow:'inset 0 0 0 3px #0a5d2b', cursor:'pointer' }
const inviteSecondaryBtn: React.CSSProperties = { padding:'8px 12px', borderRadius:8, border:'none', background:'#244e96', color:'#fff', fontWeight:800, boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer' }

const menuItemsLeft: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode, action?: 'invite' | 'daily' | 'shop' | 'stars' }> = [
    { title: 'Подключай свой кошелек TON', action: 'stars', icon: <PressIcon src="/press1.png" alt="press1" fallbackEmoji="🙂" /> },
    { title: 'Приглашай друзей и поднимай свой уровень в игре', action: 'invite', icon: <PressIcon src="/press2.png" alt="press2" fallbackEmoji="🙂" /> },
    { title: 'Заходи каждый день и получай дополнительные бонусы', action: 'daily', icon: <PressIcon src="/press3.png" alt="press3" fallbackEmoji="🙂" /> },
    { title: 'Отслеживай свой рейтинг', badgeImg:'/coming1.png', icon: <PressIcon src="/press4.png" alt="press4" fallbackEmoji="🙂" /> },
    { title: 'Мои покупки и бонусы в игре', action: 'shop', icon: <PressIcon src="/press5.png" alt="press5" fallbackEmoji="🙂" /> },
    { title: 'Официальная группа в Telegram', badgeImg:'/coming1.png', icon: <PressIcon src="/press6.png" alt="press6" fallbackEmoji="🙂" /> },
]

const menuItemsRight: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode, action?: 'wheelshop' | 'tasks' | 'news' }> = [
    { title: 'WHEEL SHOP', subtitle: 'прокачай удачу', action: 'wheelshop', icon: <PressIcon src="/press7.png" alt="press7" fallbackEmoji="🙂" /> },
    { title: 'WHEEL конвертер', subtitle: 'покупка и обмен игровой волюты', badgeImg:'/coming1.png', icon: <PressIcon src="/press8.png" alt="press8" fallbackEmoji="🙂" /> },
    { title: 'Получай WCOIN', subtitle: 'выполняя задания', action: 'tasks', icon: <PressIcon src="/press9.png" alt="press9" fallbackEmoji="🙂" /> },
    { title: 'Повысил уровень?', subtitle: 'Забирай бонусы!', badgeImg:'/coming1.png', icon: <PressIcon src="/press10.png" alt="press10" fallbackEmoji="🙂" /> },
    { title: 'WCOIN новости', subtitle: 'будь в курсе всех событий', action: 'news', icon: <PressIcon src="/press11.png" alt="press11" fallbackEmoji="🙂" /> },
]





