import React from 'react'
import { FortuneWheel } from './wheel/FortuneWheel'
import { ImageWheel } from './wheel/ImageWheel'

// CSS анимации для всплывающих окон
const animationStyle = document.createElement('style')
animationStyle.textContent = `
@keyframes newsSlideUp {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(50px) scale(0.92);
  }
  60% {
    opacity: 1;
    transform: translateX(-50%) translateY(-5px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}
@keyframes newsOverlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUpFromBottom {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) translateY(100px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0) scale(1);
  }
}
@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes bottomSheetUp {
  0% { transform: translateX(-50%) translateY(100%); }
  100% { transform: translateX(-50%) translateY(0); }
}
@keyframes bottomSheetDown {
  0% { transform: translateX(-50%) translateY(0); }
  100% { transform: translateX(-50%) translateY(100%); }
}
`
if (!document.head.querySelector('#animation-styles')) {
    animationStyle.id = 'animation-styles'
    document.head.appendChild(animationStyle)
}

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
    const [inviteAnimatingOut, setInviteAnimatingOut] = React.useState<boolean>(false)
    const [inviteHeightVh, setInviteHeightVh] = React.useState<number>(80)
    const inviteDragStartY = React.useRef<number | null>(null)
    const inviteDragStartTs = React.useRef<number>(0)
    const inviteDragStartHeightVh = React.useRef<number>(64)
    const inviteLastY = React.useRef<number>(0)
    const inviteLastTs = React.useRef<number>(0)

    // Stars bottom-sheet state
    const [starsAnimatingOut, setStarsAnimatingOut] = React.useState<boolean>(false)
    const [starsHeightVh, setStarsHeightVh] = React.useState<number>(80)
    const starsDragStartY = React.useRef<number | null>(null)
    const starsDragStartTs = React.useRef<number>(0)
    const starsDragStartHeightVh = React.useRef<number>(64)
    const starsLastY = React.useRef<number>(0)
    const starsLastTs = React.useRef<number>(0)

    // Daily bottom-sheet state
    const [dailyAnimatingOut, setDailyAnimatingOut] = React.useState<boolean>(false)
    const [dailyHeightVh, setDailyHeightVh] = React.useState<number>(80)
    const dailyDragStartY = React.useRef<number | null>(null)
    const dailyDragStartTs = React.useRef<number>(0)
    const dailyDragStartHeightVh = React.useRef<number>(64)
    const dailyLastY = React.useRef<number>(0)
    const dailyLastTs = React.useRef<number>(0)

    // Shop bottom-sheet state
    const [shopAnimatingOut, setShopAnimatingOut] = React.useState<boolean>(false)
    const [shopHeightVh, setShopHeightVh] = React.useState<number>(80)
    const shopDragStartY = React.useRef<number | null>(null)
    const shopDragStartTs = React.useRef<number>(0)
    const shopDragStartHeightVh = React.useRef<number>(64)
    const shopLastY = React.useRef<number>(0)
    const shopLastTs = React.useRef<number>(0)

    // WheelShop bottom-sheet state (right menu)
    const [wheelAnimatingOut, setWheelAnimatingOut] = React.useState<boolean>(false)
    const [wheelSheetHeightVh, setWheelSheetHeightVh] = React.useState<number>(80)
    const wheelDragStartY = React.useRef<number | null>(null)
    const wheelDragStartTs = React.useRef<number>(0)
    const wheelDragStartHeightVh = React.useRef<number>(64)
    const wheelLastY = React.useRef<number>(0)
    const wheelLastTs = React.useRef<number>(0)

    // Tasks bottom-sheet state (right menu)
    const [tasksAnimatingOut, setTasksAnimatingOut] = React.useState<boolean>(false)
    const [tasksSheetHeightVh, setTasksSheetHeightVh] = React.useState<number>(80)
    const tasksDragStartY = React.useRef<number | null>(null)
    const tasksDragStartTs = React.useRef<number>(0)
    const tasksDragStartHeightVh = React.useRef<number>(64)
    const tasksLastY = React.useRef<number>(0)
    const tasksLastTs = React.useRef<number>(0)

    function triggerHaptic(kind: 'impact' | 'success' = 'impact'){
        try {
            const tg = (window as any).Telegram?.WebApp
            if (!tg?.HapticFeedback) return
            if (kind === 'impact') tg.HapticFeedback.impactOccurred('light')
            else tg.HapticFeedback.notificationOccurred('success')
        } catch {}
    }

    // TON Connect UI integration
    const tonUIRef = React.useRef<any>(null)
    const [tonScriptReady, setTonScriptReady] = React.useState<boolean>(false)
    const [tonReady, setTonReady] = React.useState<boolean>(false)
    React.useEffect(() => {
        // lazy load script with CDN fallback
        const existing = (window as any).TON_CONNECT_UI
        if (existing) { setTonReady(true); return }
        function load(src: string, onOk: () => void, onErr: () => void){
            const s = document.createElement('script')
            s.src = src
            s.async = true
            s.crossOrigin = 'anonymous'
            s.referrerPolicy = 'no-referrer'
            s.onload = onOk
            s.onerror = onErr
            document.head.appendChild(s)
        }
        load('https://cdn.jsdelivr.net/npm/@tonconnect/ui@2.0.7/dist/tonconnect-ui.min.js', () => { setTonScriptReady(true); setTonReady(true) }, () => {
            load('https://unpkg.com/@tonconnect/ui@2.0.7/dist/tonconnect-ui.min.js', () => { setTonScriptReady(true); setTonReady(true) }, () => setTonReady(false))
        })
        return () => {}
    }, [])
    async function openTonConnect() {
        try {
            // ensure UI instance
            const g: any = (window as any).TON_CONNECT_UI
            if (!g || !tonReady) { setToast('Загрузка TON Connect...'); setTimeout(openTonConnect, 600); return }
            if (!tonUIRef.current) {
                const base = window.location.origin
                tonUIRef.current = new g.TonConnectUI({ manifestUrl: `${base}/tonconnect-manifest.json`, uiPreferences: { theme: 'SYSTEM' } })
            }
            // explicit mount target to avoid WebView overlay issues
            const container = document.body
            await tonUIRef.current.openModal({ restoreConnection: true, container })
        } catch {
            setToast('Не удалось открыть TON Connect')
        }
    }
    const [dailyOpen, setDailyOpen] = React.useState<boolean>(false)
    const [shopOpen, setShopOpen] = React.useState<boolean>(false)
    const [wheelShopOpen, setWheelShopOpen] = React.useState<boolean>(false)
    const [starsOpen, setStarsOpen] = React.useState<boolean>(false)
    const [tasksOpen, setTasksOpen] = React.useState<boolean>(false)
    const [newsOpen, setNewsOpen] = React.useState<boolean>(false)
    // Friends/invites
    type FriendEntry = { id: number, name: string, photo?: string, rewardW: number }
    const [friends, setFriends] = React.useState<FriendEntry[]>([])
    // (reverted) responsive sizing for right menu cards
    const BONUS_LABELS: string[] = ['x2','x3','+50%','+25%']
    const BONUS_IMAGES: string[] = ['/battery.png', '/heardwh.png', '/moneywheel.png', '/spacewh.png']
    const SECTOR_TO_BONUS: number[] = [0,1,2,3,0,1,2,3,0,1]
    const getSectorBonusIndex = (i: number): number => {
        const idx = ((i % 10) + 10) % 10
        const val = SECTOR_TO_BONUS[idx]
        return (typeof val === 'number' ? val : 0)
    }
    const [selectedBonusSector, setSelectedBonusSector] = React.useState<number | null>(null)
    const [selectedBonusBucket, setSelectedBonusBucket] = React.useState<number | null>(null)
    const MID_RATE_PER_SEC = 0.01
    const MID_INTERVAL_MS = 1_000
    const MID_STOP_AFTER_MS = 3 * 60 * 60 * 1000
    const [midW, setMidW] = React.useState<number>(() => parseFloat(localStorage.getItem('mid_w') || '0') || 0)
    const [midAnim, setMidAnim] = React.useState<boolean>(false)
    const [settingsOpen, setSettingsOpen] = React.useState<boolean>(false)
    const [lang, setLang] = React.useState<'ru'|'en'>(() => (localStorage.getItem('lang') as 'ru'|'en') || 'ru')
    const STR: Record<'ru'|'en', Record<string, string>> = {
        ru: {
            settings: 'Настройки',
            sound: 'Звук',
            vibration: 'Вибрация',
            privacy: 'Политика конфиденциальности',
            close: 'Закрыть',
            invite_title: 'Пригласите друзей',
            invite_subtitle: 'Вы и ваш друг получите бонусы',
            invite_cta: '+5 000 для вас и вашего друга',
            friends_list: 'Список ваших друзей:',
            empty: 'Пока пусто',
            updated: 'Обновлено',
            copied: 'Ссылка скопирована',
            daily_title: 'Ежедневная награда',
            daily_descr: 'Забирай монеты за ежедневный вход в игру без пропусков. Кнопку «Забрать» нужно нажимать ежедневно, иначе счётчик дней сбросится и нужно будет начинать всё заново.',
            day: 'День',
            shop_title: 'Покупки и бонусы',
            news_title: '📰 WCOIN новости',
            choose_bonus: 'Выбор бонусов',
            topup_stars: 'Пополнить за ⭐',
            not_enough_W: 'Недостаточно W',
            not_enough_B: 'Недостаточно B',
            ton_loading: 'Загрузка TON Connect...',
            ton_error: 'Не удалось открыть TON Connect',
            pay_link_unavailable: 'Платёжная ссылка недоступна',
            pay_open_error: 'Ошибка открытия оплаты',
            pick_number: 'Выбери число 0–9',
            number_ok_refund: 'Цифра угадана! Ставка возвращена',
            bonus_gained: 'Бонус получен!',
            collected_w: '+{amount} W собрано',
            get: 'Забрать',
            language: 'Язык',
            ru: 'Русский',
            en: 'English',
            mode_x3_of10: 'x3 из 10',
            press1_title: 'Подключай свой кошелек TON',
            press2_title: 'Приглашай друзей и поднимай свой уровень в игре',
            press3_title: 'Заходи каждый день и получай дополнительные бонусы',
            press4_title: 'Отслеживай свой рейтинг',
            press5_title: 'Мои покупки и бонусы в игре',
            press6_title: 'Официальная группа в Telegram',
            press7_title: 'WHEEL SHOP',
            press7_sub: 'прокачай удачу',
            press8_title: 'WHEEL конвертер',
            press8_sub: 'покупка и обмен игровой волюты',
            press9_title: 'Получай WCOIN',
            press9_sub: 'выполняя задания',
            press10_title: 'Повысил уровень?',
            press10_sub: 'Забирай бонусы!',
            press11_title: 'WCOIN новости',
            press11_sub: 'будь в курсе всех событий',
        },
        en: {
            settings: 'Settings',
            sound: 'Sound',
            vibration: 'Vibration',
            privacy: 'Privacy Policy',
            close: 'Close',
            invite_title: 'Invite friends',
            invite_subtitle: 'You and your friend will get bonuses',
            invite_cta: '+5,000 for you and your friend',
            friends_list: 'Your friends:',
            empty: 'Empty for now',
            updated: 'Updated',
            copied: 'Link copied',
            daily_title: 'Daily reward',
            daily_descr: 'Claim coins every day without skipping. You must press “Claim” daily, otherwise the streak resets and you start again.',
            day: 'Day',
            shop_title: 'Purchases and bonuses',
            news_title: '📰 WCOIN news',
            choose_bonus: 'Choose bonuses',
            topup_stars: 'Top up with ⭐',
            not_enough_W: 'Not enough W',
            not_enough_B: 'Not enough B',
            ton_loading: 'Loading TON Connect...',
            ton_error: 'Failed to open TON Connect',
            pay_link_unavailable: 'Payment link unavailable',
            pay_open_error: 'Failed to open payment',
            pick_number: 'Pick a number 0–9',
            number_ok_refund: 'Number correct! Bet returned',
            bonus_gained: 'Bonus received!',
            collected_w: '+{amount} W collected',
            get: 'Claim',
            language: 'Language',
            ru: 'Russian',
            en: 'English',
            mode_x3_of10: 'x3 of 10',
            press1_title: 'Connect your TON wallet',
            press2_title: 'Invite friends and level up',
            press3_title: 'Log in daily and get extra bonuses',
            press4_title: 'Track your rating',
            press5_title: 'My purchases and bonuses',
            press6_title: 'Official Telegram group',
            press7_title: 'WHEEL SHOP',
            press7_sub: 'boost your luck',
            press8_title: 'WHEEL converter',
            press8_sub: 'buy & exchange game currency',
            press9_title: 'Earn WCOIN',
            press9_sub: 'by completing tasks',
            press10_title: 'Leveled up?',
            press10_sub: 'Claim bonuses!',
            press11_title: 'WCOIN news',
            press11_sub: 'stay tuned',
        }
    }
    function t(key: string, vars?: Record<string, string | number>) {
        const raw = (STR[lang] && STR[lang][key]) || key
        if (!vars) return raw
        return Object.keys(vars).reduce(
            (s, k) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]!)),
            raw
        )
    }

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
            setToast(t('pay_link_unavailable'))
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
            setToast(t('pay_open_error'))
        }
    }

    function getLimits(m: GameMode, _cur: 'W'|'B') {
        // x2 / x3 из 10: от 100; x5: от 1000. Верхняя граница 100_000
        const max = 100_000
        const min = m === 'allin' ? 1000 : 100
        return { min, max }
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
        if (pickedDigit == null) { setToast(t('pick_number')); return false }
        const { min, max } = getLimits(mode, currency)
        const b = Math.max(min, Math.min(max, Math.floor(bet)))
        if (b !== bet) setBet(b)
        if (currency === 'W') {
            if (balanceW < b) { setToast(t('not_enough_W')); return false }
            saveBalances(balanceW - b, balanceB)
        } else {
            if (balanceB < b) { setToast(t('not_enough_B')); return false }
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
            setToast(t('number_ok_refund'))
            return
        }

        // Если неверная цифра, но бонус верный — выдаём бонус (инвентарь)
        if (!numCorrect && bonusCorrect) {
            try {
                const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                const inv: string[] = JSON.parse(invRaw)
                const idxSafe = Math.max(0, Math.min(BONUS_LABELS.length - 1, Number(sectorBonusIdx) || 0))
                const bonusName = BONUS_LABELS[idxSafe] || `Бонус ${idxSafe}`
                inv.push(bonusName)
                localStorage.setItem('bonuses_inv', JSON.stringify(inv))
            } catch {}
            setToast(t('bonus_gained'))
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
                // Load friends for current user (if any)
                try {
                    const raw = localStorage.getItem(`friends_${u.id}`) || '[]'
                    setFriends(JSON.parse(raw))
                } catch { setFriends([]) }
            }
            // Process referral start param (ref_XXXX)
            const startParam = tg?.initDataUnsafe?.start_param || new URLSearchParams(window.location.search).get('tgWebAppStartParam')
            const curId: number | null = tg?.initDataUnsafe?.user?.id ? Number(tg.initDataUnsafe.user.id) : null
            if (startParam && String(startParam).startsWith('ref_') && curId) {
                const inviterId = Number(String(startParam).slice(4))
                if (inviterId && inviterId !== curId) {
                    const invitee: FriendEntry = { id: curId, name: (u?.username || uname) || 'Unknown account', photo: u?.photo_url, rewardW: 5000 }
                    const inviterKey = `friends_${inviterId}`
                    try {
                        const raw = localStorage.getItem(inviterKey) || '[]'
                        const list: FriendEntry[] = JSON.parse(raw)
                        if (!list.some(x => x.id === invitee.id)) {
                            list.push(invitee)
                            localStorage.setItem(inviterKey, JSON.stringify(list))
                        }
                    } catch {}
                    // Also add inviter to current user's list for symmetric display
                    try {
                        const invName = 'Unknown account'
                        const curKey = `friends_${curId}`
                        const raw2 = localStorage.getItem(curKey) || '[]'
                        const list2: FriendEntry[] = JSON.parse(raw2)
                        if (!list2.some(x => x.id === inviterId)) {
                            list2.push({ id: inviterId, name: invName, rewardW: 5000 })
                            localStorage.setItem(curKey, JSON.stringify(list2))
                            setFriends(list2)
                        }
                    } catch {}
                }
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
                {/* Прозрачная кнопка для теста (добавляет 1000 W) */}
                <div 
                    style={{
                        position:'absolute',
                        top:0,
                        right:0,
                        width:60,
                        height:60,
                        cursor:'pointer',
                        opacity:0
                    }}
                    onClick={() => {
                        saveBalances(balanceW + 1000, balanceB)
                        setToast('+1000 W (тест)')
                    }}
                />
            </div>
            <div style={content}>
                {(!isMenuOpen && !isRightMenuOpen) ? (
                    <>
                        <div style={{...panelsWrap, pointerEvents: spinning ? 'none' : 'auto', opacity: spinning ? .6 : 1}}>
                            {/* Row 1: режим игры (с фоном панели) */}
                            <PanelShell>
                                <div style={rowGrid}>
                                    <Arrow onClick={() => setMode(prev => prev==='normal'?'allin': prev==='pyramid'?'normal':'pyramid')} dir="left" />
                                    <div style={controlBoxText}>{mode==='normal' ? 'x2' : mode==='pyramid' ? (lang==='ru' ? 'x3 из 10' : 'x3 of 10') : 'x5'}</div>
                                    <Arrow onClick={() => setMode(prev => prev==='normal'?'pyramid': prev==='pyramid'?'allin':'normal')} dir="right" />
                                </div>
                                <div
                                    onClick={()=> setSettingsOpen(true)}
                                    style={{ position:'absolute', right:-52, top:'50%', transform:'translateY(-50%)', width:44, height:44, display:'grid', placeItems:'center', cursor:'pointer' }}
                                >
                                    <img src="/satting.png" alt="settings" style={{width:'36px',height:'36px',objectFit:'contain', filter:'drop-shadow(0 4px 6px rgba(0,0,0,0.25))'}} />
                                </div>
                            </PanelShell>
                            {/* Row 2: валюта */}
                            <PanelShell>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                                    <div style={{...currencyCell, background: currency==='W' ? '#ffffff' : 'linear-gradient(180deg, #9cc9ff 0%, #7db6ff 100%)'}} onClick={() => setCurrency('W')}>
                                        <div style={{fontWeight:900, fontSize:18, color:'#2b66b9'}}>W</div>
                                    </div>
                                    <div style={{...currencyCell, background: currency==='B' ? '#ffffff' : 'linear-gradient(180deg, #9cc9ff 0%, #7db6ff 100%)'}} onClick={() => setCurrency('B')}>
                                        <div style={{fontWeight:900, fontSize:18, color:'#2b66b9'}}>B</div>
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
                                        const next = cur - 100
                                        return Math.max(baseMin, next)
                                    })} kind="minus" />
                                    <div style={controlBoxText}>{bet}</div>
                                    <RoundBtn onClick={() => setBet(b => {
                                        const {max} = getLimits(mode, currency)
                                        const baseMin = Math.max(100, getLimits(mode, currency).min)
                                        const cur = Math.max(baseMin, Math.floor(b || baseMin))
                                        const next = cur + 100
                                        return Math.min(max, next)
                                    })} kind="plus" />
                                </div>
                            </PanelShell>

                            {/* Mid W ticker */}
                            <div style={midCounterShell}>
                            <div style={midCounterInner}>
                                    <div 
                                        style={{position:'relative', width:48, height:48, display:'grid', placeItems:'center', cursor:'pointer'}}
                                        onClick={() => {
                                            if (midW > 0) {
                                                const toAdd = Math.floor(midW)
                                                saveBalances(balanceW + toAdd, balanceB)
                                                setMidW(0)
                                                try {
                                                    localStorage.setItem('mid_w', '0')
                                                    localStorage.setItem('mid_w_last_ts', String(Date.now()))
                                                } catch {}
                                                setToast(`+${toAdd} W собрано`)
                                            }
                                        }}
                                    >
                                        <img src="/coin-w.png" alt="W" style={{width:44,height:44, transform: midAnim? 'scale(1.15)': 'scale(1)', transition:'transform 240ms ease'}} />
                                        {midAnim && <div style={midPlusOne}>+1</div>}
                                    </div>
                                    <div style={midValue}>{midW.toFixed(2)}</div>
                                    
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
                                 onSelectBonusSector={(idx: number) => { setSelectedBonusSector(idx); setSelectedBonusBucket(getSectorBonusIndex(idx)) }} />
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
                    <div style={isMenuOpen ? menuList : menuListRight}>
                        {(isMenuOpen ? menuItemsLeft : menuItemsRight).map((item, idx) => (
                                <div
                                    key={`${isMenuOpen ? 'L' : 'R'}:${idx}`}
                                    style={{...(isMenuOpen ? menuCard : menuCardRight), transform: pressedCardIdx===idx ? 'translateY(2px) scale(0.98)' : 'none'}}
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
                                        if (act === 'ton') { openTonConnect(); return }
                                    } else {
                                        if (act === 'wheelshop') setWheelShopOpen(true)
                                        if (act === 'tasks') setTasksOpen(true)
                                        if (act === 'news') setNewsOpen(true)
                                    }
                                }}
                                >
                                    {item.badgeImg && <img src={item.badgeImg} alt="coming soon" style={comingSoonBanner} />}
                                    <div style={isMenuOpen ? menuIconWrap : menuIconWrapRight}>{item.icon}</div>
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
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setStarsOpen(false) }}>
                    <div style={{...inviteSheet, height:`${starsHeightVh}vh`, animation:'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ starsDragStartY.current = e.clientY; starsDragStartTs.current=Date.now(); starsDragStartHeightVh.current = starsHeightVh; starsLastY.current=e.clientY; starsLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (starsDragStartY.current==null) return; const dy = starsDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, starsDragStartHeightVh.current + dy/(window.innerHeight/100))); setStarsHeightVh(vh); starsLastY.current=e.clientY; starsLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (starsDragStartY.current==null) return; const totalDy = starsDragStartY.current - (starsLastY.current || starsDragStartY.current); const dt = Math.max(1, Date.now() - (starsDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setStarsOpen(false) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-starsHeightVh)<Math.abs(a-starsHeightVh)?b:a,snaps[0]); setStarsHeightVh(next); triggerHaptic('impact') } starsDragStartY.current=null }}
                            onPointerCancel={()=>{ starsDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <div style={inviteSheetHeader}>
                            <button style={sheetCloseArrow} onClick={()=>{ triggerHaptic('impact'); setStarsOpen(false) }}>‹</button>
                            <div style={menuHeaderTitle}>{t('topup_stars')}</div>
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
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setInviteAnimatingOut(true); setTimeout(()=>{ setInviteOpen(false); setInviteAnimatingOut(false) }, 280) }}>
                    <div style={{...inviteSheet, height: `${inviteHeightVh}vh`, animation: inviteAnimatingOut ? 'bottomSheetDown 280ms ease forwards' : 'bottomSheetUp 320ms ease-out forwards' }} onClick={(e) => e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e) => {
                                inviteDragStartY.current = e.clientY
                                inviteDragStartTs.current = Date.now()
                                inviteDragStartHeightVh.current = inviteHeightVh
                                inviteLastY.current = e.clientY
                                inviteLastTs.current = Date.now()
                            }}
                            onPointerMove={(e) => {
                                if (inviteDragStartY.current == null) return
                                const dy = inviteDragStartY.current - e.clientY // вверх = положительно
                                const vh = Math.max(40, Math.min(90, inviteDragStartHeightVh.current + dy / (window.innerHeight / 100)))
                                setInviteHeightVh(vh)
                                inviteLastY.current = e.clientY
                                inviteLastTs.current = Date.now()
                            }}
                            onPointerUp={() => {
                                if (inviteDragStartY.current == null) return
                                const totalDy = inviteDragStartY.current - (inviteLastY.current || inviteDragStartY.current)
                                const dt = Math.max(1, Date.now() - (inviteDragStartTs.current || Date.now()))
                                const velocity = (totalDy / dt) // px per ms (вверх положительно)
                                // быстрый свайп вниз -> закрыть
                                if (velocity < -0.8) { // порог скорости
                                    triggerHaptic('impact')
                                    setInviteAnimatingOut(true)
                                    setTimeout(()=>{ setInviteOpen(false); setInviteAnimatingOut(false) }, 250)
                                } else {
                                    // снап к ближайшей точке
                                    const snaps = [40, 60, 80, 90]
                                    const next = snaps.reduce((a,b)=> Math.abs(b - inviteHeightVh) < Math.abs(a - inviteHeightVh) ? b : a, snaps[0])
                                    setInviteHeightVh(next)
                                    triggerHaptic('impact')
                                }
                                inviteDragStartY.current = null
                            }}
                            onPointerCancel={() => { inviteDragStartY.current = null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <div style={inviteSheetHeader}>
                            <button style={sheetCloseArrow} onClick={() => { setInviteAnimatingOut(true); setTimeout(()=>{ setInviteOpen(false); setInviteAnimatingOut(false) }, 280) }}>‹</button>
                            <div style={{width:36}} />
                            <div style={{width:36}} />
                        </div>
                        {(() => {
                            const tg = (window as any).Telegram?.WebApp
                            const bot = (import.meta as any)?.env?.VITE_TG_BOT || 'TestCodeTg_bot'
                            const uid = tg?.initDataUnsafe?.user?.id
                            const payload = uid ? `ref_${uid}` : 'invite'
                            const url = `https://t.me/${bot}?startapp=${encodeURIComponent(payload)}`
                            const handleShare = () => {
                                    const text = lang==='ru' ? 'Присоединяйся в игру!' : 'Join the game!'
                                try {
                                    if (tg?.openTelegramLink) {
                                        const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
                                        tg.openTelegramLink(share)
                                        return
                                    }
                                } catch {}
                                if ((navigator as any)?.share) { (navigator as any).share({ title:'WHEEL', text, url }).catch(()=>{}); return }
                                        navigator.clipboard?.writeText(url).then(()=> setToast(t('copied')))
                            }
                            return (
                                <div style={{display:'grid', gap:14}}>
                                    <div style={{display:'grid', placeItems:'center'}}>
                                        <img src="/press2.png" alt="invite" style={{...inviteHeroImg, width:140, height:140}} />
                                    </div>
                            <div style={inviteTitleLarge}>{t('invite_title')}</div>
                                    <div style={{display:'grid', placeItems:'center'}}>
                                        <div style={inviteSubtitlePill}>{t('invite_subtitle')}</div>
                                    </div>
                                    <button style={inviteCtaPill} onClick={handleShare}>
                                        <img src="/coin-w.png" alt="coin" style={{width:26,height:26, filter:'drop-shadow(0 4px 6px rgba(0,0,0,0.25))'}} />
                                        <span style={{marginLeft:10}}>{t('invite_cta')}</span>
                                    </button>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center'}}>
                                        <div style={friendsHeaderLbl}>{t('friends_list')}</div>
                                        <button style={friendsRefreshBtn} onClick={()=> setToast(t('updated'))}>↻</button>
                                    </div>
                                    <div style={{display:'grid', gap:12}}>
                                        {friends.length === 0 ? (
                                            <div style={{color:'#e8f1ff', textAlign:'center', opacity:.85}}>{t('empty')}</div>
                                        ) : friends.map((f)=> (
                                            <div key={`fr-${f.id}`} style={friendRow}>
                                                <div style={friendAvatar}>
                                                    {f.photo ? <img src={f.photo} alt="avatar" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : <div style={{width:'100%',height:'100%',borderRadius:'50%',background:'#ffdc8b',boxShadow:'inset 0 0 0 3px #7a4e06'}} />}
                                                </div>
                                                <div style={friendName}>{f.name || 'Unknown account'}</div>
                                                <div style={friendAmount}><img src="/coin-w.png" alt="c" style={{width:22,height:22,marginRight:6}}/> {(f.rewardW/1000).toFixed(1)}K</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                </div>
            )}
            {shopOpen && (
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setShopAnimatingOut(true); setTimeout(()=>{ setShopOpen(false); setShopAnimatingOut(false) }, 320) }}>
                    <div style={{...inviteSheet, height:`${shopHeightVh}vh`, animation: shopAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ shopDragStartY.current = e.clientY; shopDragStartTs.current=Date.now(); shopDragStartHeightVh.current = shopHeightVh; shopLastY.current=e.clientY; shopLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (shopDragStartY.current==null) return; const dy = shopDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, shopDragStartHeightVh.current + dy/(window.innerHeight/100))); setShopHeightVh(vh); shopLastY.current=e.clientY; shopLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (shopDragStartY.current==null) return; const totalDy = shopDragStartY.current - (shopLastY.current || shopDragStartY.current); const dt = Math.max(1, Date.now() - (shopDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setShopAnimatingOut(true); setTimeout(()=>{ setShopOpen(false); setShopAnimatingOut(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-shopHeightVh)<Math.abs(a-shopHeightVh)?b:a,snaps[0]); setShopHeightVh(next); triggerHaptic('impact') } shopDragStartY.current=null }}
                            onPointerCancel={()=>{ shopDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <div style={inviteSheetHeader}>
                            <button style={sheetCloseArrow} onClick={()=>{ triggerHaptic('impact'); setShopAnimatingOut(true); setTimeout(()=>{ setShopOpen(false); setShopAnimatingOut(false) }, 300) }}>‹</button>
                            <div style={{width:36}} />
                            <div style={{width:36}} />
                        </div>
                        <ShopPanel
                            onClose={() => { setShopAnimatingOut(true); setTimeout(()=>{ setShopOpen(false); setShopAnimatingOut(false) }, 300) }}
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
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setWheelAnimatingOut(true); setTimeout(()=>{ setWheelShopOpen(false); setWheelAnimatingOut(false) }, 320) }}>
                    <div style={{...inviteSheet, height:`${wheelSheetHeightVh}vh`, animation: wheelAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ wheelDragStartY.current = e.clientY; wheelDragStartTs.current=Date.now(); wheelDragStartHeightVh.current = wheelSheetHeightVh; wheelLastY.current=e.clientY; wheelLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (wheelDragStartY.current==null) return; const dy = wheelDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, wheelDragStartHeightVh.current + dy/(window.innerHeight/100))); setWheelSheetHeightVh(vh); wheelLastY.current=e.clientY; wheelLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (wheelDragStartY.current==null) return; const totalDy = wheelDragStartY.current - (wheelLastY.current || wheelDragStartY.current); const dt = Math.max(1, Date.now() - (wheelDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setWheelAnimatingOut(true); setTimeout(()=>{ setWheelShopOpen(false); setWheelAnimatingOut(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-wheelSheetHeightVh)<Math.abs(a-wheelSheetHeightVh)?b:a,snaps[0]); setWheelSheetHeightVh(next); triggerHaptic('impact') } wheelDragStartY.current=null }}
                            onPointerCancel={()=>{ wheelDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <div style={inviteSheetHeader}>
                            <button style={sheetCloseArrow} onClick={()=>{ triggerHaptic('impact'); setWheelAnimatingOut(true); setTimeout(()=>{ setWheelShopOpen(false); setWheelAnimatingOut(false) }, 300) }}>‹</button>
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
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setTasksAnimatingOut(true); setTimeout(()=>{ setTasksOpen(false); setTasksAnimatingOut(false) }, 320) }}>
                    <div style={{...inviteSheet, height:`${tasksSheetHeightVh}vh`, animation: tasksAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ tasksDragStartY.current = e.clientY; tasksDragStartTs.current=Date.now(); tasksDragStartHeightVh.current = tasksSheetHeightVh; tasksLastY.current=e.clientY; tasksLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (tasksDragStartY.current==null) return; const dy = tasksDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, tasksDragStartHeightVh.current + dy/(window.innerHeight/100))); setTasksSheetHeightVh(vh); tasksLastY.current=e.clientY; tasksLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (tasksDragStartY.current==null) return; const totalDy = tasksDragStartY.current - (tasksLastY.current || tasksDragStartY.current); const dt = Math.max(1, Date.now() - (tasksDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setTasksAnimatingOut(true); setTimeout(()=>{ setTasksOpen(false); setTasksAnimatingOut(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-tasksSheetHeightVh)<Math.abs(a-tasksSheetHeightVh)?b:a,snaps[0]); setTasksSheetHeightVh(next); triggerHaptic('impact') } tasksDragStartY.current=null }}
                            onPointerCancel={()=>{ tasksDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <div style={inviteSheetHeader}>
                            <button style={sheetCloseArrow} onClick={()=>{ triggerHaptic('impact'); setTasksAnimatingOut(true); setTimeout(()=>{ setTasksOpen(false); setTasksAnimatingOut(false) }, 300) }}>‹</button>
                            <div style={menuHeaderTitle}>Задания</div>
                            <div style={{width:36}} />
                        </div>
                        <TasksPanel onClose={() => { setTasksAnimatingOut(true); setTimeout(()=>{ setTasksOpen(false); setTasksAnimatingOut(false) }, 300) }} onShare5={() => {
                            try {
                                const tg = (window as any).Telegram?.WebApp
                                const url = window.location.href
                                const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Присоединяйся в игру!')}`
                                if (tg?.openTelegramLink) tg.openTelegramLink(share)
                                else window.open(share, '_blank')
                            } catch {}
                        }} onReward={(rw)=>{
                            const w = Number(localStorage.getItem('balance_w')||'0') + (rw.W||0)
                            const b = Number(localStorage.getItem('balance_b')||'0') + (rw.B||0)
                            saveBalances(w, b)
                            if (rw.W) setToast(`+${rw.W} W`) 
                            if (rw.B) setToast(`+${rw.B} B`)
                        }} />
                    </div>
                </div>
            )}
            {newsOpen && (
                <div style={overlayDim} onClick={() => setNewsOpen(false)}>
                    <div style={newsPopup} onClick={(e)=>e.stopPropagation()}>
                        <div style={newsPopupHeader}>
                            <div style={newsPopupTitle}>{t('news_title')}</div>
                            <button style={newsCloseBtn} onClick={() => setNewsOpen(false)}>✕</button>
                        </div>
                        <NewsPanel onClose={() => setNewsOpen(false)} isAdmin={userId === 1408757717} />
                    </div>
                </div>
            )}
            {settingsOpen && (
                <div style={overlayDim} onClick={()=> setSettingsOpen(false)}>
                    <div style={newsPopup} onClick={(e)=>e.stopPropagation()}>
                        <div style={newsPopupHeader}>
                            <div style={newsPopupTitle}>{t('settings')}</div>
                            <button style={newsCloseBtn} onClick={()=> setSettingsOpen(false)}>✕</button>
                        </div>
                        <div style={{display:'grid', gap:10}}>
                            <label style={{display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', color:'#fff', fontWeight:800}}>
                                {t('sound')}
                                <input type="checkbox" defaultChecked={localStorage.getItem('opt_sound') !== '0'} onChange={(e)=>{ try { localStorage.setItem('opt_sound', e.target.checked ? '1':'0') } catch {} }} />
                            </label>
                            <label style={{display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', color:'#fff', fontWeight:800}}>
                                {t('vibration')}
                                <input type="checkbox" defaultChecked={localStorage.getItem('opt_vibro') !== '0'} onChange={(e)=>{ try { localStorage.setItem('opt_vibro', e.target.checked ? '1':'0') } catch {} }} />
                            </label>
                            <div style={{display:'grid', gridTemplateColumns:'1fr auto auto', alignItems:'center', gap:10, color:'#fff', fontWeight:800}}>
                                <div>{t('language')}</div>
                                <button onClick={()=>{ setLang('ru'); try{ localStorage.setItem('lang','ru') } catch{} }} style={{ padding:'6px 10px', borderRadius:8, border:'none', background: lang==='ru' ? '#ffd23a' : '#244e96', color: lang==='ru' ? '#0b2f68' : '#fff', fontWeight:900, boxShadow:'inset 0 0 0 2px #0b2f68', cursor:'pointer' }}>{t('ru')}</button>
                                <button onClick={()=>{ setLang('en'); try{ localStorage.setItem('lang','en') } catch{} }} style={{ padding:'6px 10px', borderRadius:8, border:'none', background: lang==='en' ? '#ffd23a' : '#244e96', color: lang==='en' ? '#0b2f68' : '#fff', fontWeight:900, boxShadow:'inset 0 0 0 2px #0b2f68', cursor:'pointer' }}>{t('en')}</button>
                            </div>
                            <div style={{height:10}} />
                            <button style={{ padding:'8px 12px', borderRadius:8, border:'none', background:'#244e96', color:'#fff', fontWeight:800, boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer' }} onClick={()=> window.open('https://t.me/TestCodeTg_bot', '_blank')}>{t('privacy')}</button>
                        </div>
                    </div>
                </div>
            )}
            {dailyOpen && (
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setDailyAnimatingOut(true); setTimeout(()=>{ setDailyOpen(false); setDailyAnimatingOut(false) }, 320) }}>
                    <div style={{...inviteSheet, height:`${dailyHeightVh}vh`, animation: dailyAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ dailyDragStartY.current = e.clientY; dailyDragStartTs.current=Date.now(); dailyDragStartHeightVh.current = dailyHeightVh; dailyLastY.current=e.clientY; dailyLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (dailyDragStartY.current==null) return; const dy = dailyDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, dailyDragStartHeightVh.current + dy/(window.innerHeight/100))); setDailyHeightVh(vh); dailyLastY.current=e.clientY; dailyLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (dailyDragStartY.current==null) return; const totalDy = dailyDragStartY.current - (dailyLastY.current || dailyDragStartY.current); const dt = Math.max(1, Date.now() - (dailyDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setDailyAnimatingOut(true); setTimeout(()=>{ setDailyOpen(false); setDailyAnimatingOut(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-dailyHeightVh)<Math.abs(a-dailyHeightVh)?b:a,snaps[0]); setDailyHeightVh(next); triggerHaptic('impact') } dailyDragStartY.current=null }}
                            onPointerCancel={()=>{ dailyDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <DailyBonus
                            onClose={() => { setDailyAnimatingOut(true); setTimeout(()=>{ setDailyOpen(false); setDailyAnimatingOut(false) }, 300) }}
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
    // 7-дневная цепочка, сбрасывается при пропуске дня
    const rewards = [250, 500, 1000, 2500, 5000, 7500, 10000]
    const todayStr = () => new Date().toDateString()
    const yestStr = () => { const d = new Date(); d.setDate(d.getDate()-1); return d.toDateString() }

    const [state, setState] = React.useState(() => {
        try {
            const last = localStorage.getItem('daily_last') || ''
            const streak = Math.max(0, Math.min(7, Number(localStorage.getItem('daily_streak') || '0') || 0))
            const claimedToday = last === todayStr()
            let current = 1
            if (claimedToday) current = Math.min(7, streak) // уже получили сегодня
            else if (last === yestStr()) current = Math.min(7, streak + 1) // продолжаем
            else current = 1 // пропуск — начинаем заново
            return { last, streak, claimedToday, current }
        } catch { return { last:'', streak:0, claimedToday:false, current:1 } }
    })

    function save(last: string, streak: number){
        try { localStorage.setItem('daily_last', last); localStorage.setItem('daily_streak', String(streak)) } catch {}
    }

    function handleClaim(day: number){
        if (state.claimedToday) return
        if (day !== state.current) return
        const amount = rewards[day-1] || 0
        onClaim(amount)
        const nextStreak = Math.min(7, (state.last === yestStr() ? state.streak + 1 : 1))
        save(todayStr(), nextStreak)
        setState({ last: todayStr(), streak: nextStreak, claimedToday: true, current: nextStreak })
    }

    // Styles под дизайн
    const wrap: React.CSSProperties = { background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)', borderRadius:20, padding:16, boxShadow:'inset 0 0 0 3px #0b2f68' }
    const title: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1.2, textShadow:'0 2px 0 rgba(0,0,0,0.35)', marginTop:8 }
    const descr: React.CSSProperties = { color:'#e8f1ff', textAlign:'center', fontWeight:800, lineHeight:1.35, textShadow:'0 2px 0 rgba(0,0,0,0.35)', margin:'8px 0 14px' }
    const grid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }
    const cardBase: React.CSSProperties = { background:'linear-gradient(135deg,#6ad14b 0%, #2a67b7 100%)', borderRadius:22, boxShadow:'0 10px 24px rgba(0,0,0,0.25), inset 0 0 0 3px rgba(11,47,104,0.9)', padding:'12px 10px', display:'grid', placeItems:'center', cursor:'pointer' }
    const dayLbl: React.CSSProperties = { color:'#e8f1ff', fontWeight:900, textShadow:'0 1px 0 rgba(0,0,0,0.35)', marginBottom:6 }
    const amountLbl: React.CSSProperties = { color:'#fff', fontWeight:900, textShadow:'0 1px 0 rgba(0,0,0,0.35)' }
    const day7: React.CSSProperties = { ...cardBase, gridColumn:'1 / -1', borderRadius:36, padding:'16px 12px' }

    const renderCard = (day: number) => {
        const claimed = state.claimedToday && day <= state.current || (!state.claimedToday && day < state.current)
        const isCurrent = !state.claimedToday && day === state.current
        const style = { ...(day===7 ? day7 : cardBase), boxShadow: isCurrent ? '0 0 0 3px #ffd23a, 0 10px 24px rgba(0,0,0,0.25)' : (cardBase.boxShadow as any), opacity: claimed && !isCurrent ? .85 : 1 }
        return (
            <div key={day} style={style as React.CSSProperties} onClick={() => handleClaim(day)}>
                <div style={dayLbl}>{`День ${day}`}</div>
                <div style={{display:'grid', placeItems:'center', marginBottom:6}}>
                    <img src="/coin-w.png" alt="coin" style={{width:32,height:32,filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.25))'}} />
                </div>
                <div style={amountLbl}>{day<7 ? (day===3? '1к': day===4? '2,5к' : day===5? '5к' : day===6? '7,5к' : String(rewards[day-1])) : '10к'}</div>
            </div>
        )
    }

    return (
        <div style={wrap}>
            <div style={{display:'grid', placeItems:'center'}}>
                <img src="/press3.png" alt="daily" style={{width:140, height:140, objectFit:'contain', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'}} />
            </div>
            <div style={title}>{t('daily_title')}</div>
            <div style={descr}>{t('daily_descr')}</div>
            <div style={grid}>
                {[1,2,3,4,5,6].map(renderCard)}
                {renderCard(7)}
            </div>
            <div style={{display:'grid', placeItems:'center', marginTop:12}}>
                <button style={inviteSecondaryBtn} onClick={onClose}>Закрыть</button>
            </div>
        </div>
    )
}

function TasksPanel({ onClose, onShare5, onReward }: { onClose: () => void, onShare5: () => void, onReward: (rw: {W?:number,B?:number}) => void }){
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
        onReward(reward)
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
    const [list, setList] = React.useState<Array<{title:string, text:string, images:string[], ts:number}>>([])
    React.useEffect(() => {
        fetch('/api/news').then(r=>r.json()).then(d=>{
            if (Array.isArray(d?.items)) setList(d.items)
        }).catch(()=>{})
    }, [])
    async function addNews(){
        if (!isAdmin) return
        try{
            const tg = (window as any).Telegram?.WebApp
            const adminId = tg?.initDataUnsafe?.user?.id
            const res = await fetch('/api/news', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ adminId, title, text, images }) })
            if (res.ok) {
                setTitle(''); setText(''); setImages([])
                const d = await fetch('/api/news').then(r=>r.json()).catch(()=>null)
                if (Array.isArray(d?.items)) setList(d.items)
            }
        } catch {}
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
    // визуальный инвентарь в стиле макета
    const wrap: React.CSSProperties = { background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)', borderRadius:20, padding:16, boxShadow:'inset 0 0 0 3px #0b2f68', display:'grid', gap:14 }
    const title: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1.2, textShadow:'0 2px 0 rgba(0,0,0,0.35)' }
    const descrPill: React.CSSProperties = { color:'#0b2f68', background:'#ffffff', borderRadius:12, padding:'6px 10px', textAlign:'center', fontWeight:900, lineHeight:1.35, boxShadow:'0 3px 0 rgba(0,0,0,0.25)', margin:'0 auto', width:'95%' }
    const grid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }
    const cellBase: React.CSSProperties = { background:'linear-gradient(180deg,#6bb3ff,#2b66b9)', borderRadius:26, boxShadow:'inset 0 0 0 3px #0b2f68', height:110, display:'grid', placeItems:'center' }
    const iconImg: React.CSSProperties = { width:64, height:64, objectFit:'contain', filter:'drop-shadow(0 8px 12px rgba(0,0,0,0.35))' }
    const plusWrap: React.CSSProperties = { ...cellBase, background:'linear-gradient(180deg,#4b90d6,#2b66b9)', position:'relative' }
    const plusInner: React.CSSProperties = { width:48, height:48, borderRadius:12, display:'grid', placeItems:'center', background:'radial-gradient(circle, #9aff6b, #63d723)', boxShadow:'0 0 18px rgba(99,215,35,0.9), inset 0 0 0 3px #0a5d2b', color:'#0b2f68', fontWeight:900, fontSize:28 }

    return (
        <div style={wrap}>
            <div style={{display:'grid', placeItems:'center'}}>
                <img src="/press5.png" alt="bag" style={{width:120,height:120,objectFit:'contain',filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'}} />
            </div>
            <div style={title}>Покупки и бонусы</div>
            <div style={descrPill}>Данный раздел — это твой рюкзак. Тут хранятся все твои покупки и бонусы, полученные в игре.</div>
            <div style={grid}>
                <div style={cellBase}><img src="/heardwh.png" alt="heart" style={iconImg} /></div>
                <div style={cellBase}><img src="/spacewh.png" alt="rocket" style={iconImg} /></div>
                <div style={plusWrap}><div style={plusInner}>+</div></div>
                {Array.from({length:9}).map((_,i)=> (<div key={`p-${i}`} style={plusWrap}><div style={plusInner}>+</div></div>))}
            </div>
            <div style={{display:'grid', placeItems:'center'}}>
                <button style={inviteSecondaryBtn} onClick={onClose}>Закрыть</button>
            </div>
        </div>
    )
}

const root: React.CSSProperties = {
    minHeight: '100dvh',
    // Возврат к прежнему фону приложения
    background: 'linear-gradient(180deg, #68b1ff 0%, #3f7ddb 60%, #2e63bf 100%)',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
}

const topBar: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }
const leftUser: React.CSSProperties = { display:'flex', alignItems:'center', gap:10 }

const avatar: React.CSSProperties = { width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '3px solid #2a5b9f', boxShadow:'0 2px 0 #0b2f68', display:'grid', placeItems:'center', overflow:'hidden' }
const avatarImg: React.CSSProperties = { width:'100%', height:'100%', objectFit:'cover' }
const usernameStyle: React.CSSProperties = { color:'#083068', fontWeight: 800, fontSize:18, textShadow:'0 1px 0 rgba(255,255,255,0.6)', fontFamily:'"Rubik", Inter, system-ui' }
const levelStyle: React.CSSProperties = { color:'#e8f1ff', fontWeight:800, fontSize:14, lineHeight:1.1, textShadow:'0 1px 0 rgba(0,0,0,0.25)' }
const avatarText: React.CSSProperties = { display:'grid', placeItems:'center', width:'100%', height:'100%', fontWeight:900, color:'#0b2f68' }
const balances: React.CSSProperties = { display:'grid', gap:8 }
const balanceRow: React.CSSProperties = { display:'flex', alignItems:'center', padding:'6px 10px', background: 'linear-gradient(90deg,#2a5b9f,#184b97)', borderRadius: 12, color:'#fff', boxShadow:'inset 0 0 0 2px #8cbcff' }
const coinImg: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }

const content: React.CSSProperties = { margin: '8px 10px', borderRadius: 12, boxShadow:'inset 0 0 0 3px #8cbcff', background:'rgba(0,0,0,0.05)', position:'relative' }
const wheelWrap: React.CSSProperties = { position:'absolute', bottom: 44, left: '50%', transform:'translateX(-50%) scale(1.16)' }
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
const midCounterInner: React.CSSProperties = { justifySelf:'center', display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', gap:8, background:'transparent', padding:0, borderRadius:0, boxShadow:'none', width:'88%' }
const midValue: React.CSSProperties = { color:'#fff', fontWeight:900, minWidth:36, textAlign:'center', textShadow:'0 1px 0 rgba(0,0,0,0.35)', fontFamily:'"Russo One", Inter, system-ui', fontSize:48, lineHeight:1 }
const midPlusOne: React.CSSProperties = { position:'absolute', bottom:24, color:'#22c55e', fontWeight:900, animation:'midpop 900ms ease forwards', textShadow:'0 1px 0 rgba(0,0,0,0.35)' }

function PanelShell({ children }: { children: React.ReactNode }){
    return (
        <div style={{
            background: 'linear-gradient(180deg, #2b6fbe 0%, #1f57a0 100%)',
            borderRadius: 10,
            padding: 6,
            boxShadow: 'inset 0 0 0 3px #0b2f68, 0 2px 0 rgba(0,0,0,0.25)',
            width:'82%', margin:'0 auto', position:'relative'
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
    background:'linear-gradient(180deg, #183a78 0%, #163368 100%)',
    transition:'opacity 220ms ease',
    display:'grid', alignItems:'stretch',
    zIndex: 50,
    animation: 'overlayFadeIn 300ms ease-out'
}

const overlayDim: React.CSSProperties = {
    position:'fixed', left:0, right:0, top:0, bottom:0,
    background:'rgba(0,0,0,0.66)',
    display:'grid', alignItems:'center', justifyItems:'center',
    zIndex: 70,
    animation: 'newsOverlayFadeIn 400ms ease-out'
}

const overlayDimModal: React.CSSProperties = {
    position:'fixed', left:0, right:0, top:0, bottom:0,
    background:'rgba(0,0,0,0.75)',
    display:'grid', alignItems:'end', justifyItems:'center',
    zIndex: 80,
    animation: 'overlayFadeIn 300ms ease-out'
}

const modalSheet: React.CSSProperties = {
    width:'92%',
    maxWidth: 420,
    maxHeight:'70vh',
    background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
    borderRadius: 16,
    boxShadow:'inset 0 0 0 3px #0b2f68, 0 8px 24px rgba(0,0,0,0.35)',
    padding: 12,
    overflowY:'auto' as const,
    animation: 'slideUpFromBottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
}

const inviteSheet: React.CSSProperties = {
    position:'absolute', left:'50%', bottom:0, transform:'translateX(-50%)',
    width:'96%', maxWidth: 460, maxHeight:'85vh',
    background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    boxShadow:'inset 0 0 0 3px #0b2f68, 0 -8px 24px rgba(0,0,0,0.35) ',
    padding: 12,
    overflowY:'auto' as const
}

const inviteSheetHeader: React.CSSProperties = { display:'grid', gridTemplateColumns:'36px 1fr 36px', alignItems:'center', marginBottom:10 }
const sheetCloseArrow: React.CSSProperties = { width:36, height:36, borderRadius:10, border:'none', background:'#1e4b95', color:'#bfe0ff', fontSize:22, fontWeight:800, boxShadow:'inset 0 0 0 2px #0b2f68', cursor:'pointer' }
const inviteGrabWrap: React.CSSProperties = { display:'grid', placeItems:'center', paddingTop:6, paddingBottom:2, cursor:'pointer' }
const inviteGrabBar: React.CSSProperties = { width:48, height:6, borderRadius:3, background:'rgba(255,255,255,0.8)', boxShadow:'0 1px 0 rgba(0,0,0,0.2), inset 0 0 0 2px rgba(11,47,104,0.6)' }
const settingsFloatBtn: React.CSSProperties = { position:'fixed' } // not used anymore
// Invite redesign styles
const inviteHeroImg: React.CSSProperties = { width:160, height:160, objectFit:'contain', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))' }
const inviteTitleLarge: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, fontSize:24, letterSpacing:1.2, textShadow:'0 2px 0 rgba(0,0,0,0.35)' }
const inviteSubtitlePill: React.CSSProperties = { padding:'6px 10px', background:'#ffffff', borderRadius:10, display:'inline-block', boxShadow:'0 3px 0 rgba(0,0,0,0.2)', color:'#0b2f68', fontWeight:900 }
const inviteCtaPill: React.CSSProperties = { display:'grid', gridAutoFlow:'column', alignItems:'center', justifyContent:'center', gap:6, padding:'14px 16px', background:'linear-gradient(180deg,#5aa2ff,#2b66b9)', color:'#fff', border:'none', borderRadius:26, fontWeight:900, boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer' }
const friendsHeaderLbl: React.CSSProperties = { color:'#fff', fontWeight:900, textShadow:'0 2px 0 rgba(0,0,0,0.35)' }
const friendsRefreshBtn: React.CSSProperties = { width:32, height:32, borderRadius:10, border:'none', background:'#1e4b95', color:'#bfe0ff', fontSize:18, fontWeight:900, boxShadow:'inset 0 0 0 2px #0b2f68', cursor:'pointer' }
const friendRow: React.CSSProperties = { display:'grid', gridTemplateColumns:'56px 1fr auto', alignItems:'center', gap:12, padding:'12px 14px', background:'linear-gradient(180deg,#6bb3ff,#2b66b9)', borderRadius:26, boxShadow:'inset 0 0 0 3px #0b2f68' }
const friendAvatar: React.CSSProperties = { width:56, height:56, borderRadius:'50%', display:'grid', placeItems:'center', background:'#fff', boxShadow:'inset 0 0 0 3px #0b2f68' }
const friendName: React.CSSProperties = { color:'#fff', fontWeight:900, letterSpacing:1, textShadow:'0 1px 0 rgba(0,0,0,0.35)' }
const friendAmount: React.CSSProperties = { color:'#fff', fontWeight:900, textShadow:'0 1px 0 rgba(0,0,0,0.35)', display:'grid', gridAutoFlow:'column', alignItems:'center' }

const newsPopup: React.CSSProperties = {
    width:'92%',
    maxWidth: 480,
    maxHeight:'80vh',
    background:'linear-gradient(135deg, #4a90e2 0%, #357abd 50%, #2a5b9f 100%)',
    borderRadius: 20,
    boxShadow:'inset 0 0 0 4px #8cbcff, 0 16px 48px rgba(0,0,0,0.4)',
    padding: 16,
    overflowY:'auto',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'newsSlideUp 500ms cubic-bezier(.34,.97,.63,.99)'
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
    transition:'transform 120ms ease, background 120ms ease'
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
    overflowY:'auto',
    animation: 'slideUpFromBottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
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

const menuList: React.CSSProperties = { display:'grid', gap:8, height:'100%', alignContent:'stretch' }

const menuCard: React.CSSProperties = {
    display:'grid',
    gridTemplateColumns:'38px 1fr',
    alignItems:'center',
    gap:7,
    padding:'10px 8px',
    minHeight:53,
    background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
    borderRadius:14,
    boxShadow:'inset 0 0 0 3px #0b2f68, 0 2px 0 rgba(0,0,0,0.25)',
    position:'relative',
    overflow:'visible',
    transition:'transform 120ms ease'
}

const menuIconWrap: React.CSSProperties = { width:34, height:34, display:'grid', placeItems:'center' }
const menuIconImg: React.CSSProperties = { width:'100%', height:'100%', objectFit:'contain' }

// Right menu styles (increased by 20% for 5->6 card effect)
const menuListRight: React.CSSProperties = { display:'grid', gap:10, height:'100%', alignContent:'stretch' }

const menuCardRight: React.CSSProperties = {
    display:'grid',
    gridTemplateColumns:'46px 1fr',
    alignItems:'center',
    gap:8,
    padding:'12px 10px',
    minHeight:64,
    background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
    borderRadius:14,
    boxShadow:'inset 0 0 0 3px #0b2f68, 0 2px 0 rgba(0,0,0,0.25)',
    position:'relative',
    overflow:'visible',
    transition:'transform 120ms ease'
}

const menuIconWrapRight: React.CSSProperties = { width:46, height:46, display:'grid', placeItems:'center' }

const menuTextWrap: React.CSSProperties = { display:'grid', gap:4 }
const menuTitle: React.CSSProperties = { color:'#fff', fontWeight:800, textShadow:'0 1px 0 rgba(0,0,0,0.35)', fontFamily:'"Russo One", Inter, system-ui', letterSpacing:0.8, textAlign:'center', fontSize:14 }
const menuSubtitle: React.CSSProperties = { color:'#dbe8ff', opacity:.85, fontSize:11, fontFamily:'"Rubik", Inter, system-ui', textAlign:'center' }

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

const menuItemsLeft: Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode, action?: 'invite' | 'daily' | 'shop' | 'ton' }> = [
    { title: 'Подключай свой кошелек TON', action: 'ton', icon: <PressIcon src="/press1.png" alt="press1" fallbackEmoji="🙂" /> },
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





