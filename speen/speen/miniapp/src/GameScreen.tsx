import React from 'react'
import { FortuneWheel } from './wheel/FortuneWheel'
import { ImageWheel, ImageWheelRef } from './wheel/ImageWheel'

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
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
@keyframes neonFlicker {
  0% { opacity: 0; text-shadow: none; }
  10% { opacity: 1; text-shadow: 0 0 4px rgba(0,255,200,0.6), 0 0 12px rgba(0,255,200,0.4); }
  20% { opacity: 0.3; text-shadow: 0 0 2px rgba(0,255,200,0.3); }
  30% { opacity: 1; text-shadow: 0 0 6px rgba(0,255,200,0.7), 0 0 16px rgba(0,255,200,0.5); }
  40% { opacity: 0.5; text-shadow: 0 0 3px rgba(0,255,200,0.4); }
  50% { opacity: 1; text-shadow: 0 0 8px rgba(0,255,200,0.8), 0 0 20px rgba(0,255,200,0.6); }
  60% { opacity: 0.4; text-shadow: 0 0 3px rgba(0,255,200,0.3); }
  70% { opacity: 1; text-shadow: 0 0 10px rgba(0,255,200,0.85), 0 0 26px rgba(0,255,200,0.7); }
  85% { opacity: 0.9; text-shadow: 0 0 12px rgba(0,255,200,0.9), 0 0 32px rgba(0,255,200,0.75); }
  100% { opacity: 1; text-shadow: 0 0 14px rgba(0,255,200,1), 0 0 36px rgba(0,255,200,0.85); }
}
@keyframes neonPulse {
  0% { text-shadow: 0 0 10px rgba(0,255,200,0.7), 0 0 28px rgba(0,255,200,0.5); }
  50% { text-shadow: 0 0 18px rgba(0,255,200,1), 0 0 44px rgba(0,255,200,0.85); }
  100% { text-shadow: 0 0 10px rgba(0,255,200,0.7), 0 0 28px rgba(0,255,200,0.5); }
}
`
if (!document.head.querySelector('#animation-styles')) {
    animationStyle.id = 'animation-styles'
    document.head.appendChild(animationStyle)
}

function Preloader() {
    return (
        <div style={preloaderWrap}>
            <div style={preloaderContent}>
                <div style={preloaderSpinner}></div>
                <div style={preloaderText}>Загрузка...</div>
                <div style={neonWrap}>
                    <div style={neonText}>С НАСТУПАЮЩИМ</div>
                    <div style={neonText}>НОВЫМ ГОДОМ!</div>
                </div>
            </div>
        </div>
    )
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
    type LevelStats = {
        spinsTotal: number
        spinsX2: number
        spinsX5: number
        spins3of10: number
        spinsW: number
        spinsB: number
        // mode+currency breakdown
        spinsX2B: number
        spinsX5B: number
        spins3of10B: number
        // streaks (for "подряд")
        streakX2: number
        streakX5: number
        // wins
        winsX2: number
        winsX5: number
        wins3of10: number
        winsX2B: number
        winsX5B: number
        wins3of10B: number
        // task types
        dailyClaims: number
        tasksClaimed: number
        bonusTasksClaimed: number
        tasksClaimedB: number
        daily7Cycles: number
        invites: number
        boostersBought: Record<string, number>
        boostersUsed: Record<string, number>
        spinsBetAtLeast10000B: number
        spinsX5WithBooster: number
        exchangedBtoW_times: number
        exchangedBtoW_totalW: number
        exchangedWtoB_times: number
        purchasedBTotal: number
        // onboarding + milestones
        onboardingDone: number
        series3of10Completed: number
    }

    const LEVEL_KEY = 'player_level_v1'
    const STATS_KEY = 'level_stats_v1'
    const BONUS_WHEEL_UNLOCK_LEVEL = 5 // Бонусный барабан открывается на 5 уровне
    const API_BASE = (((import.meta as any)?.env?.VITE_API_BASE || 'https://speen-server.onrender.com') as string).trim()

    const [playerLevel, setPlayerLevel] = React.useState<number>(() => {
        const v = Number(localStorage.getItem(LEVEL_KEY) || '0')
        return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
    })
    const playerLevelRef = React.useRef<number>(playerLevel)
    React.useEffect(() => { playerLevelRef.current = playerLevel }, [playerLevel])

    // Rewards are claimed separately from level-up (player gets the level immediately, then claims reward in Levels)
    const CLAIMED_LEVEL_KEY = 'player_level_claimed_v1'
    const [claimedLevel, setClaimedLevel] = React.useState<number>(() => {
        const v = Number(localStorage.getItem(CLAIMED_LEVEL_KEY) || '0')
        return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
    })
    React.useEffect(() => {
        // never allow "claimed" to exceed current level
        if (claimedLevel > playerLevel) {
            const v = playerLevel
            setClaimedLevel(v)
            try { localStorage.setItem(CLAIMED_LEVEL_KEY, String(v)) } catch {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerLevel])

    const [levelStats, setLevelStats] = React.useState<LevelStats>(() => {
        try {
            const raw = localStorage.getItem(STATS_KEY)
            const d = raw ? JSON.parse(raw) : null
            if (d && typeof d === 'object') {
                return {
                    spinsTotal: Number(d.spinsTotal || 0),
                    spinsX2: Number(d.spinsX2 || 0),
                    spinsX5: Number(d.spinsX5 || 0),
                    spins3of10: Number(d.spins3of10 || 0),
                    spinsW: Number(d.spinsW || 0),
                    spinsB: Number(d.spinsB || 0),
                    spinsX2B: Number(d.spinsX2B || 0),
                    spinsX5B: Number(d.spinsX5B || 0),
                    spins3of10B: Number(d.spins3of10B || 0),
                    streakX2: Number(d.streakX2 || 0),
                    streakX5: Number(d.streakX5 || 0),
                    winsX2: Number(d.winsX2 || 0),
                    winsX5: Number(d.winsX5 || 0),
                    wins3of10: Number(d.wins3of10 || 0),
                    winsX2B: Number(d.winsX2B || 0),
                    winsX5B: Number(d.winsX5B || 0),
                    wins3of10B: Number(d.wins3of10B || 0),
                    dailyClaims: Number(d.dailyClaims || 0),
                    tasksClaimed: Number(d.tasksClaimed || 0),
                    bonusTasksClaimed: Number(d.bonusTasksClaimed || 0),
                    tasksClaimedB: Number(d.tasksClaimedB || 0),
                    daily7Cycles: Number(d.daily7Cycles || 0),
                    invites: Number(d.invites || 0),
                    boostersBought: (d.boostersBought && typeof d.boostersBought === 'object') ? d.boostersBought : {},
                    boostersUsed: (d.boostersUsed && typeof d.boostersUsed === 'object') ? d.boostersUsed : {},
                    spinsBetAtLeast10000B: Number(d.spinsBetAtLeast10000B || 0),
                    spinsX5WithBooster: Number(d.spinsX5WithBooster || 0),
                    exchangedBtoW_times: Number(d.exchangedBtoW_times || 0),
                    exchangedBtoW_totalW: Number(d.exchangedBtoW_totalW || 0),
                    exchangedWtoB_times: Number(d.exchangedWtoB_times || 0),
                    purchasedBTotal: Number(d.purchasedBTotal || 0),
                    onboardingDone: Number(d.onboardingDone || 0),
                    series3of10Completed: Number(d.series3of10Completed || 0),
                }
            }
        } catch {}
        return {
            spinsTotal: 0,
            spinsX2: 0,
            spinsX5: 0,
            spins3of10: 0,
            spinsW: 0,
            spinsB: 0,
            spinsX2B: 0,
            spinsX5B: 0,
            spins3of10B: 0,
            streakX2: 0,
            streakX5: 0,
            winsX2: 0,
            winsX5: 0,
            wins3of10: 0,
            winsX2B: 0,
            winsX5B: 0,
            wins3of10B: 0,
            dailyClaims: 0,
            tasksClaimed: 0,
            bonusTasksClaimed: 0,
            tasksClaimedB: 0,
            daily7Cycles: 0,
            invites: 0,
            boostersBought: {},
            boostersUsed: {},
            spinsBetAtLeast10000B: 0,
            spinsX5WithBooster: 0,
            exchangedBtoW_times: 0,
            exchangedBtoW_totalW: 0,
            exchangedWtoB_times: 0,
            purchasedBTotal: 0,
            onboardingDone: 0,
            series3of10Completed: 0,
        }
    })

    const levelStatsRef = React.useRef<LevelStats>(levelStats)
    React.useEffect(() => { levelStatsRef.current = levelStats }, [levelStats])

    const progressLoadedRef = React.useRef<boolean>(false)
    const progressSyncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    function setStatsFromRemote(nextStats: any) {
        try {
            const safe = (nextStats && typeof nextStats === 'object') ? nextStats : {}
            // merge by max so server/clients don't lose progress
            setLevelStats(prev => {
                const out: any = { ...prev }
                for (const k of Object.keys(safe)) {
                    const bv = (safe as any)[k]
                    const av = (out as any)[k]
                    if (typeof bv === 'number') (out as any)[k] = Math.max(typeof av === 'number' ? av : 0, bv)
                    else if (bv && typeof bv === 'object' && !Array.isArray(bv)) {
                        const base = (av && typeof av === 'object' && !Array.isArray(av)) ? av : {}
                        ;(out as any)[k] = { ...base, ...bv }
                    } else if (typeof bv === 'boolean') (out as any)[k] = !!av || bv
                    else if (bv != null) (out as any)[k] = bv
                }
                try { localStorage.setItem(STATS_KEY, JSON.stringify(out)) } catch {}
                return out
            })
        } catch {}
    }

    async function loadProgressFromServer(uid: number) {
        try {
            const res = await fetch(`${API_BASE}/api/progress/${uid}`)
            if (!res.ok) return
            const data = await res.json()
            if (!data?.ok) return
            const lvl = typeof data.game_level === 'number' ? data.game_level : 0
            persistLevel(lvl)
            setStatsFromRemote(data.level_stats || {})
            // onboarding sync
            if (data.onboarding_done) {
                try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
                setOnboardingOpen(false)
                // keep milestone inside stats too (for level requirements)
                setStatsFromRemote({ onboardingDone: 1 })
            }
            progressLoadedRef.current = true
        } catch {}
    }

    function scheduleProgressSync() {
        const uid = progressUserIdRef.current
        if (!uid) return
        if (progressSyncTimerRef.current) clearTimeout(progressSyncTimerRef.current)
        progressSyncTimerRef.current = setTimeout(async () => {
            try {
                const onboardingDone = (() => { try { return localStorage.getItem(ONBOARDING_KEY) === '1' } catch { return false } })()
                await fetch(`${API_BASE}/api/progress/upsert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: uid,
                        game_level: playerLevelRef.current,
                        level_stats: levelStatsRef.current,
                        onboarding_done: onboardingDone,
                    })
                })
            } catch {}
        }, 1200)
    }

    function persistLevel(next: number) {
        const v = Math.max(0, Math.min(50, Math.floor(next)))
        localStorage.setItem(LEVEL_KEY, String(v))
        try {
            const uid = userIdRef.current
            if (uid) localStorage.setItem(`${LEVEL_KEY}_${uid}`, String(v))
        } catch {}
        setPlayerLevel(v)
        // sync to server (debounced)
        scheduleProgressSync()
    }

    function bumpStats(patch: Partial<LevelStats>) {
        setLevelStats(prev => {
            const next: LevelStats = {
                ...prev,
                ...patch,
                boostersBought: patch.boostersBought ? { ...prev.boostersBought, ...patch.boostersBought } : prev.boostersBought,
                boostersUsed: patch.boostersUsed ? { ...prev.boostersUsed, ...patch.boostersUsed } : prev.boostersUsed,
            }
            try {
                const raw = JSON.stringify(next)
                localStorage.setItem(STATS_KEY, raw)
                const uid = userIdRef.current
                if (uid) localStorage.setItem(`${STATS_KEY}_${uid}`, raw)
            } catch {}
            // sync to server (debounced)
            scheduleProgressSync()
            return next
        })
    }

    type LevelConfig = {
        level: number
        action: string
        how: string
        unlocks: string[]
        rewardW: number
        minInvites?: number
    }

    const [levelsConfig, setLevelsConfig] = React.useState<LevelConfig[]>(() => ([
        { level: 0, action: 'Старт', how: 'Начальный уровень', unlocks: ['Доступ к игре'], rewardW: 0 },
        { level: 1, action: 'Инструктаж / регистрация', how: 'Пройди инструктаж при первом входе.', unlocks: ['Доступ к игре'], rewardW: 10000 },
        { level: 2, action: 'Сделать старт на барабане', how: 'Нажми “Старт” в любом режиме и дождись результата.', unlocks: ['Ежедневный бонус'], rewardW: 1000 },
        { level: 3, action: 'Забрать ежедневный бонус', how: 'Открой “Заходи каждый день” и нажми “Получить”.', unlocks: ['Бонусные задания'], rewardW: 1000 },
        { level: 4, action: 'Выполнить любое бонусное задание', how: 'Открой “Получай WCOIN” и забери награду за любое задание.', unlocks: ['Рефералка'], rewardW: 1000 },
        { level: 5, action: 'Пригласить 1 друга', how: 'Пригласи 1 друга — он должен появиться в списке друзей.', unlocks: ['Открывается накопитель'], rewardW: 1000, minInvites: 1 },
        { level: 6, action: 'Сыграть 1 серию “3 из 10”', how: 'Переключи режим на “3 из 10” и дождись окна с выпавшими цифрами.', unlocks: ['Уровни продолжают расти от активности'], rewardW: 5000 },
    ]))

    React.useEffect(() => {
        // load from public/levels_from_excel.json (generated from Excel)
        fetch('/levels_from_excel.json')
            .then(r => r.ok ? r.json() : null)
            .then((data: any) => {
                const items = Array.isArray(data?.levels) ? data.levels : null
                if (!items) return
                const mapped: LevelConfig[] = items
                    .filter((x: any) => x && typeof x.level === 'number')
                    .map((x: any) => {
                        const action = String(x.action || '').trim()
                        const unlocks = String(x.unlocks || '')
                            .split(/\r?\n/g)
                            .map((s: string) => s.trim())
                            .filter(Boolean)
                        const rewardW = typeof x.rewardW === 'number' ? Math.floor(x.rewardW) : 0
                        const minInvites = (typeof x.referrals === 'number' && Number.isFinite(x.referrals)) ? Math.floor(x.referrals) : undefined
                        return {
                            level: Math.max(0, Math.min(50, Math.floor(x.level))),
                            action,
                            how: `Сделай: ${action}`,
                            unlocks,
                            rewardW,
                            minInvites,
                        }
                    })
                    .sort((a, b) => a.level - b.level)
                if (mapped.length) {
                    const overrides: Record<number, LevelConfig> = {
                        0: { level: 0, action: 'Старт', how: 'Начальный уровень', unlocks: ['Доступ к игре'], rewardW: 0 },
                        1: { level: 1, action: 'Инструктаж / регистрация', how: 'Пройди инструктаж при первом входе.', unlocks: ['Доступ к игре'], rewardW: 10000 },
                        2: { level: 2, action: 'Сделать старт на барабане', how: 'Нажми “Старт” в любом режиме и дождись результата.', unlocks: ['Ежедневный бонус'], rewardW: 1000 },
                        3: { level: 3, action: 'Забрать ежедневный бонус', how: 'Открой “Заходи каждый день” и нажми “Получить”.', unlocks: ['Бонусные задания'], rewardW: 1000 },
                        4: { level: 4, action: 'Выполнить любое бонусное задание', how: 'Открой “Получай WCOIN” и забери награду за любое задание.', unlocks: ['Рефералка'], rewardW: 1000 },
                        5: { level: 5, action: 'Пригласить 1 друга', how: 'Пригласи 1 друга — он должен появиться в списке друзей.', unlocks: ['Открывается накопитель'], rewardW: 1000, minInvites: 1 },
                        6: { level: 6, action: 'Сыграть 1 серию “3 из 10”', how: 'Переключи режим на “3 из 10” и дождись окна с выпавшими цифрами.', unlocks: ['Уровни продолжают расти от активности'], rewardW: 5000 },
                    }
                    const base = mapped.map(l => overrides[l.level] ?? l)
                    for (const k of Object.keys(overrides)) {
                        const lvl = Number(k)
                        if (!base.some(x => x.level === lvl)) base.push(overrides[lvl]!)
                    }
                    base.sort((a, b) => a.level - b.level)
                    setLevelsConfig(base)
                }
            })
            .catch(() => {})
    }, [])

    function isLevelRequirementMet(targetLevel: number): boolean {
        const s = levelStatsRef.current
        const need = levelsConfig.find(x => x.level === targetLevel)
        if (!need) return false

        // invite gate if defined
        if (need.minInvites != null && s.invites < need.minInvites) return false

        // explicit early levels
        if (targetLevel === 0) return true
        if (targetLevel === 1) return (s.onboardingDone || 0) >= 1
        if (targetLevel === 2) return s.spinsTotal >= 1
        if (targetLevel === 3) return s.dailyClaims >= 1
        if (targetLevel === 4) return (s.tasksClaimed >= 1) || (s.bonusTasksClaimed >= 1)
        if (targetLevel === 5) return s.invites >= 1
        // Level 6 should be awarded when the 3/10 results window appears (series completed)
        if (targetLevel === 6) return (s.series3of10Completed || 0) >= 1
        if (targetLevel === 7) return (s.boostersBought['Heart'] || 0) >= 1
        if (targetLevel === 8) return (s.boostersUsed['Heart'] || 0) >= 1
        if (targetLevel === 9) return s.spinsX5 >= 3
        if (targetLevel === 10) return s.invites >= 2

        // ---- Excel-based levels 11..50 ----
        switch (targetLevel) {
            case 11: return (s.boostersBought['Battery'] || 0) >= 1
            case 12: return (s.boostersUsed['Battery'] || 0) >= 1
            case 13: return s.daily7Cycles >= 1
            case 14: return s.tasksClaimedB >= 1
            case 15: return s.spinsX2B >= 10
            case 16: return (s.boostersBought['Rocket'] || 0) >= 1
            case 17: return (s.boostersUsed['Rocket'] || 0) >= 1
            case 18: return s.invites >= 3
            case 19: return s.tasksClaimedB >= 5
            case 20: return s.spinsX5WithBooster >= 1
            case 21: return s.spinsX5B >= 10
            case 22: return s.winsX2 >= 3
            case 23: return (s.boostersUsed['Heart'] || 0) >= 1 && s.spins3of10 >= 1
            case 24: return s.invites >= 4
            case 25: return s.spins3of10B >= 1
            case 26: return s.exchangedBtoW_times >= 1 || s.exchangedBtoW_totalW >= 10000
            case 27: return s.winsX5 >= 3
            case 28: return (s.boostersUsed['Battery'] || 0) >= 1 && s.spins3of10 >= 1
            case 29: return s.daily7Cycles >= 2
            case 30: return s.invites >= 5
            case 31: return s.spinsBetAtLeast10000B >= 1
            case 32: return s.wins3of10 >= 3
            case 33: return (s.boostersUsed['Rocket'] || 0) >= 1 && s.spins3of10 >= 1
            case 34: return s.tasksClaimedB >= 10
            case 35: return s.spins3of10B >= 3
            case 36: return s.exchangedWtoB_times >= 1
            case 37: return s.spinsX2B >= 3
            case 38: return s.invites >= 6
            case 39: return s.tasksClaimedB >= 10
            case 40: return s.exchangedBtoW_times >= 2 || s.exchangedBtoW_totalW >= 20000
            case 41: return s.daily7Cycles >= 3
            case 42: return s.spinsX5B >= 3
            case 43: return s.purchasedBTotal >= 10000
            case 44: return s.invites >= 7
            case 45: return s.spins3of10B >= 3
            case 46: return s.tasksClaimedB >= 15
            case 47: return s.winsX2B >= 3
            case 48: return s.winsX5B >= 3
            case 49: return s.wins3of10B >= 3
            case 50: return s.purchasedBTotal >= 100000
            default:
                // fallback: simple activity
                return s.spinsTotal >= Math.max(10, targetLevel * 5)
        }
    }

    function getLevelProgress(targetLevel: number): { current: number, required: number, text: string } {
        const s = levelStatsRef.current
        const conf = levelsConfig.find(x => x.level === targetLevel)
        if (!conf) return { current: 0, required: 0, text: '' }
        
        if (targetLevel === 0) return { current: 1, required: 1, text: '1/1' }
        if (targetLevel === 1) return { current: (s.onboardingDone || 0), required: 1, text: `${Math.min(1, s.onboardingDone || 0)}/1` }
        if (targetLevel === 2) return { current: s.spinsTotal, required: 1, text: `${s.spinsTotal}/1` }
        if (targetLevel === 3) return { current: s.dailyClaims, required: 1, text: `${s.dailyClaims}/1` }
        if (targetLevel === 4) {
            const c = Math.max(s.tasksClaimed || 0, s.bonusTasksClaimed || 0)
            return { current: c, required: 1, text: `${c}/1` }
        }
        if (targetLevel === 5) return { current: s.invites, required: 1, text: `${s.invites}/1` }
        if (targetLevel === 6) return { current: (s.series3of10Completed || 0), required: 1, text: `${s.series3of10Completed || 0}/1` }
        if (targetLevel === 7) return { current: (s.boostersBought['Heart'] || 0), required: 1, text: `${s.boostersBought['Heart'] || 0}/1` }
        if (targetLevel === 8) return { current: (s.boostersUsed['Heart'] || 0), required: 1, text: `${s.boostersUsed['Heart'] || 0}/1` }
        if (targetLevel === 9) return { current: s.spinsX5, required: 3, text: `${s.spinsX5}/3` }
        if (targetLevel === 10) return { current: s.invites, required: 2, text: `${s.invites}/2` }
        
        // Для уровней 11-50 используем общую логику
        const required = Math.max(10, targetLevel * 5)
        return { current: s.spinsTotal, required, text: `${s.spinsTotal}/${required}` }
    }

    function tryClaimNextLevel(targetLevel?: number) {
        const next = targetLevel || Math.min(50, playerLevel + 1)
        if (next <= playerLevel) return
        if (!isLevelRequirementMet(next)) {
            const need = levelsConfig.find(x => x.level === next)
            if (need?.minInvites != null && levelStatsRef.current.invites < need.minInvites) {
                setToast(`Нужно друзей: ${need.minInvites}. Сейчас: ${levelStatsRef.current.invites}`)
            } else {
                setToast(`Пока не выполнены условия для уровня ${next}`)
            }
            return
        }
        // Level is granted immediately; reward is claimed later in Levels panel.
        persistLevel(next)
        scheduleProgressSync()
        setToast(`Новый уровень: ${next}. Забери награду в “Уровни”`)
        triggerHaptic('success')
    }

    function claimLevelReward(level: number) {
        const lvl = Math.max(0, Math.min(50, Math.floor(level)))
        if (lvl <= 0) return
        if (lvl > playerLevelRef.current) {
            setToast(lang === 'ru' ? 'Сначала достигни этого уровня' : 'Reach this level first')
            return
        }
        if (lvl <= claimedLevel) {
            setToast(lang === 'ru' ? 'Награда уже получена' : 'Reward already claimed')
            return
        }
        if (lvl !== claimedLevel + 1) {
            setToast(lang === 'ru' ? 'Сначала забери предыдущую награду' : 'Claim previous reward first')
            return
        }
        const conf = levelsConfig.find(x => x.level === lvl)
        const reward = conf?.rewardW || 0
        if (reward > 0) {
            saveBalances(balanceW + reward, balanceB, `Claim level reward: lvl=${lvl}, +${reward} W`)
            setToast(lang === 'ru' ? `Награда получена: +${reward} W (уровень ${lvl})` : `Reward claimed: +${reward} W (level ${lvl})`)
        } else {
            setToast(lang === 'ru' ? `Награда уровня ${lvl} получена` : `Level ${lvl} reward claimed`)
        }
        setClaimedLevel(lvl)
        try {
            localStorage.setItem(CLAIMED_LEVEL_KEY, String(lvl))
            const uid = userIdRef.current
            if (uid) localStorage.setItem(`${CLAIMED_LEVEL_KEY}_${uid}`, String(lvl))
        } catch {}
        triggerHaptic('success')
    }

    const [username, setUsername] = React.useState<string>('')
    const [wheelSize, setWheelSize] = React.useState<number>(260)
    const [isLoading, setIsLoading] = React.useState<boolean>(true)
    const contentRef = React.useRef<HTMLDivElement | null>(null)
    const panelsRef = React.useRef<HTMLDivElement | null>(null)
    const wheelRef = React.useRef<ImageWheelRef | null>(null)
    
    // Адаптивный размер колеса с учетом фактического свободного пространства (с небольшим отступом от рамок)
    React.useEffect(() => {
        function updateWheelSize() {
            const contentEl = contentRef.current
            if (!contentEl) return
            const panelsHeight = panelsRef.current?.getBoundingClientRect().height || 0
            const contentRect = contentEl.getBoundingClientRect()
            const padding = 4 // небольшой отступ в пару пикселей от боковых рамок
            const bottomPadding = 2 // меньший отступ снизу от нижней рамки/линии
            // Используем доступную ширину и высоту с небольшим отступом от рамок
            const availableWidth = Math.max(0, contentRect.width - padding * 2)
            const availableHeight = Math.max(0, contentRect.height - panelsHeight - bottomPadding)
            // Берем минимум из ширины и высоты, чтобы колесо вписывалось
            const maxSize = Math.min(availableWidth, availableHeight, 1500)
            setWheelSize(Math.max(250, Math.floor(maxSize)))
        }
        updateWheelSize()
        const observers: ResizeObserver[] = []
        if (typeof ResizeObserver !== 'undefined') {
            if (contentRef.current) {
                const ro = new ResizeObserver(updateWheelSize)
                ro.observe(contentRef.current)
                observers.push(ro)
            }
            if (panelsRef.current) {
                const ro2 = new ResizeObserver(updateWheelSize)
                ro2.observe(panelsRef.current)
                observers.push(ro2)
            }
        }
        window.addEventListener('resize', updateWheelSize)
        window.addEventListener('orientationchange', updateWheelSize)
        return () => {
            observers.forEach(o => o.disconnect())
            window.removeEventListener('resize', updateWheelSize)
            window.removeEventListener('orientationchange', updateWheelSize)
        }
    }, [])
    const [userId, setUserId] = React.useState<number | null>(null)
    const userIdRef = React.useRef<number | null>(userId)
    React.useEffect(() => { userIdRef.current = userId }, [userId])
    const [avatarUrl, setAvatarUrl] = React.useState<string>('')
    const [initials, setInitials] = React.useState<string>('')
    const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false)
    const [isRightMenuOpen, setIsRightMenuOpen] = React.useState<boolean>(false)
    const [toast, setToast] = React.useState<string | null>(null)
    // One-time onboarding / registration tutorial
    const ONBOARDING_KEY = 'onboarding_done_v1'
    const [onboardingOpen, setOnboardingOpen] = React.useState<boolean>(() => {
        try { return localStorage.getItem(ONBOARDING_KEY) !== '1' } catch { return true }
    })
    const [onboardingAnimatingOut, setOnboardingAnimatingOut] = React.useState<boolean>(false)
    // Ensure stats have onboardingDone when onboarding is already completed (for level requirements)
    React.useEffect(() => {
        if (!onboardingOpen && (levelStatsRef.current.onboardingDone || 0) < 1) {
            try { bumpStats({ onboardingDone: 1 }) } catch {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onboardingOpen])
    const progressUserIdRef = React.useRef<number | null>(null)
    const [isGameBlocked, setIsGameBlocked] = React.useState<boolean>(false)
    React.useEffect(() => {
        progressUserIdRef.current = userId
        if (userId) {
            // pull progress for multi-device sync
            loadProgressFromServer(userId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])
    // Генерируем уникальный ID устройства при первом запуске
    const getDeviceId = () => {
        let id = localStorage.getItem('device_id')
        if (!id) {
            id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            localStorage.setItem('device_id', id)
        }
        return id
    }
    const deviceIdRef = React.useRef<string>(getDeviceId())
    // balances and game controls
    const [balanceW, setBalanceW] = React.useState<number>(() => {
        const v = Number(localStorage.getItem('balance_w') || '0')
        if (Number.isFinite(v) && v > 0) return Math.floor(v) // Округляем до целого
        localStorage.setItem('balance_w', String(10000))
        return 10000
    })
    const [balanceB, setBalanceB] = React.useState<number>(() => Math.floor(Number(localStorage.getItem('balance_b') || '0'))) // Округляем до целого
    const balanceWRef = React.useRef<number>(balanceW)
    const balanceBRef = React.useRef<number>(balanceB)
    React.useEffect(() => { balanceWRef.current = balanceW }, [balanceW])
    React.useEffect(() => { balanceBRef.current = balanceB }, [balanceB])

    // Per-user scoping helpers (fix: switching Telegram accounts on same device must not leak state)
    const scopedKey = (base: string, uid: number | null) => (uid ? `${base}_${uid}` : base)

    React.useEffect(() => {
        if (!userId) return
        // Load per-user balances/progress for the current Telegram user.
        // IMPORTANT: do NOT fall back to legacy global keys here (they belong to a different Telegram account on the same device).
        try {
            const wRaw = localStorage.getItem(scopedKey('balance_w', userId))
            const bRaw = localStorage.getItem(scopedKey('balance_b', userId))
            const w = Math.floor(Number(wRaw ?? '0') || 0)
            const b = Math.floor(Number(bRaw ?? '0') || 0)
            const nextW = wRaw != null ? (w > 0 ? w : 10000) : 10000
            const nextB = bRaw != null ? b : 0
            setBalanceW(nextW)
            setBalanceB(nextB)
            balanceWRef.current = nextW
            balanceBRef.current = nextB
            // keep legacy keys in sync for the current session (UI uses them in some places)
            localStorage.setItem('balance_w', String(nextW))
            localStorage.setItem('balance_b', String(nextB))
            // ensure per-user keys exist (so account switch doesn't reuse previous account state)
            localStorage.setItem(scopedKey('balance_w', userId), String(nextW))
            localStorage.setItem(scopedKey('balance_b', userId), String(nextB))
        } catch {}

        // Load per-user progress keys (level/stats/claimed/onboarding) if present
        try {
            const lvlRaw = localStorage.getItem(scopedKey(LEVEL_KEY, userId))
            if (lvlRaw != null) {
                const lvl = Math.max(0, Math.min(50, Math.floor(Number(lvlRaw) || 0)))
                persistLevel(lvl)
            }
        } catch {}
        try {
            const statsRaw = localStorage.getItem(scopedKey(STATS_KEY, userId))
            if (statsRaw) setStatsFromRemote(JSON.parse(statsRaw))
        } catch {}
        try {
            const cRaw = localStorage.getItem(scopedKey(CLAIMED_LEVEL_KEY, userId))
            if (cRaw != null) {
                const c = Math.max(0, Math.floor(Number(cRaw) || 0))
                setClaimedLevel(c)
                localStorage.setItem(CLAIMED_LEVEL_KEY, String(c))
            }
        } catch {}
        try {
            const ob = localStorage.getItem(scopedKey(ONBOARDING_KEY, userId))
            if (ob === '1') setOnboardingOpen(false)
        } catch {}
        try {
            const invRaw = localStorage.getItem(scopedKey('bonuses_inv', userId))
            localStorage.setItem('bonuses_inv', invRaw != null ? invRaw : '[]')
            if (invRaw == null) localStorage.setItem(scopedKey('bonuses_inv', userId), '[]')
        } catch {}
        try {
            const purchasesRaw = localStorage.getItem(scopedKey('purchases', userId))
            localStorage.setItem('purchases', purchasesRaw != null ? purchasesRaw : '[]')
            if (purchasesRaw == null) localStorage.setItem(scopedKey('purchases', userId), '[]')
        } catch {}
        try {
            const dailyLast = localStorage.getItem(scopedKey('daily_last', userId))
            const dailyStreak = localStorage.getItem(scopedKey('daily_streak', userId))
            localStorage.setItem('daily_last', dailyLast != null ? dailyLast : '')
            localStorage.setItem('daily_streak', dailyStreak != null ? dailyStreak : '0')
            if (dailyLast == null) localStorage.setItem(scopedKey('daily_last', userId), '')
            if (dailyStreak == null) localStorage.setItem(scopedKey('daily_streak', userId), '0')
        } catch {}
        try {
            const spins = localStorage.getItem(scopedKey('task_spins', userId))
            localStorage.setItem('task_spins', spins != null ? spins : '0')
            if (spins == null) localStorage.setItem(scopedKey('task_spins', userId), '0')
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])
    type GameMode = 'normal' | 'pyramid' | 'allin'
    const [mode, setMode] = React.useState<GameMode>('normal')
    const [currency, setCurrency] = React.useState<'W'|'B'>('W')
    const [bet, setBet] = React.useState<number>(100)
    const [pickedDigit, setPickedDigit] = React.useState<number>(0)
    const [spinning, setSpinning] = React.useState<boolean>(false)
    // State for 3/10 mode: track spin sequence
    const [pyramidSpinCount, setPyramidSpinCount] = React.useState<number>(0)
    const pyramidSpinCountRef = React.useRef<number>(0) // Ref для синхронного доступа
    const [pyramidResults, setPyramidResults] = React.useState<number[]>([]) // Все 3 результата вращений
    const pyramidResultsRef = React.useRef<number[]>([]) // Ref для синхронного доступа к результатам
    const pyramidBetRef = React.useRef<number>(0) // Сохраняем ставку для серии 3/10
    const pyramidSelectedDigitRef = React.useRef<number>(pickedDigit) // фиксируем выбранную цифру на старте серии 3/10
    const pyramidPlannedDigitsRef = React.useRef<number[] | null>(null) // планируем уникальные цифры для серии 3/10
    const pyramidLastResultRef = React.useRef<{ count: number, result: number } | null>(null) // Последний обработанный результат
    const pyramidSpinIdRef = React.useRef<number>(0) // Уникальный ID для каждого физического спина
    const pyramidProcessedSpinIdRef = React.useRef<number>(-1) // ID последнего обработанного спина
    const [pyramidShowResults, setPyramidShowResults] = React.useState<boolean>(false) // Показывать ли результаты
    const [pyramidCountdown, setPyramidCountdown] = React.useState<number | null>(null) // Обратный отсчет до следующего вращения
    const [pressedCardIdx, setPressedCardIdx] = React.useState<number | null>(null)
    const [bonusesOpen, setBonusesOpen] = React.useState<boolean>(false)
    const [inviteOpen, setInviteOpen] = React.useState<boolean>(false)
    const [inviteInfoOpen, setInviteInfoOpen] = React.useState<boolean>(false)
    const [inviteAnimatingOut, setInviteAnimatingOut] = React.useState<boolean>(false)
    const [inviteHeightVh, setInviteHeightVh] = React.useState<number>(80)
    const inviteDragStartY = React.useRef<number | null>(null)
    const inviteDragStartTs = React.useRef<number>(0)
    const inviteDragStartHeightVh = React.useRef<number>(64)
    const inviteLastY = React.useRef<number>(0)
    const inviteLastTs = React.useRef<number>(0)
    
    type FriendEntry = { id: number, name: string, photo?: string, rewardW: number, level?: number, coins?: number }
    const [friends, setFriends] = React.useState<FriendEntry[]>([])

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
    const [levelsOpen, setLevelsOpen] = React.useState<boolean>(false)
    const [levelsAnimatingOut, setLevelsAnimatingOut] = React.useState<boolean>(false)
    const [levelsSheetHeightVh, setLevelsSheetHeightVh] = React.useState<number>(80)
    const levelsDragStartY = React.useRef<number | null>(null)
    const levelsOpenRef = React.useRef<boolean>(false)
    const levelsDragStartTs = React.useRef<number>(0)
    const levelsDragStartHeightVh = React.useRef<number>(64)
    const levelsLastY = React.useRef<number>(0)
    const levelsLastTs = React.useRef<number>(0)
    const [starsOpen, setStarsOpen] = React.useState<boolean>(false)
    const [tasksOpen, setTasksOpen] = React.useState<boolean>(false)
    const [newsOpen, setNewsOpen] = React.useState<boolean>(false)
    const [leaderboardOpen, setLeaderboardOpen] = React.useState<boolean>(false)
    const [leaderboardAnimatingOut, setLeaderboardAnimatingOut] = React.useState<boolean>(false)
    const [leaderboardHeightVh, setLeaderboardHeightVh] = React.useState<number>(85)
    const leaderboardDragStartY = React.useRef<number | null>(null)
    const leaderboardDragStartTs = React.useRef<number>(0)
    const leaderboardDragStartHeightVh = React.useRef<number>(64)
    const leaderboardLastY = React.useRef<number>(0)
    const leaderboardLastTs = React.useRef<number>(0)

    // Бонусы: Сердце (сохраняет деньги при проигрыше), Батарейка (дополнительное вращение), Ракета (удваивает выигрыш)
    const BONUS_LABELS: string[] = ['Heart','Battery','Rocket']
    const BONUS_IMAGES: string[] = ['/heardwh.png', '/battery.png', '/spacewh.png']
    // Сопоставление сектора (цифры) к типу бонуса:
    // heardwh.png (Heart) -> 4,8 (индекс 0)
    // battery.png (Battery) -> 2 (индекс 1)
    // spacewh.png (Rocket) -> 0,6 (индекс 2)
    // Остальные секторы (1,3,5,7,9) не дают бонусов (-1)
    const SECTOR_TO_BONUS: number[] = [
        2, // 0 -> spacewh (Rocket)
        -1, // 1 -> нет бонуса
        1, // 2 -> battery (Battery)
        -1, // 3 -> нет бонуса
        0, // 4 -> heardwh (Heart)
        -1, // 5 -> нет бонуса
        2, // 6 -> spacewh (Rocket)
        -1, // 7 -> нет бонуса
        0, // 8 -> heardwh (Heart)
        -1  // 9 -> нет бонуса
    ]
    const getSectorBonusIndex = (i: number): number => {
        const idx = ((i % 10) + 10) % 10
        const val = SECTOR_TO_BONUS[idx]
        return (typeof val === 'number' && val >= 0 ? val : -1) // -1 означает отсутствие бонуса
    }

    // Bonus wheel unlock gate: early levels play without bonus selection / sector rewards
    const BONUS_WHEEL_UNLOCK_LEVEL = 4
    
    // Состояние для дополнительных вращений (батарейка)
    const [extraSpinsRemaining, setExtraSpinsRemaining] = React.useState<number>(0)
    const extraSpinsRemainingRef = React.useRef<number>(0)
    const extraSpinInFlightRef = React.useRef<boolean>(false)
    const isExtraSpinRef = React.useRef<boolean>(false) // следующий spin — авто от батарейки (без списания ставки/проверок)
    const batteryUsedRef = React.useRef<boolean>(false) // Флаг использования батарейки (для удаления из инвентаря после спина)
    const pyramidMaxSpinsRef = React.useRef<number>(3) // 3/10, с батарейкой — 4
    const pyramidBatteryExtraSpinRef = React.useRef<boolean>(false) // Флаг батарейки для режима 3/10
    
    // Состояние для сохранения ставки при проигрыше (сердце)
    const [heartBonusActive, setHeartBonusActive] = React.useState<boolean>(false)
    const heartBonusActiveRef = React.useRef<boolean>(false)
    const [selectedBonusSector, setSelectedBonusSector] = React.useState<number | null>(null)
    const [selectedBonusBucket, setSelectedBonusBucket] = React.useState<number | null>(null)
    
    // Случайные бонусы для последних 2 квадратиков (обновляются при каждом спине)
    type RandomBonus = { type: 'bonus', image: string, label: string } | { type: 'money', amount: number }
    const [randomBonuses, setRandomBonuses] = React.useState<[RandomBonus, RandomBonus]>(() => {
        // Генерируем начальные случайные бонусы
        const bonusOptions: RandomBonus[] = [
            { type: 'bonus', image: '/spacewh.png', label: 'Ракета' },
            { type: 'bonus', image: '/heardwh.png', label: 'Сердце' },
            { type: 'bonus', image: '/battery.png', label: 'Батарейка' },
            { type: 'money', amount: 100 },
            { type: 'money', amount: 1000 },
            { type: 'money', amount: 10000 },
            { type: 'money', amount: 100000 }
        ]
        const shuffled = [...bonusOptions].sort(() => Math.random() - 0.5)
        return [shuffled[0], shuffled[1]] as [RandomBonus, RandomBonus]
    })
    
    // Функция для генерации случайных бонусов (2 для квадратиков)
    const generateRandomBonuses = (): [RandomBonus, RandomBonus] => {
        const bonusOptions: RandomBonus[] = [
            { type: 'bonus', image: '/spacewh.png', label: 'Ракета' },
            { type: 'bonus', image: '/heardwh.png', label: 'Сердце' },
            { type: 'bonus', image: '/battery.png', label: 'Батарейка' },
            { type: 'money', amount: 100 },
            { type: 'money', amount: 1000 },
            { type: 'money', amount: 10000 },
            { type: 'money', amount: 100000 }
        ]
        const shuffled = [...bonusOptions].sort(() => Math.random() - 0.5)
        return [shuffled[0], shuffled[1]] as [RandomBonus, RandomBonus]
    }
    
    // Функция для генерации 10 случайных бонусов для секторов колеса с взвешенной вероятностью
    const generateSectorBonuses = (): RandomBonus[] => {
        // Взвешенные вероятности (сумма = 100):
        // - Деньги <= 1000: чаще (85%)
        // - Деньги > 1000: реже (12%)
        // - Бустеры: намного реже (3%)
        const weightedOptions: Array<{ bonus: RandomBonus, weight: number }> = [
            // small money
            { bonus: { type: 'money', amount: 100 }, weight: 55 },
            { bonus: { type: 'money', amount: 1000 }, weight: 30 },
            // big money (rarer than small)
            { bonus: { type: 'money', amount: 10000 }, weight: 10 },
            { bonus: { type: 'money', amount: 100000 }, weight: 2 },
            // boosters (very rare)
            { bonus: { type: 'bonus', image: '/spacewh.png', label: 'Ракета' }, weight: 1 },
            { bonus: { type: 'bonus', image: '/heardwh.png', label: 'Сердце' }, weight: 1 },
            { bonus: { type: 'bonus', image: '/battery.png', label: 'Батарейка' }, weight: 1 }
        ]
        
        // Генерируем 10 случайных бонусов с учетом весов
        const sectorBonuses: RandomBonus[] = []
        const totalWeight = weightedOptions.reduce((sum, opt) => sum + opt.weight, 0)
        
        for (let i = 0; i < 10; i++) {
            let random = Math.random() * totalWeight
            for (const option of weightedOptions) {
                random -= option.weight
                if (random <= 0) {
                    sectorBonuses.push(option.bonus)
                    break
                }
            }
        }
        return sectorBonuses
    }
    
    // Состояние для бонусов в секторах колеса
    const [sectorBonuses, setSectorBonuses] = React.useState<RandomBonus[]>(() => {
        const bonuses = generateSectorBonuses()
        return bonuses.length === 10 ? bonuses : generateSectorBonuses() // Убеждаемся, что ровно 10
    })
    // Минимальная базовая скорость автопополнения: 0.01 W/сек = 36 W/час = 108 W за 3 часа
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
            tasks_title: 'Задания',
            invite_title: 'Пригласите друзей',
            invite_subtitle: 'Вы и ваш друг получите бонусы',
            invite_cta: '+5 000 для вас и вашего друга',
            friends_list: 'Список ваших друзей',
            invite_hint: 'Отправляй ссылку друзьям и получай дополнительное вознаграждение за каждого друга, прошедшего регистрацию в игре. При этом твои друзья тоже получат приветственный бонус.',
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
            buy_bonus_1b: 'Купить бонусы за 1000 W',
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
            tasks_title: 'Tasks',
            invite_title: 'Invite friends',
            invite_subtitle: 'You and your friend will get bonuses',
            invite_cta: '+5,000 for you and your friend',
            friends_list: 'Your friends',
            invite_hint: 'Share the link with friends and get an extra reward for each friend who registers in the game. Your friends also receive a welcome bonus.',
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
            buy_bonus_1b: 'Buy bonuses for 1000 W',
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
    // Синхронизируем ref с состоянием
    React.useEffect(() => {
        levelsOpenRef.current = levelsOpen
        if (levelsOpen && window.console && window.console.log) {
            window.console.log('[GameScreen] levelsOpen is TRUE - panel should be visible')
        }
    }, [levelsOpen])
    
    // Открытие панели уровней (определяем после lang, чтобы избежать TDZ)
    // Делаем точно так же, как открываются другие панели (tasks, news и т.д.)
    function openLevelsPanel() {
        // Явная проверка - используем window.console чтобы логи не удалялись при минификации
        if (window.console && window.console.log) {
            window.console.log('[openLevelsPanel] CALLED')
        }
        triggerHaptic('impact')
        setToast(lang === 'ru' ? 'Открываю уровни…' : 'Opening levels…')
        
        // Сбрасываем анимацию закрытия
        setLevelsAnimatingOut(false)
        
        // Закрываем меню
        setIsMenuOpen(false)
        setIsRightMenuOpen(false)
        
        // Открываем панель СРАЗУ - без задержек
        setLevelsOpen(true)
        levelsOpenRef.current = true
        
        if (window.console && window.console.log) {
            window.console.log('[openLevelsPanel] levelsOpen set to TRUE')
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
                    // Накопитель открывается с 5 уровня: до этого всегда 0
                    if (playerLevelRef.current < 5) {
                        try {
                            localStorage.setItem('mid_w', '0')
                            localStorage.setItem('mid_w_last_ts', String(now))
                        } catch {}
                        return 0
                    }
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
                // Накопитель открывается с 5 уровня: до этого всегда 0
                if (playerLevelRef.current < 5) {
                    try {
                        localStorage.setItem('mid_w', '0')
                        localStorage.setItem('mid_w_last_ts', String(Date.now()))
                    } catch {}
                    return 0
                }
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

    // Удалена функция syncPlayerToServer - больше не нужна

    function saveBalances(nextW: number, nextB: number, reason?: string) {
        // Округляем балансы до целых чисел, чтобы не было копеек
        const roundedW = Math.floor(nextW)
        const roundedB = Math.floor(nextB)
        
        // Логирование изменений баланса
        const prevW = balanceWRef.current
        const prevB = balanceBRef.current
        const deltaW = roundedW - prevW
        const deltaB = roundedB - prevB
        if (deltaW !== 0 || deltaB !== 0) {
            const stack = new Error().stack
            const caller = stack?.split('\n')[2]?.trim() || 'unknown'
            console.log(`[Balance Change] ${reason || 'Unknown reason'}`)
            console.log(`  W: ${prevW} → ${roundedW} (${deltaW > 0 ? '+' : ''}${deltaW})`)
            console.log(`  B: ${prevB} → ${roundedB} (${deltaB > 0 ? '+' : ''}${deltaB})`)
            console.log(`  Called from: ${caller}`)
            if (stack) {
                console.log(`  Full stack:`, stack)
            }
        }
        
        // update refs synchronously to avoid stale balance issues in same tick
        balanceWRef.current = roundedW
        balanceBRef.current = roundedB
        setBalanceW(roundedW)
        setBalanceB(roundedB)
        try {
            localStorage.setItem('balance_w', String(roundedW))
            localStorage.setItem('balance_b', String(roundedB))
            const uid = userIdRef.current
            if (uid) {
                localStorage.setItem(`balance_w_${uid}`, String(roundedW))
                localStorage.setItem(`balance_b_${uid}`, String(roundedB))
            }
        } catch {}
        // Параллельно сохраняем баланс в CloudStorage Telegram, чтобы он был общим для телефона и ПК
        try {
            const tg = (window as any).Telegram?.WebApp
            const cloud = tg?.CloudStorage
            if (cloud && userId) {
                const payload = JSON.stringify({ balanceW: roundedW, balanceB: roundedB })
                const uid = userIdRef.current
                const key = uid ? `speen_balance_v1_${uid}` : 'speen_balance_v1'
                cloud.setItem(key, payload, () => {})
            }
        } catch {}
        // Отправляем данные в рейтинг (debounced через setTimeout)
        updateLeaderboard(roundedW, roundedB)
    }
    
    const leaderboardUpdateTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const leaderboardInitSent = React.useRef<boolean>(false)
    function updateLeaderboard(coins: number, coinsB: number) {
        console.log('[Leaderboard] updateLeaderboard called with:', { coins, coinsB, userId, username })
        if (leaderboardUpdateTimeout.current) {
            clearTimeout(leaderboardUpdateTimeout.current)
        }
        leaderboardUpdateTimeout.current = setTimeout(async () => {
            try {
                if (!userId || !username) {
                    console.log('[Leaderboard] Skipping: no userId or username')
                    return
                }
                // Жёстко указываем backend, чтобы исключить ошибки с переменными окружения
                const API_BASE = 'https://speen-server.onrender.com'
                const url = `${API_BASE}/api/leaderboard/upsert`
                const level = 1
                const totalCoins = coins + coinsB * 10000
                const payload = {
                    id: userId,
                    name: username,
                    photo: avatarUrl || null,
                    level,
                    coins: totalCoins
                }
                console.log('[Leaderboard] Sending to:', url, payload)
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                console.log('[Leaderboard] Response status:', res.status)
                if (res.ok) {
                    let data: any = null
                    try {
                        data = await res.json()
                    } catch {
                        // если бэкенд вернул пустой ответ или не-JSON — просто игнорируем
                    }
                    console.log('[Leaderboard] Response data:', data)
                } else {
                    console.error('[Leaderboard] Server error:', res.status)
                }

                // Параллельно обновляем профиль игрока для рефералок
                try {
                    await fetch(`${API_BASE}/api/player/upsert`, {
                        method:'POST',
                        headers:{ 'Content-Type':'application/json' },
                        body: JSON.stringify(payload)
                    })
                } catch(e) {
                    console.error('[Player] Failed to sync profile:', e)
                }
            } catch (e) {
                console.error('[Leaderboard] Failed to update:', e)
            }
        }, 2000)
    }

    // Одноразовая инициализация записи игрока в таблице рейтинга после загрузки данных
    React.useEffect(() => {
        console.log('[Leaderboard Init] Effect triggered:', { userId, username, balanceW, balanceB })
        if (!userId || !username) {
            console.log('[Leaderboard Init] Skipping: no userId or username')
            return
        }
        if (leaderboardInitSent.current) {
            console.log('[Leaderboard Init] Already sent, skipping')
            return
        }
        console.log('[Leaderboard Init] Sending initial data')
        leaderboardInitSent.current = true
        updateLeaderboard(balanceW, balanceB)
    }, [userId, username, balanceW, balanceB])

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
                // level stats: B purchase total
                try {
                    const s = levelStatsRef.current
                    bumpStats({ purchasedBTotal: (s.purchasedBTotal || 0) + Math.floor(toB) })
                } catch {}
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
        // Х2: от 100 до 100 000
        // 3/10: от 10 000 до 100 000
        // Х5: от 1000 до 100 000
        const max = 100_000
        let min = 100
        if (m === 'pyramid') min = 10_000
        else if (m === 'allin') min = 1000
        return { min, max }
    }

    // Clamp bet when mode/currency changes - всегда сбрасываем до минимума при смене режима
    React.useEffect(() => {
        const { min, max } = getLimits(mode, currency)
        // При смене режима всегда ставим минимальную ставку
        setBet(min)
        // Сбрасываем состояние pyramid при смене режима
        setPyramidSpinCount(0)
        pyramidSpinCountRef.current = 0
        setPyramidResults([])
        pyramidResultsRef.current = []
        setPyramidShowResults(false)
        setPyramidCountdown(null)
        // Очищаем таймеры авто-вращений и обратного отсчета
        clearPyramidTimers(true)
        // Сбрасываем флаг единоразового списания ставки для 3/10
        pyramidBetTakenRef.current = false
    }, [mode, currency])

    // Держим ref в синхронизации с состоянием (на случай внешних сбросов)
    React.useEffect(() => {
        pyramidSpinCountRef.current = pyramidSpinCount
    }, [pyramidSpinCount])

    React.useEffect(() => () => {
        clearPyramidTimers(true)
        pyramidBetTakenRef.current = false
    }, [])

    // Фоновое начисление монет убрано - все начисления идут только в накопитель (midW)
    // Накопитель обрабатывается в отдельном useEffect выше
    
    // Автоматический запуск следующего вращения в режиме pyramid после завершения предыдущего
    const pyramidAutoSpinTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const pyramidCountdownIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
    // Отдельный флаг: списали ли ставку для текущей серии 3 из 10
    const pyramidBetTakenRef = React.useRef<boolean>(false)

    function clearPyramidTimers(resetCountdown = false) {
        if (pyramidAutoSpinTimeoutRef.current) {
            clearTimeout(pyramidAutoSpinTimeoutRef.current)
            pyramidAutoSpinTimeoutRef.current = null
        }
        if (pyramidCountdownIntervalRef.current) {
            clearInterval(pyramidCountdownIntervalRef.current)
            pyramidCountdownIntervalRef.current = null
        }
        if (resetCountdown) {
            setPyramidCountdown(null)
        }
    }

    function scheduleNextPyramidSpin(nextSpinCount: number) {
        console.log(`[scheduleNextPyramidSpin] Scheduling spin ${nextSpinCount}`)
        // Очищаем предыдущие таймеры перед созданием нового
        clearPyramidTimers(true)
        let countdown = 4
        setPyramidCountdown(countdown)
        setToast(`Следующее вращение через ${countdown}...`)
        pyramidCountdownIntervalRef.current = window.setInterval(() => {
            countdown -= 1
            if (countdown > 0) {
                setPyramidCountdown(countdown)
                setToast(`Следующее вращение через ${countdown}...`)
            } else {
                if (pyramidCountdownIntervalRef.current) {
                    clearInterval(pyramidCountdownIntervalRef.current)
                    pyramidCountdownIntervalRef.current = null
                }
                setPyramidCountdown(null)
            }
        }, 1000)

        pyramidAutoSpinTimeoutRef.current = window.setTimeout(() => {
            console.log(`[scheduleNextPyramidSpin] Timeout fired for spin ${nextSpinCount}`)
            if (pyramidCountdownIntervalRef.current) {
                clearInterval(pyramidCountdownIntervalRef.current)
                pyramidCountdownIntervalRef.current = null
            }
            setPyramidCountdown(null)
            // Если серия 3 из 10 уже завершена или не активна — не крутим дальше
            if (!pyramidBetTakenRef.current) {
                console.log('[scheduleNextPyramidSpin] Series no longer active, aborting auto-spin')
                return
            }
            // Проверяем, что мы не превысили лимит спинов
            const maxPyramidSpins = pyramidMaxSpinsRef.current
            if (pyramidResultsRef.current.length >= maxPyramidSpins) {
                console.log(`[scheduleNextPyramidSpin] Already have ${pyramidResultsRef.current.length} results, aborting`)
                return
            }
            if (!wheelRef.current) {
                console.log('[scheduleNextPyramidSpin] Wheel ref missing on timeout')
                return
            }
            try {
                console.log(`[scheduleNextPyramidSpin] Triggering wheelRef.spin() for spin ${nextSpinCount}`)
                // Генерируем уникальный ID для этого физического спина
                pyramidSpinIdRef.current += 1
                console.log(`[scheduleNextPyramidSpin] Generated spin ID: ${pyramidSpinIdRef.current}`)
                const planned = pyramidPlannedDigitsRef.current
                const plannedIdx = Math.max(0, Math.min(9, (planned && planned[nextSpinCount - 1] != null) ? planned[nextSpinCount - 1] : -1))
                if (plannedIdx >= 0) {
                    wheelRef.current.spin(plannedIdx)
                } else {
                    wheelRef.current.spin()
                }
            } catch (err) {
                console.error('[scheduleNextPyramidSpin] Auto spin error:', err)
            }
        }, 4000)
    }

    function recordSpinStart(m: GameMode, cur: 'W'|'B', betAmount: number) {
        // Учитываем только "реальные" (ручные) старты: авто-спины батарейки и авто-спины 3/10 сюда не вызываются.
        try {
            setLevelStats(prev => {
                const isB = cur === 'B'
                const next: LevelStats = {
                    ...prev,
                    spinsTotal: (prev.spinsTotal || 0) + 1,
                    spinsW: (prev.spinsW || 0) + (cur === 'W' ? 1 : 0),
                    spinsB: (prev.spinsB || 0) + (cur === 'B' ? 1 : 0),
                    spinsX2: (prev.spinsX2 || 0) + (m === 'normal' ? 1 : 0),
                    spinsX5: (prev.spinsX5 || 0) + (m === 'allin' ? 1 : 0),
                    spins3of10: (prev.spins3of10 || 0) + (m === 'pyramid' ? 1 : 0),
                    spinsX2B: (prev.spinsX2B || 0) + (m === 'normal' && isB ? 1 : 0),
                    spinsX5B: (prev.spinsX5B || 0) + (m === 'allin' && isB ? 1 : 0),
                    spins3of10B: (prev.spins3of10B || 0) + (m === 'pyramid' && isB ? 1 : 0),
                    spinsBetAtLeast10000B: (prev.spinsBetAtLeast10000B || 0) + (isB && Number(betAmount) >= 10000 ? 1 : 0),
                    // streaks for "подряд"
                    streakX2: m === 'normal' ? ((prev.streakX2 || 0) + 1) : 0,
                    streakX5: m === 'allin' ? ((prev.streakX5 || 0) + 1) : 0,
                }
                try {
                    const raw = JSON.stringify(next)
                    localStorage.setItem(STATS_KEY, raw)
                    const uid = userIdRef.current
                    if (uid) localStorage.setItem(`${STATS_KEY}_${uid}`, raw)
                } catch {}
                return next
            })
            // Сразу ставим задачу на синк прогресса, чтобы сервер знал о спинах
            scheduleProgressSync()
        } catch {}
    }

    // Авто-повышение уровня, как только выполнено условие следующего уровня
    React.useEffect(() => {
        const next = Math.min(50, playerLevel + 1)
        if (next > playerLevel && isLevelRequirementMet(next)) {
            tryClaimNextLevel(next)
            triggerHaptic('success')
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [levelStats])

    function onBeforeSpin() {
        const bonusWheelUnlocked = playerLevelRef.current >= BONUS_WHEEL_UNLOCK_LEVEL
        const curW = balanceWRef.current
        const curB = balanceBRef.current
        // Авто‑спин от батарейки: не списываем ставку и не требуем выбор бонусного сектора
        if (isExtraSpinRef.current) {
            isExtraSpinRef.current = false
            console.log('[onBeforeSpin] Allowing extra spin (Battery) without checks/deduction')
            // Сбрасываем флаг использования батарейки, если это был последний спин
            if (extraSpinsRemainingRef.current === 0) {
                batteryUsedRef.current = false
            }
            return true
        }

        // Текущее значение счётчика 3 из 10 (для авто-вращений)
        const currentCount = pyramidSpinCountRef.current

        // Если мы находимся внутри серии 3 из 10 (currentCount > 0),
        // но по какой-то причине mode уже не 'pyramid' (например, задержка таймера),
        // то всё равно разрешаем авто-вращение без дополнительных проверок.
        if (currentCount > 0 && mode !== 'pyramid') {
            console.log('[onBeforeSpin] Forcing auto-spin as part of pyramid series despite mode change')
            return true
        }

        // Для обычных режимов блокируем повторный старт во время спина
        // НО: если это не дополнительный спин и нет активных дополнительных спинов, разрешаем
        if (spinning && mode !== 'pyramid') {
            // Если есть активные дополнительные спины, блокируем (они запускаются автоматически)
            if (extraSpinsRemainingRef.current > 0 || extraSpinInFlightRef.current) {
                console.log('[onBeforeSpin] Blocking: extra spins in progress')
                return false
            }
            // Если spinning все еще true, но нет активных дополнительных спинов - это ошибка состояния
            // Сбрасываем spinning и разрешаем спин
            console.log('[onBeforeSpin] Warning: spinning is true but no extra spins, resetting and allowing spin')
            setSpinning(false)
        }
        
        // Для режима pyramid (3/10) обрабатываем отдельно
        if (mode === 'pyramid') {
            console.log(`[onBeforeSpin] Pyramid mode, currentCount: ${currentCount}, spinning: ${spinning}, betTaken: ${pyramidBetTakenRef.current}`)
            
            // Уже сделали три вращения — больше не крутим
            if (currentCount >= pyramidMaxSpinsRef.current) {
                console.log('[onBeforeSpin] All 3 spins done, blocking')
                return false
            }
            
            // Если ставка уже была списана (мы внутри серии 3 из 10)
            if (pyramidBetTakenRef.current) {
                // Проверяем, сколько результатов уже есть
                const resultsCount = pyramidResultsRef.current.length
                if (resultsCount < pyramidMaxSpinsRef.current) {
                    console.log(`[onBeforeSpin] Auto-spin allowed (${resultsCount} results so far)`)
                    return true
                }
                console.log(`[onBeforeSpin] Already have ${resultsCount} results, blocking`)
                return false
            }
            
            // Первое вращение серии: выполняем все проверки и списываем ставку ОДИН раз
            if (pickedDigit == null) { 
                setToast(t('pick_number')); 
                return false 
            }
            // В 3 из 10 бонусный сектор обязателен только после открытия бонус-барабана
            if (bonusWheelUnlocked && selectedBonusSector == null) {
                setToast('Выберите бонусный сектор перед началом');
                return false
            }

            // Батарейка как бустер в 3/10: даёт 4-е вращение (итог — 4 цифры). Используем её сразу при старте серии.
            pyramidMaxSpinsRef.current = 3
            pyramidBatteryExtraSpinRef.current = false
            if (selectedBonusBucket != null) {
                try {
                    const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                    const inv: string[] = JSON.parse(invRaw)
                    const bonusName = BONUS_LABELS[selectedBonusBucket] || ''
                    const bonusIndex = inv.indexOf(bonusName)
                    if (bonusIndex !== -1 && bonusName === 'Battery') {
                        inv.splice(bonusIndex, 1)
                        localStorage.setItem('bonuses_inv', JSON.stringify(inv))
                        pyramidMaxSpinsRef.current = 4
                        pyramidBatteryExtraSpinRef.current = true
                        setSelectedBonusBucket(null)
                        setToast('Батарейка активирована: 4-е вращение в режиме 3/10')
                    }
                } catch {}
            }
            // Планируем уникальные цифры для серии 3/10 (исключаем дубли, чтобы не было конфликтов начисления)
            try {
                const maxSpins = pyramidMaxSpinsRef.current
                const planned: number[] = []
                while (planned.length < maxSpins) {
                    const n = Math.floor(Math.random() * 10)
                    if (!planned.includes(n)) planned.push(n)
                }
                pyramidPlannedDigitsRef.current = planned
            } catch {
                pyramidPlannedDigitsRef.current = null
            }
            const { min, max } = getLimits(mode, currency)
            const b = Math.max(min, Math.min(max, Math.floor(bet)))
            if (b !== bet) setBet(b)
            
            // Проверяем баланс (только при первом запуске) - проверяем ДО списания
            if (currency === 'W') {
                if (curW < b) { 
                    setToast(t('not_enough_W')); 
                    return false 
                }
            } else {
                if (curB < b) { 
                    setToast(t('not_enough_B')); 
                    return false 
                }
            }
            
            // Списываем ставку только один раз в начале (при первом нажатии на старт)
            // Фиксируем выбранную цифру на старте серии, чтобы игрок не мог "случайно" сменить её во время авто-вращений
            pyramidSelectedDigitRef.current = pickedDigit
            if (currency === 'W') {
                saveBalances(curW - b, curB, `Pyramid mode: bet ${b} W deducted`)
            } else {
                saveBalances(curW, curB - b, `Pyramid mode: bet ${b} B deducted`)
            }
            
            // Отмечаем, что ставка для этой серии уже списана
            pyramidBetTakenRef.current = true
            // Сохраняем ставку для расчета выигрыша в конце серии
            pyramidBetRef.current = b
            
            // Инициализируем состояние для 3 вращений (синхронно через ref)
            pyramidSpinCountRef.current = 1
            setPyramidSpinCount(1)
            setPyramidResults([])
            pyramidResultsRef.current = []
            pyramidLastResultRef.current = null
            pyramidProcessedSpinIdRef.current = -1
            setPyramidShowResults(false)
            
            // Генерируем уникальный ID для первого спина
            pyramidSpinIdRef.current += 1
            console.log(`[onBeforeSpin] First pyramid spin allowed, generated spin ID: ${pyramidSpinIdRef.current}`)
            recordSpinStart('pyramid', currency, b)
            // Возвращаем индекс, чтобы ImageWheel зафиксировал выпадение (без дублей)
            const planned0 = pyramidPlannedDigitsRef.current?.[0]
            if (typeof planned0 === 'number') return planned0
            return true
        }
        
        // Для обычных режимов (x2 и x5) выполняем стандартные проверки
        if (pickedDigit == null) { 
            setToast(t('pick_number')); 
            return false 
        }
        
        const { min, max } = getLimits(mode, currency)
        const b = Math.max(min, Math.min(max, Math.floor(bet)))
        if (b !== bet) setBet(b)
        
        // Для обычных режимов требуем выбор бонусного сектора только после открытия бонус-барабана
        if (bonusWheelUnlocked && selectedBonusSector == null) {
            setToast(lang === 'ru' ? 'Выберите бонус перед стартом' : 'Select bonus before start')
            return false
        }
        
        // Для обычных режимов списываем ставку сразу
        if (currency === 'W') {
            if (curW < b) { 
                setToast(t('not_enough_W')); 
                return false 
            }
            saveBalances(curW - b, curB, `${mode} mode: bet ${b} W deducted`)
        } else {
            if (curB < b) { 
                setToast(t('not_enough_B')); 
                return false 
            }
            saveBalances(curW, curB - b, `${mode} mode: bet ${b} B deducted`)
        }
        recordSpinStart(mode, currency, b)
        return true
    }

    function onSpinResult(index: number, label: string) {
        const b = Math.floor(bet)

        // Специальная логика для режима 3/10 (pyramid)
        // Используем длину массива результатов как текущий номер спина
        const currentPyramidCount = pyramidResultsRef.current.length + 1
        console.log(`[onSpinResult] Mode: ${mode}, currentPyramidCount: ${currentPyramidCount}, result: ${label}, betTaken: ${pyramidBetTakenRef.current}`)
        
        // Если у нас идёт активная серия 3 из 10 (ставка уже списана),
        // обрабатываем результат по специальным правилам, даже если пользователь
        // успел переключить режим в интерфейсе.
        if (pyramidBetTakenRef.current && currentPyramidCount <= pyramidMaxSpinsRef.current) {
            const currentSpinId = pyramidSpinIdRef.current
            console.log(`[onSpinResult] Processing pyramid spin ${currentPyramidCount}, spinId: ${currentSpinId}`)
            const resultNumber = Number(label)
            
            // Проверяем, не обработали ли мы уже этот физический спин (защита от множественных вызовов onSpinResult)
            if (pyramidProcessedSpinIdRef.current === currentSpinId) {
                console.log(`[onSpinResult] Spin ID ${currentSpinId} already processed, skipping`)
                return
            }
            
            // Отмечаем этот спин как обработанный
            pyramidProcessedSpinIdRef.current = currentSpinId
            console.log(`[onSpinResult] Marked spin ID ${currentSpinId} as processed`)
            
            // Проверяем уникальность числа - все три числа должны быть разными
            const currentResults = pyramidResultsRef.current
            let finalResultNumber = resultNumber
            
            // Если число уже выпало, находим следующее уникальное число
            if (currentResults.includes(resultNumber)) {
                // Функция для поиска следующего уникального числа
                const findNextUniqueNumber = (startNum: number): number => {
                    for (let i = 1; i < 10; i++) {
                        const nextNum = (startNum + i) % 10
                        if (!currentResults.includes(nextNum)) {
                            return nextNum
                        }
                    }
                    // Если все числа уже выпали (невозможно для 3 спинов, но на всякий случай)
                    return (startNum + 1) % 10
                }
                finalResultNumber = findNextUniqueNumber(resultNumber)
                console.log(`[onSpinResult] Replaced duplicate ${resultNumber} with unique number: ${finalResultNumber}`)
            }
            
            // Сохраняем текущий результат как последний обработанный
            pyramidLastResultRef.current = { count: currentPyramidCount, result: finalResultNumber }
            
            // Добавляем результат в массив (используем ref для синхронного доступа)
            const newResults = [...currentResults, finalResultNumber]
            pyramidResultsRef.current = newResults
            setPyramidResults(newResults)
            console.log(`[onSpinResult] Results so far: ${newResults.join(', ')} (spin ${currentPyramidCount} of 3)`)
            
            // Показываем результат текущего вращения
            setToast(`Вращение ${currentPyramidCount}: ${finalResultNumber}`)
            
            // Если это не последнее вращение, запускаем следующее автоматически
            if (currentPyramidCount < pyramidMaxSpinsRef.current) {
                const nextSpinCount = currentPyramidCount + 1
                console.log(`[onSpinResult] Scheduling next spin: ${nextSpinCount}`)
                scheduleNextPyramidSpin(nextSpinCount)
            } else {
                console.log(`[onSpinResult] Final spin complete, calculating payout`)
                // Это было последнее вращение (pyramidSpinCount === 3) - завершаем и показываем результаты
                // Сбрасываем счетчик СРАЗУ, чтобы предотвратить дальнейшие вращения
                clearPyramidTimers(true)
                pyramidSpinCountRef.current = 0
                setPyramidSpinCount(0)
                pyramidBetTakenRef.current = false
                
                const selectedNum = (typeof pyramidSelectedDigitRef.current === 'number') ? pyramidSelectedDigitRef.current : pickedDigit
                const hitIndex = newResults.indexOf(selectedNum) // -1 if not hit; otherwise 0..3
                console.log(`[onSpinResult] Selected: ${selectedNum}, hitIndex: ${hitIndex}`)
                
                // Вычисляем выигрыш:
                // ВАЖНО: в режиме 3/10 цифры должны быть уникальными (без дублей).
                // Поэтому "выигрыш" зависит от ПОЗИЦИИ угадывания:
                //  - 1-е вращение: 200% от ставки (итого x2)
                //  - 2-е вращение: 150% от ставки (итого x1.5)
                //  - 3-е вращение: 125% от ставки (итого x1.25)
                //  - 4-е вращение (с батарейкой): 200% от ставки (итого x2)
                const pyramidBet = pyramidBetRef.current
                let totalWin = 0
                if (hitIndex === 0) totalWin = Math.floor(pyramidBet * 2.0)
                else if (hitIndex === 1) totalWin = Math.floor(pyramidBet * 1.5)
                else if (hitIndex === 2) totalWin = Math.floor(pyramidBet * 1.25)
                else if (hitIndex === 3) totalWin = Math.floor(pyramidBet * 2.0)
                
                // Применяем активный бонус из инвентаря для режима pyramid
                let bonusMultiplier = 1
                if (selectedBonusBucket != null && totalWin > 0) {
                    try {
                        const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                        const inv: string[] = JSON.parse(invRaw)
                        const bonusName = BONUS_LABELS[selectedBonusBucket] || ''
                        const bonusIndex = inv.indexOf(bonusName)
                        
                        if (bonusIndex !== -1) {
                            // Бонус найден в инвентаре, применяем его
                            if (bonusName === 'Rocket') {
                                // Ракета - умножает выигрыш на 4 (x4)
                                bonusMultiplier = 4
                            }
                            // Сердце и Батарейка не работают в режиме pyramid (только при проигрыше)
                            
                            // Удаляем бонус из инвентаря после использования
                            inv.splice(bonusIndex, 1)
                            localStorage.setItem('bonuses_inv', JSON.stringify(inv))
                            
                            // Сбрасываем выбранный бонус после использования
                            setSelectedBonusBucket(null)
                                                    }
                    } catch {}
                }
                
                // Применяем бонус к выигрышу (только один раз)
                if (bonusMultiplier > 1) {
                    totalWin = totalWin * bonusMultiplier
                }
                
                console.log(`[onSpinResult] Total win: ${totalWin}, bet: ${pyramidBet}, currency: ${currency}`)
                
                if (totalWin > 0) {
                    if (currency === 'W') {
                        saveBalances(balanceWRef.current + totalWin, balanceBRef.current, `Pyramid mode win: selected=${selectedNum}, hitIndex=${hitIndex}, totalWin=${totalWin}`)
                    } else {
                        saveBalances(balanceWRef.current, balanceBRef.current + totalWin, `Pyramid mode win: selected=${selectedNum}, hitIndex=${hitIndex}, totalWin=${totalWin}`)
                    }
                    setToast(`Выигрыш! Выбрано: ${selectedNum}, Выпало: ${newResults.join(', ')}. +${totalWin} ${currency}`)
                } else {
                    setToast(`Проигрыш. Выбрано: ${selectedNum}, Выпало: ${newResults.join(', ')}`)
                }
                
                // Показываем результаты на барабане
                setPyramidShowResults(true)

                // Level milestone: level 6 is granted when results window appears (series completed)
                try {
                    const s = levelStatsRef.current
                    bumpStats({ series3of10Completed: Math.max(1, Number(s.series3of10Completed || 0) + 1) })
                } catch {}
                
                // Обновляем случайные бонусы при каждом спине
                setRandomBonuses(generateRandomBonuses())
                setSectorBonuses(generateSectorBonuses())
                
                // Сбрасываем ref результатов для следующей серии
                pyramidResultsRef.current = []
                pyramidBatteryExtraSpinRef.current = false
            }
            return
        }

        // Стандартная логика для обычных режимов
        const bonusWheelUnlocked = playerLevelRef.current >= BONUS_WHEEL_UNLOCK_LEVEL
        const numCorrect = String(pickedDigit) === label
        const sectorBonusIdx = getSectorBonusIndex(index)
        const bonusCorrect = bonusWheelUnlocked && selectedBonusSector != null && selectedBonusSector === index

        // ВАЖНО: базовые балансы здесь уже должны быть "после списания ставки" (onBeforeSpin).
        // Денежный бонус сектора выдаём ТОЛЬКО если игрок угадал бонусный сектор.
        let currentBalanceW = balanceWRef.current
        let currentBalanceB = balanceBRef.current
        const sectorBonus = sectorBonuses.length > index ? sectorBonuses[index] : null
        let sectorMoneyAmount =
            bonusCorrect && sectorBonus && sectorBonus.type === 'money'
                ? sectorBonus.amount
                : 0
        const hasSectorMoney = sectorMoneyAmount > 0
        
        // Проверяем, есть ли Rocket для удвоения бонусного сектора
        let rocketMultiplier = 1
        if (selectedBonusBucket != null && hasSectorMoney) {
            try {
                const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                const inv: string[] = JSON.parse(invRaw)
                const bonusName = BONUS_LABELS[selectedBonusBucket] || ''
                if (inv.indexOf(bonusName) !== -1 && bonusName === 'Rocket') {
                    rocketMultiplier = 2 // Удваиваем бонус сектора (100 -> 200)
                    sectorMoneyAmount = sectorMoneyAmount * rocketMultiplier
                }
            } catch {}
        }

        if (hasSectorMoney) {
            if (currency === 'W') currentBalanceW = balanceWRef.current + sectorMoneyAmount
            else currentBalanceB = balanceBRef.current + sectorMoneyAmount
            console.log(`[onSpinResult] bonusCorrect=true -> sector money bonus applied: ${sectorMoneyAmount} ${currency} (sector ${index}${rocketMultiplier > 1 ? ', Rocket x2' : ''})`)
        }

        // Если угадан бонусный сектор и там НЕ денежный приз — выдаём предмет (Rocket/Heart/Battery)
        // (без return: игрок может одновременно выиграть по цифре и получить бонус сектора)
        if (bonusCorrect && !hasSectorMoney && sectorBonusIdx >= 0) {
            try {
                const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                const inv: string[] = JSON.parse(invRaw)
                const idxSafe = Math.max(0, Math.min(BONUS_LABELS.length - 1, Number(sectorBonusIdx) || 0))
                const bonusName = BONUS_LABELS[idxSafe] || `Бонус ${idxSafe}`
                inv.push(bonusName)
                localStorage.setItem('bonuses_inv', JSON.stringify(inv))
                const bonusNames: Record<string, string> = {
                    'Heart': 'Сердце',
                    'Battery': 'Батарейка',
                    'Rocket': 'Ракета',
                }
                setToast(`Получен бонус: ${bonusNames[bonusName] || bonusName}`)
            } catch {}
        }

        // Иначе — стандартная логика выигрыша по цифре/режиму
        let delta = 0
        if (mode === 'normal' || mode === 'allin') {
            const won = numCorrect
            // ВАЖНО: ставка уже списана в onBeforeSpin, поэтому при выигрыше
            // возвращаем ставку + начисляем выигрыш по множителю.
            // Пример: x2 => 3*bet (итого +200% к ставке), x5 => 6*bet.
            if (won) delta = b * (getMultiplier(mode) + 1)
        } else {
            // pyramid: center 2x, cw neighbor +50%, ccw neighbor +25% (старая логика, не используется в новом режиме)
            const center = pickedDigit
            const cw = (pickedDigit + 1) % 10
            const ccw = (pickedDigit + 9) % 10
            const n = Number(label)
            if (n === center) delta = Math.max(1, b * 2)
            else if (n === cw) delta = Math.max(1, Math.floor(b * 1.5))
            else if (n === ccw) delta = Math.max(1, Math.floor(b * 1.25))
        }
        
        // Применяем активный бонус из инвентаря, если он выбран и есть в наличии
        // НО: на дополнительных спинах от батарейки не активируем бонусы снова
        let bonusMultiplier = 1
        let shouldSaveBetOnLoss = false // Сердце - сохраняет деньги при проигрыше
        let shouldAddExtraSpins = false // Батарейка - дополнительное вращение
        
        // Проверяем, не является ли это дополнительным спином от батарейки
        const isExtraSpin = isExtraSpinRef.current
        if (isExtraSpin) {
            // На дополнительном спине сбрасываем флаг и не проверяем бонусы
            isExtraSpinRef.current = false
            console.log('[onSpinResult] This is an extra spin from Battery, skipping bonus activation')
        }
        
        if (selectedBonusBucket != null && !isExtraSpin) {
            try {
                const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                const inv: string[] = JSON.parse(invRaw)
                const bonusName = BONUS_LABELS[selectedBonusBucket] || ''
                const bonusIndex = inv.indexOf(bonusName)
                
                if (bonusIndex !== -1) {
                    // Бонус найден в инвентаре
                    if (bonusName === 'Rocket') {
                        // Ракета - умножает выигрыш на 4 (x4) (только при выигрыше)
                        if (numCorrect && delta > 0) {
                            bonusMultiplier = 4
                        }
                        // Бонусный сектор уже обработан выше (удвоен, если был Rocket)
                    } else if (bonusName === 'Heart') {
                        // Сердце - сохраняет деньги при проигрыше
                        if (!numCorrect) {
                            shouldSaveBetOnLoss = true
                        }
                    } else if (bonusName === 'Battery') {
                        // Батарейка - дополнительное вращение (1 раз при проигрыше)
                        // Батарейка будет удалена из инвентаря в onSpinResult перед запуском дополнительного спина
                        if (!numCorrect) {
                            shouldAddExtraSpins = true
                        }
                    }
                    
                    // Удаляем бонус из инвентаря после использования (кроме батарейки - её удалим в onSpinResult)
                    if (bonusName !== 'Battery' || numCorrect) {
                        inv.splice(bonusIndex, 1)
                        localStorage.setItem('bonuses_inv', JSON.stringify(inv))
                    }
                    
                    // Сбрасываем выбранный бонус после использования (кроме батарейки при проигрыше - сбросим в onSpinResult)
                    if (bonusName !== 'Battery' || numCorrect) {
                        setSelectedBonusBucket(null)
                    }
                                    }
            } catch {}
        }
        
        // Применяем бонус к выигрышу
        // ВАЖНО: используем актуальные значения баланса (после начисления денежного бонуса, если был)
        if (delta > 0) {
            // Применяем множитель только один раз
            const finalDelta = bonusMultiplier > 1 ? delta * bonusMultiplier : delta
            
            if (currency === 'W') saveBalances(currentBalanceW + finalDelta, currentBalanceB, `Win: ${finalDelta} W (bet=${b}, multiplier=${getMultiplier(mode)}, bonus=${bonusMultiplier > 1 ? 'Rocket x4' : 'none'})`)
            else saveBalances(currentBalanceW, currentBalanceB + finalDelta, `Win: ${finalDelta} B (bet=${b}, multiplier=${getMultiplier(mode)}, bonus=${bonusMultiplier > 1 ? 'Rocket x4' : 'none'})`)
            setToast(`Победа! +${finalDelta} ${currency}${bonusMultiplier > 1 ? ' (x4 Ракета)' : ''}`)
        } else {
            // Проигрыш
            // Если игрок угадал бонусный сектор и там был денежный приз — начисляем его даже при промахе по цифре.
            // (при Heart-сценарии начисление произойдёт в saveBalances ниже вместе с возвратом ставки)
            if (hasSectorMoney && !shouldSaveBetOnLoss) {
                saveBalances(
                    currentBalanceW,
                    currentBalanceB,
                    `Sector money bonus: ${sectorMoneyAmount} ${currency} from sector ${index} (bonusCorrect)`,
                )
            }

            if (shouldSaveBetOnLoss) {
                // Сердце - возвращаем ставку при проигрыше
                if (currency === 'W') {
                    saveBalances(currentBalanceW + b, currentBalanceB, `Heart bonus: bet ${b} W saved on loss (result=${label})`)
                } else {
                    saveBalances(currentBalanceW, currentBalanceB + b, `Heart bonus: bet ${b} B saved on loss (result=${label})`)
                }
                setToast(`Сердце спасло! Ставка возвращена (${label})`)
            } else if (shouldAddExtraSpins) {
                // Батарейка - добавляем 1 дополнительное вращение
                // Удаляем батарейку из инвентаря сразу, чтобы она не активировалась на дополнительном спине
                try {
                    const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                    const inv: string[] = JSON.parse(invRaw)
                    const batteryIndex = inv.indexOf('Battery')
                    if (batteryIndex !== -1) {
                        inv.splice(batteryIndex, 1)
                        localStorage.setItem('bonuses_inv', JSON.stringify(inv))
                        console.log('[onSpinResult] Battery removed from inventory before extra spin')
                    }
                    setSelectedBonusBucket(null) // Сбрасываем выбранный бонус
                } catch (e) {
                    console.error('[onSpinResult] Failed to remove battery from inventory', e)
                }
                
                extraSpinsRemainingRef.current = 1
                setExtraSpinsRemaining(1)
                extraSpinInFlightRef.current = false // Сбрасываем флаг, чтобы следующий спин мог запуститься
                batteryUsedRef.current = true // Помечаем, что батарейка использована
                console.log('[onSpinResult] Battery activated: extraSpinsRemainingRef.current = 1')
                setToast(`${hasSectorMoney ? `Бонус сектора +${sectorMoneyAmount} ${currency}. ` : ''}Батарейка активирована! +1 дополнительное вращение (${label})`)
                
                // Автоматически запускаем дополнительное вращение сразу после установки флага
                setTimeout(() => {
                    if (wheelRef.current && extraSpinsRemainingRef.current > 0 && !extraSpinInFlightRef.current) {
                        extraSpinInFlightRef.current = true
                        console.log(`[onSpinResult] Starting extra spin immediately (${extraSpinsRemainingRef.current} remaining)`)
                        
                        // Уменьшаем счетчик ПЕРЕД запуском спина
                        extraSpinsRemainingRef.current = Math.max(0, extraSpinsRemainingRef.current - 1)
                        setExtraSpinsRemaining(extraSpinsRemainingRef.current)
                        
                        try {
                            isExtraSpinRef.current = true
                            wheelRef.current?.spin()
                            console.log('[onSpinResult] Extra spin triggered')
                        } catch (e) {
                            console.error('[onSpinResult] extra spin failed, stopping', e)
                            extraSpinsRemainingRef.current = 0
                            setExtraSpinsRemaining(0)
                            extraSpinInFlightRef.current = false
                            batteryUsedRef.current = false
                            setSpinning(false) // Сбрасываем spinning при ошибке
                        }
                    } else {
                        // Если не удалось запустить дополнительный спин, сбрасываем все флаги
                        console.log('[onSpinResult] Failed to start extra spin, resetting flags')
                        extraSpinsRemainingRef.current = 0
                        setExtraSpinsRemaining(0)
                        extraSpinInFlightRef.current = false
                        batteryUsedRef.current = false
                        setSpinning(false)
                    }
                }, 800) // Небольшая задержка для завершения анимации остановки колеса
            } else {
                setToast(`${hasSectorMoney ? `Бонус сектора +${sectorMoneyAmount} ${currency}. ` : ''}Промах (${label})`)
            }
        }

        // Обновляем случайные бонусы при каждом спине
        setRandomBonuses(generateRandomBonuses())
        setSectorBonuses(generateSectorBonuses())
        
        // задачи: учёт спинов
        try {
            const uid = userIdRef.current
            const key = scopedKey('task_spins', uid)
            const spins = Number(localStorage.getItem(key) || localStorage.getItem('task_spins') || '0') + 1
            localStorage.setItem(key, String(spins))
            // keep legacy key for UI components that still read it
            localStorage.setItem('task_spins', String(spins))
            // 50 спинов -> +1000 W
            if (spins === 50) {
                saveBalances(balanceW + 1000, balanceB, `Task reward: 1000 W for 50 spins`)
                setToast('+1000 W (за 50 спинов)')
            }
            // 100 спинов -> +1 B
            if (spins === 100) {
                saveBalances(balanceW, balanceB + 1, `Task reward: 1 B for 100 spins`)
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
        (async () => {
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
                    if (u.id) {
                        const numericId = Number(u.id)
                        setUserId(numericId)

                        // Загружаем список друзей с сервера
                        try {
                            const API_BASE = 'https://speen-server.onrender.com'
                            const res = await fetch(`${API_BASE}/api/referrals/my/${numericId}`)
                            if (res.ok) {
                                const data = await res.json()
                                if (Array.isArray(data?.items)) {
                                    setFriends(data.items)
                                }
                            }
                        } catch {
                            // при ошибке пока просто оставляем пустой список
                        }
                    }

                    // Попробуем подтянуть баланс из CloudStorage, чтобы синхронизировать между устройствами
                    try {
                        const cloud = tg?.CloudStorage
                        if (cloud && u.id) {
                            const uid = Number(u.id)
                            const perUserKey = uid ? `speen_balance_v1_${uid}` : 'speen_balance_v1'
                            cloud.getItem(perUserKey, (err: any, value: string | null) => {
                                const handle = (raw: string | null) => {
                                    if (!raw) return
                                    try {
                                        const parsed = JSON.parse(raw)
                                        const w = typeof parsed?.balanceW === 'number' ? parsed.balanceW : null
                                        const b = typeof parsed?.balanceB === 'number' ? parsed.balanceB : null
                                        if (w != null && b != null) {
                                            // Округляем до целых чисел при загрузке
                                            saveBalances(Math.floor(w), Math.floor(b), 'CloudStorage load')
                                        }
                                    } catch {}
                                }
                                if (err || !value) {
                                    // fallback to legacy key (migration)
                                    cloud.getItem('speen_balance_v1', (_e2: any, legacy: string | null) => handle(legacy))
                                    return
                                }
                                handle(value)
                            })
                            
                            // Проверка блокировки игры на нескольких устройствах
                            cloud.getItem('speen_active_device', (err: any, value: string | null) => {
                                try {
                                    const now = Date.now()
                                    const currentDeviceId = deviceIdRef.current

                                    if (!err && value) {
                                        const activeDevice = JSON.parse(value)
                                        const activeDeviceId = activeDevice?.deviceId
                                        const lastActivity = activeDevice?.lastActivity || 0
                                        const TIMEOUT_MS = 5 * 1000 // 5 секунд бездействия

                                        // Если игра запущена на другом устройстве и оно активно (было активно менее 5 секунд назад)
                                        if (activeDeviceId && activeDeviceId !== currentDeviceId && (now - lastActivity) < TIMEOUT_MS) {
                                            setIsGameBlocked(true)
                                            setIsLoading(false)
                                            return
                                        }
                                    }

                                    // Записываем текущее устройство как активное (даже при ошибке CloudStorage)
                                    cloud.setItem('speen_active_device', JSON.stringify({
                                        deviceId: currentDeviceId,
                                        lastActivity: now
                                    }), () => {})
                                } catch (e) {
                                    // При ошибке CloudStorage все равно разрешаем игру
                                    console.warn('CloudStorage error in multi-device check:', e)
                                } finally {
                                    // Всегда завершаем загрузку
                                    setIsLoading(false)
                                }
                            })
                        }
                    } catch {}
                }

                // Обработка старта по реф-ссылке (ref_XXXX)
                const startParam = tg?.initDataUnsafe?.start_param || new URLSearchParams(window.location.search).get('tgWebAppStartParam')
                const curId: number | null = tg?.initDataUnsafe?.user?.id ? Number(tg.initDataUnsafe.user.id) : null
                if (startParam && String(startParam).startsWith('ref_') && curId) {
                    const inviterId = Number(String(startParam).slice(4))
                    if (inviterId && inviterId !== curId) {
                        const inviteeName = (u?.username || '') || (u?.first_name ? `${u.first_name}${u?.last_name ? ' ' + u.last_name : ''}` : 'Player')
                        const API_BASE = 'https://speen-server.onrender.com'
                        try {
                            const res = await fetch(`${API_BASE}/api/referrals/register`, {
                                method:'POST',
                                headers:{ 'Content-Type':'application/json' },
                                body: JSON.stringify({
                                    inviter_id: inviterId,
                                    friend_id: curId,
                                    name: inviteeName,
                                    photo: u?.photo_url || null
                                })
                            })
                            if (res.ok) {
                                const data = await res.json()
                                if (data?.shouldReward && typeof data.rewardW === 'number' && data.rewardW > 0) {
                                    // Начисляем бонус другу (текущему пользователю)
                                    saveBalances(balanceW + data.rewardW, balanceB)
                                    setToast(`+${data.rewardW} W за приглашение`)
                                }
                            }
                        } catch {
                            // тихо игнорируем ошибки сети
                        }
                    }
                }
            } catch {}
        })()
    }, [])

    // Периодическое обновление активности устройства и очистка при закрытии
    React.useEffect(() => {
        if (isGameBlocked || !userId) return
        
        const tg = (window as any).Telegram?.WebApp
        const cloud = tg?.CloudStorage
        if (!cloud) return

        const currentDeviceId = deviceIdRef.current
        
        // Периодически обновляем активность (каждые 30 секунд)
        const activityInterval = setInterval(() => {
            cloud.getItem('speen_active_device', (err: any, value: string | null) => {
                if (!err && value) {
                    try {
                        const activeDevice = JSON.parse(value)
                        // Обновляем только если это наше устройство
                        if (activeDevice?.deviceId === currentDeviceId) {
                            cloud.setItem('speen_active_device', JSON.stringify({
                                deviceId: currentDeviceId,
                                lastActivity: Date.now()
                            }), () => {})
                        }
                    } catch {}
                }
            })
        }, 30000)
        
        // Очистка при закрытии игры
        const handleBeforeUnload = () => {
            cloud.getItem('speen_active_device', (err: any, value: string | null) => {
                if (!err && value) {
                    try {
                        const activeDevice = JSON.parse(value)
                        // Освобождаем слот только если это наше устройство
                        if (activeDevice?.deviceId === currentDeviceId) {
                            cloud.setItem('speen_active_device', JSON.stringify({
                                deviceId: null,
                                lastActivity: 0
                            }), () => {})
                        }
                    } catch {}
                }
            })
        }
        
        // Очистка при потере фокуса (переключение вкладки/приложения)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // При скрытии вкладки не освобождаем сразу, но можно добавить таймаут
            }
        }
        
        window.addEventListener('beforeunload', handleBeforeUnload)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        return () => {
            clearInterval(activityInterval)
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            handleBeforeUnload()
        }
    }, [isGameBlocked, userId])

    // Предзагрузка критических изображений
    React.useEffect(() => {
        const criticalImages = [
            '/wheel.png',
            '/coin-w.png',
            '/center.png',
            '/centerspin.png',
            '/bonus.png',
            '/plus.png',
            '/satting.png',
            '/zad.png',
            '/bank.png',
            '/shop.png',
            // Иконки левого меню
            '/press1.png',
            '/press2.png',
            '/press3.png',
            '/press4.png',
            '/press5.png',
            '/press6.png',
            '/friends.png',
            '/nagrada days.png',
            '/reiting.png',
            '/lev bonus.png',
            // Иконки правого меню
            '/press7.png',
            '/press8.png',
            '/press9.png',
            '/press10.png',
            '/press11.png',
            '/coming1.png'
        ]
        
        let loadedCount = 0
        const totalImages = criticalImages.length
        
        const loadImage = (src: string): Promise<void> => {
            return new Promise((resolve) => {
                const img = new Image()
                img.onload = () => {
                    loadedCount++
                    if (loadedCount === totalImages) {
                        // Небольшая задержка для плавности
                        setTimeout(() => setIsLoading(false), 300)
                    }
                    resolve()
                }
                img.onerror = () => {
                    loadedCount++
                    if (loadedCount === totalImages) {
                        setTimeout(() => setIsLoading(false), 300)
                    }
                    resolve()
                }
                img.src = src
            })
        }
        
        Promise.all(criticalImages.map(loadImage))
    }, [])

    // Защита от "вечной" загрузки: через 8 секунд принудительно скрываем прелоадер
    React.useEffect(() => {
        const safetyTimeout = window.setTimeout(() => {
            setIsLoading(false)
        }, 8000)
        return () => {
            window.clearTimeout(safetyTimeout)
        }
    }, [])

    // Блокирующий экран для случая, когда игра запущена на другом устройстве
    if (isGameBlocked) {
        return (
            <div style={{
                ...root,
                display: 'grid',
                placeItems: 'center',
                padding: 20,
                background: 'linear-gradient(180deg, #68b1ff 0%, #3f7ddb 60%, #2e63bf 100%)'
            }}>
                <div style={{
                    background: 'linear-gradient(180deg, #2a67b7 0%, #1a4b97 100%)',
                    borderRadius: 24,
                    padding: 32,
                    boxShadow: 'inset 0 0 0 3px #0b2f68, 0 12px 32px rgba(0,0,0,0.4)',
                    maxWidth: '90%',
                    textAlign: 'center',
                    display: 'grid',
                    gap: 20
                }}>
                    <div style={{ fontSize: 64, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>📱</div>
                    <div style={{
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: 24,
                        letterSpacing: 1.2,
                        textShadow: '0 2px 4px rgba(0,0,0,0.35)'
                    }}>
                        {lang === 'ru' ? 'Игра запущена на другом устройстве' : 'Game is running on another device'}
                    </div>
                    <div style={{
                        color: '#e8f1ff',
                        fontSize: 16,
                        lineHeight: 1.5,
                        fontWeight: 700
                    }}>
                        {lang === 'ru' 
                            ? 'Игра уже активна на другом устройстве. Закройте игру там, чтобы продолжить здесь.'
                            : 'The game is already active on another device. Close it there to continue here.'}
                    </div>
                </div>
            </div>
        )
    }

    React.useEffect(() => {
        console.log('[GameScreen] mounted v0.1.6 (Render debug)');
    }, []);

    return (
        <>
            {isLoading && <Preloader />}
            {onboardingOpen && (
                <div style={overlayDimModal} onClick={() => { /* блокируем закрытие кликом по оверлею */ }}>
                    <div
                        style={{
                            ...inviteSheet,
                            width:'92%',
                            maxWidth: 520,
                            height: '88vh',
                            animation: onboardingAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards',
                        }}
                        onClick={(e)=>e.stopPropagation()}
                    >
                        <OnboardingPanel
                            lang={lang}
                            onFinish={() => {
                                // Помечаем онбординг как завершённый
                                try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
                                // фиксируем в stats, чтобы уровень 1 считался достигнутым по условию
                                try { bumpStats({ onboardingDone: 1 }) } catch {}
                                // Если игрок был на уровне 0 (регистрация), поднимаем до 1 уровня после того,
                                // как он прочитал и принял условия в последнем шаге онбординга.
                                if (playerLevel < 1) {
                                    persistLevel(1)
                                } else {
                                    // всё равно синкаем прогресс, чтобы сервер знал про завершение онбординга
                                    scheduleProgressSync()
                                }
                                triggerHaptic('success')
                                setOnboardingAnimatingOut(true)
                                setTimeout(() => {
                                    setOnboardingOpen(false)
                                    setOnboardingAnimatingOut(false)
                                }, 320)
                            }}
                        />
                    </div>
                </div>
            )}
            <div style={{...root, opacity: isLoading ? 0 : 1, transition: 'opacity 300ms ease', pointerEvents: isLoading ? 'none' : 'auto'}}>
            <div style={topBar}>
                <div style={leftUser}>
                    <div style={avatar}>
                        {avatarUrl
                            ? <img src={avatarUrl} alt="avatar" style={avatarImg} onError={() => setAvatarUrl('')} />
                            : <span style={avatarText}>{initials || '🧑'}</span>
                        }
                    </div>
                    <div style={{display:'grid'}}>
                        <div style={usernameRow}>
                            <div style={usernameStyle}>{username || 'Игрок'}</div>
                        </div>
                        <div style={levelStyle}>{playerLevel} lvl</div>
                    </div>
                </div>
                <div style={balances}>
                    <div style={balanceRow}><img src="/coin-w.png" alt="W" style={coinImg} /> <span style={{marginLeft: 6}}>{balanceW}</span></div>
                    <div style={balanceRow}><img src="/Bcoin.png" alt="B" style={coinImg} /> <span style={{marginLeft: 6}}>{balanceB}</span></div>
                </div>
                {/* Прозрачная кнопка для теста (добавляет 1000 W и 1000 B) */}
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
                        saveBalances(balanceW + 1000, balanceB + 1000, 'Test button: +1000 W and +1000 B')
                        setToast('+1000 W и +1000 B (тест)')
                    }}
                />
            </div>
            <div style={content} ref={contentRef}>
                {(!isMenuOpen && !isRightMenuOpen) ? (
                    <>
                        <div ref={panelsRef} style={{...panelsWrap, pointerEvents: (spinning || (mode === 'pyramid' && pyramidSpinCount > 0)) ? 'none' : 'auto', opacity: (spinning || (mode === 'pyramid' && pyramidSpinCount > 0)) ? .6 : 1}}>
                            {/* Row 1: режим игры (с фоном панели) */}
                            <PanelShell>
                                <div style={rowGrid}>
                                    <Arrow onClick={() => { if (mode === 'pyramid' && pyramidSpinCount > 0) return; setMode(prev => prev==='normal'?'allin': prev==='pyramid'?'normal':'pyramid')} } dir="left" />
                                    <div style={controlBoxText}>{mode==='normal' ? 'x2' : mode==='pyramid' ? (lang==='ru' ? '3 из 10' : '3 of 10') : 'x5'}</div>
                                    <Arrow onClick={() => { if (mode === 'pyramid' && pyramidSpinCount > 0) return; setMode(prev => prev==='normal'?'pyramid': prev==='pyramid'?'allin':'normal')} } dir="right" />
                                </div>
                                <div
                                    onClick={() => { if (mode === 'pyramid' && pyramidSpinCount > 0) return; setSettingsOpen(true) }}
                                    style={{ position:'absolute', right:-52, top:'30%', transform:'translateY(-50%)', width:44, height:44, display:'grid', placeItems:'center', cursor: (mode === 'pyramid' && pyramidSpinCount > 0) ? 'default' : 'pointer' }}
                                >
                                    <img src="/satting.png" alt="settings" style={{width:'36px',height:'36px',objectFit:'contain', filter:'drop-shadow(0 4px 6px rgba(0,0,0,0.25))', opacity: (mode === 'pyramid' && pyramidSpinCount > 0) ? 0.5 : 1}} />
                                </div>
                            </PanelShell>
                            {/* Row 2: валюта */}
                            <PanelShell>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                                    <div style={{...currencyCell, background: currency==='W' ? '#ffffff' : 'linear-gradient(180deg, #9cc9ff 0%, #7db6ff 100%)', opacity: (mode === 'pyramid' && pyramidSpinCount > 0) ? 0.5 : 1, cursor: (mode === 'pyramid' && pyramidSpinCount > 0) ? 'default' : 'pointer'}} onClick={() => { if (mode === 'pyramid' && pyramidSpinCount > 0) return; setCurrency('W')}}>
                                        <div style={{fontWeight:900, fontSize:18, color:'#2b66b9'}}>W</div>
                                    </div>
                                    <div style={{...currencyCell, background: currency==='B' ? '#ffffff' : 'linear-gradient(180deg, #9cc9ff 0%, #7db6ff 100%)', opacity: (mode === 'pyramid' && pyramidSpinCount > 0) ? 0.5 : 1, cursor: (mode === 'pyramid' && pyramidSpinCount > 0) ? 'default' : 'pointer'}} onClick={() => { if (mode === 'pyramid' && pyramidSpinCount > 0) return; setCurrency('B')}}>
                                        <div style={{fontWeight:900, fontSize:18, color:'#2b66b9'}}>B</div>
                                    </div>
                                </div>
                            </PanelShell>
                            {/* Row 3: ставка */}
                            <PanelShell>
                                <div style={rowGrid}>
                                    <RoundBtn onClick={() => { if (mode === 'pyramid' && pyramidSpinCount > 0) return; setBet(b => {
                                        const {min} = getLimits(mode, currency)
                                        const baseMin = Math.max(100, min)
                                        const cur = Math.max(baseMin, Math.floor(b || baseMin))
                                        const next = cur - 100
                                        return Math.max(baseMin, next)
                                    })}} kind="minus" />
                                    <div style={controlBoxText}>{bet}</div>
                                    <RoundBtn onClick={() => { if (mode === 'pyramid' && pyramidSpinCount > 0) return; setBet(b => {
                                        const {max} = getLimits(mode, currency)
                                        const baseMin = Math.max(100, getLimits(mode, currency).min)
                                        const cur = Math.max(baseMin, Math.floor(b || baseMin))
                                        const next = cur + 100
                                        return Math.min(max, next)
                                    })}} kind="plus" />
                                </div>
                            </PanelShell>

                            {/* Mid W ticker */}
                            <div style={midCounterShell}>
                            <div style={midCounterInner}>
                                    <div 
                                        style={{position:'relative', width:48, height:48, display:'grid', placeItems:'center', cursor: (mode === 'pyramid' && pyramidSpinCount > 0) ? 'default' : 'pointer', opacity: (mode === 'pyramid' && pyramidSpinCount > 0) ? 0.5 : 1}}
                                        onClick={() => {
                                            if (mode === 'pyramid' && pyramidSpinCount > 0) return;
                                            if (playerLevel < 5) {
                                                setToast(lang === 'ru' ? 'Активируется на 5 lvl' : 'Activates at level 5')
                                                return
                                            }
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
                                    <div style={midValue}>{playerLevel < 5 ? '0.00' : midW.toFixed(2)}</div>
                                    
                                </div>
                            </div>
                        </div>
                         <div style={{
                             position:'absolute', 
                             left: '50%', 
                             bottom: 2,
                             transform:'translateX(-50%)',
                             paddingLeft: 4,
                             paddingRight: 4,
                             paddingBottom: 4,
                             display:'flex',
                             alignItems:'center',
                             justifyContent:'center',
                             zIndex: 1,
                             pointerEvents: 'none'
                         }}>
                             <div style={{ pointerEvents: 'auto' }}>
                                 <ImageWheel 
                                    ref={wheelRef}
                                    size={wheelSize}
                                    imageSrc="/wheel.png" 
                                    labels={["0","1","2","3","4","5","6","7","8","9"]}
                                    onBeforeSpin={onBeforeSpin}
                                    onResult={onSpinResult}
                                    selectedIndex={pickedDigit}
                                    onSelectIndex={(idx)=> setPickedDigit(idx)}
                                    onSpinningChange={(v) => { 
                                        if (v) { 
                                            // Спин начался
                                            setSpinning(true)
                                            setIsMenuOpen(false); 
                                            setIsRightMenuOpen(false) 
                                        } else {
                                            // Спин завершился
                                            console.log(`[onSpinningChange] Spin finished. extraSpinsRemaining: ${extraSpinsRemainingRef.current}, extraSpinInFlight: ${extraSpinInFlightRef.current}, isExtraSpin: ${isExtraSpinRef.current}`)
                                            
                                            // Проверяем, был ли это дополнительный спин от батарейки
                                            const wasExtraSpin = isExtraSpinRef.current
                                            
                                            // Если это был дополнительный спин, сбрасываем флаг
                                            if (wasExtraSpin) {
                                                isExtraSpinRef.current = false
                                                // После завершения дополнительного спина сбрасываем флаг полета
                                                extraSpinInFlightRef.current = false
                                                console.log('[onSpinningChange] Extra spin completed, resetting extraSpinInFlightRef')
                                            }
                                            
                                            // Проверяем, есть ли еще активные дополнительные спины
                                            // После сброса extraSpinInFlightRef проверяем только extraSpinsRemainingRef
                                            if (extraSpinsRemainingRef.current > 0) {
                                                console.log('[onSpinningChange] Extra spins still pending, keeping spinning state')
                                                // Не сбрасываем spinning - оно будет сброшено после завершения последнего дополнительного спина
                                            } else {
                                                // Все спины завершены - сбрасываем все флаги
                                                console.log('[onSpinningChange] All spins completed, resetting flags and spinning state')
                                                setSpinning(false)
                                                
                                                // Сбрасываем все флаги батарейки
                                                batteryUsedRef.current = false
                                                extraSpinInFlightRef.current = false
                                                extraSpinsRemainingRef.current = 0
                                                setExtraSpinsRemaining(0)
                                                
                                                // Батарейка уже была удалена из инвентаря в onSpinResult перед запуском дополнительного спина
                                            }
                                        }
                                    }}
                                     onOpenBonuses={() => setBonusesOpen(true)}
                                     selectedBonusIndex={(playerLevel >= BONUS_WHEEL_UNLOCK_LEVEL) ? selectedBonusSector : null}
                                     onSelectBonusSector={(playerLevel >= BONUS_WHEEL_UNLOCK_LEVEL) ? ((idx: number) => { setSelectedBonusSector(idx) }) : undefined}
                                     hideCenterButton={mode === 'pyramid' && pyramidSpinCount > 0 && pyramidSpinCount <= 3}
                                     disableSelection={mode === 'pyramid' && pyramidSpinCount > 0}
                                     sectorBonuses={(playerLevel >= BONUS_WHEEL_UNLOCK_LEVEL) ? sectorBonuses : []}
                                     selectedBonusImage={selectedBonusBucket !== null && selectedBonusBucket >= 0 ? BONUS_IMAGES[selectedBonusBucket] : null} />
                             </div>
                        </div>
                        {pyramidShowResults && pyramidResults.length >= 3 && (
                            <div style={bonusOverlay} onClick={() => { setPyramidShowResults(false); setPyramidSpinCount(0); setPyramidResults([]) }}>
                                <div style={bonusSheet} onClick={(e)=>e.stopPropagation()}>
                                    <div style={bonusHeader}>Результаты 3/10</div>
                                    <div style={{color:'#fff', textAlign:'center', marginBottom:20, fontSize:18, fontWeight:700}}>
                                        <div style={{marginBottom:15, padding:'12px', background:'rgba(255,255,255,0.1)', borderRadius:12}}>
                                            <div style={{marginBottom:8, fontSize:16, opacity:0.9}}>Выбрано:</div>
                                            <div style={{color:'#ffe27a', fontSize:48, fontWeight:900, textShadow:'0 2px 8px rgba(0,0,0,0.5)'}}>{pickedDigit}</div>
                                        </div>
                                        <div style={{marginBottom:15, padding:'12px', background:'rgba(255,255,255,0.1)', borderRadius:12}}>
                                            <div style={{marginBottom:8, fontSize:16, opacity:0.9}}>Выпало:</div>
                                            <div style={{display:'flex', gap:12, justifyContent:'center', alignItems:'center', flexWrap:'wrap'}}>
                                                {pyramidResults.map((num, idx) => (
                                                    <div 
                                                        key={idx}
                                                        style={{
                                                            width:50,
                                                            height:50,
                                                            borderRadius:'50%',
                                                            background: num === pickedDigit 
                                                                ? 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)' 
                                                                : 'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
                                                            display:'grid',
                                                            placeItems:'center',
                                                            fontSize:28,
                                                            fontWeight:900,
                                                            color:'#fff',
                                                            boxShadow: num === pickedDigit 
                                                                ? '0 4px 12px rgba(34, 197, 94, 0.5), inset 0 0 0 3px #0b2f68' 
                                                                : '0 4px 12px rgba(0,0,0,0.3), inset 0 0 0 3px #0b2f68',
                                                            border: num === pickedDigit ? '2px solid #ffe27a' : 'none'
                                                        }}
                                                    >
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{display:'grid', placeItems:'center'}}>
                                        <button style={bonusCloseBtn} onClick={() => { setPyramidShowResults(false); setPyramidSpinCount(0); setPyramidResults([]) }}>{t('close')}</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {bonusesOpen && (
                            <div style={bonusOverlay} onClick={() => setBonusesOpen(false)}>
                                <div style={bonusSheet} onClick={(e)=>e.stopPropagation()}>
                                    <div style={bonusHeader}>{t('choose_bonus')}</div>
                                    <div style={{...bonusGrid, gridTemplateColumns:'repeat(3, 1fr)'}}>
                                         {BONUS_LABELS.map((b, i) => {
                                            const bonusNames: Record<string, string> = {
                                                'Heart': 'Сердце',
                                                'Battery': 'Батарейка',
                                                'Rocket': 'Ракета'
                                            }
                                            const bonusDescriptions: Record<string, string> = {
                                                'Heart': 'Сохраняет деньги при проигрыше',
                                                'Battery': 'Дополнительное вращение (2 раза)',
                                                'Rocket': 'Удваивает выигрыш'
                                            }
                                            return (
                                            <div
                                                key={i}
                                                style={{
                                                     ...bonusCard,
                                                     boxShadow: selectedBonusBucket===i ? 'inset 0 0 0 3px #22c55e' : bonusCard.boxShadow as string
                                                }}
                                                 onClick={()=>{
                                                    const label = bonusNames[b] || b
                                                    // Повторный клик по уже выбранному бонусу — снимает выбор
                                                    if (selectedBonusBucket === i) {
                                                        setSelectedBonusBucket(null)
                                                        setBonusesOpen(false)
                                                        setToast(`Бонус снят: ${label}`)
                                                        return
                                                    }
                                                    // Проверяем наличие бонуса в инвентаре
                                                    try {
                                                        const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                                                        const inv: string[] = JSON.parse(invRaw)
                                                        const count = inv.filter(x => x === b).length
                                                        if (count === 0) {
                                                            setToast(`Бонус "${label}" отсутствует в инвентаре`)
                                                            return
                                                        }
                                                        setSelectedBonusBucket(i); 
                                                        setBonusesOpen(false); 
                                                        setToast(`Выбран бонус: ${label}`)
                                                    } catch {
                                                        setToast('Ошибка при выборе бонуса')
                                                    }
                                                 }}
                                            >
                                                <img src={BONUS_IMAGES[i]} alt={b} style={{width:36,height:36,objectFit:'contain'}} />
                                                <div style={{fontWeight:800, color:'#fff', fontSize:12}}>{bonusNames[b] || b}</div>
                                                <div style={{fontSize:10, color:'#e8f1ff', fontWeight:700, opacity:.8, textAlign:'center', marginTop:2}}>{bonusDescriptions[b] || ''}</div>
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
                                            )
                                        })}
                                    </div>
                                    <div style={{display:'grid', placeItems:'center', marginTop:10}}>
                                        <button style={bonusCloseBtn} onClick={()=>setBonusesOpen(false)}>{t('close')}</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                    </>
                ) : (
                        <div style={{padding:12}}>
                    <div style={isMenuOpen ? menuList : menuListRight}>
                        {(isMenuOpen ? createMenuItemsLeft(t) : createMenuItemsRight(t)).map((item, idx) => (
                                <div
                                    key={`${isMenuOpen ? 'L' : 'R'}:${idx}`}
                                    style={{...(isMenuOpen ? menuCard : menuCardRight), transform: pressedCardIdx===idx ? 'translateY(2px) scale(0.98)' : 'none'}}
                                    onPointerDown={() => setPressedCardIdx(idx)}
                                    onPointerUp={() => setPressedCardIdx(null)}
                                    onPointerLeave={() => setPressedCardIdx(null)}
                                onClick={() => {
                                    const left = isMenuOpen
                                    const act = (item as any).action
                                    const title = (item as any).title
                                    console.log('[Menu] onClick triggered, left:', left, 'action:', act, 'item:', item)
                                    triggerHaptic('impact')
                                    if (left) {
                                        console.log('[Menu] Left menu branch, act:', act)
                                        if (act === 'invite') setInviteOpen(true)
                                        if (act === 'daily') setDailyOpen(true)
                                        if (act === 'shop') setShopOpen(true)
                                        const isLevelsItem = act === 'levels' || (title && (title.includes('Повысил уровень') || title.includes('Leveled up')))
                                        if (isLevelsItem) {
                                            console.log('[Levels] Opening levels panel from left menu')
                                            try {
                                                setLevelsAnimatingOut(false)
                                                setLevelsOpen(true)
                                                console.log('[Levels] levelsOpen set to true')
                                            } catch (err) {
                                                console.error('[Levels] Error opening levels panel:', err)
                                                setLevelsOpen(true)
                                            }
                                        }
                                        if (act === 'leaderboard') {
                                            // Перед открытием рейтинга отправляем текущие данные игрока
                                            updateLeaderboard(balanceW, balanceB)
                                            setLeaderboardOpen(true)
                                        }
                                            if (act === 'ton') { openTonConnect(); return }
                                            if (act === 'telegram_group') {
                                                const tg = (window as any).Telegram?.WebApp
                                                const url = 'https://t.me/wheel_777'
                                                if (tg?.openTelegramLink) {
                                                    tg.openTelegramLink(url)
                                                } else {
                                                    window.open(url, '_blank')
                                                }
                                                return
                                            }
                                        } else {
                                        console.log('[Menu] Right menu branch, act:', act)
                                        if (act === 'wheelshop') setWheelShopOpen(true)
                                        if (act === 'tasks') setTasksOpen(true)
                                        if (act === 'news') setNewsOpen(true)
                                        const isLevelsItem = act === 'levels' || (title && (title.includes('Повысил уровень') || title.includes('Leveled up')))
                                        if (isLevelsItem) {
                                            console.log('[Levels] Opening levels panel from right menu, act:', act, 'title:', title)
                                            try {
                                                setLevelsAnimatingOut(false)
                                                setLevelsOpen(true)
                                                console.log('[Levels] levelsOpen set to true')
                                            } catch (err) {
                                                console.error('[Levels] Error opening levels panel:', err)
                                                setLevelsOpen(true)
                                            }
                                        }
                                    }
                                }}
                                >
                                    {/* Глобально убираем бейдж "coming soon" в нижнем меню */}
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
            <div style={{...bottomNav, pointerEvents: (spinning || (mode === 'pyramid' && pyramidSpinCount > 0)) ? 'none' : 'auto', opacity: (spinning || (mode === 'pyramid' && pyramidSpinCount > 0)) ? .6 : 1}}>
                <div
                    style={{...navBtn, ...(isMenuOpen && !isRightMenuOpen ? navBtnActive : {})}}
                    onClick={() => {
                        if (spinning || (mode === 'pyramid' && pyramidSpinCount > 0)) return
                        setIsRightMenuOpen(false)
                        setIsMenuOpen(true)
                    }}
                >
                    <img src="/zad.png" alt="Задания" style={navIcon} />
                </div>
                <div
                    style={{...navBtn, ...(!isMenuOpen && !isRightMenuOpen ? navBtnActive : {})}}
                    onClick={() => { if (spinning || (mode === 'pyramid' && pyramidSpinCount > 0)) return; setIsMenuOpen(false); setIsRightMenuOpen(false) }}
                >
                    <img src="/bank.png" alt="Банк" style={navIcon} />
                </div>
                <div
                    style={{...navBtn, ...(isRightMenuOpen ? navBtnActive : {})}}
                    onClick={() => {
                        if (spinning || (mode === 'pyramid' && pyramidSpinCount > 0)) return
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
                            <div style={menuHeaderTitle}>{t('topup_stars')}</div>
                            <button style={sheetCloseArrow} onClick={()=>{ triggerHaptic('impact'); setStarsOpen(false) }}>✕</button>
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
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setInviteAnimatingOut(true); setTimeout(()=>{ setInviteOpen(false); setInviteAnimatingOut(false); setInviteInfoOpen(false) }, 320) }}>
                    <div style={{...inviteSheetInvite, height:`${inviteHeightVh}vh`, animation: inviteAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards' }} onClick={(e) => e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ inviteDragStartY.current = e.clientY; inviteDragStartTs.current=Date.now(); inviteDragStartHeightVh.current = inviteHeightVh; inviteLastY.current=e.clientY; inviteLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (inviteDragStartY.current==null) return; const dy = inviteDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, inviteDragStartHeightVh.current + dy/(window.innerHeight/100))); setInviteHeightVh(vh); inviteLastY.current=e.clientY; inviteLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (inviteDragStartY.current==null) return; const totalDy = inviteDragStartY.current - (inviteLastY.current || inviteDragStartY.current); const dt = Math.max(1, Date.now() - (inviteDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setInviteAnimatingOut(true); setTimeout(()=>{ setInviteOpen(false); setInviteAnimatingOut(false); setInviteInfoOpen(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-inviteHeightVh)<Math.abs(a-inviteHeightVh)?b:a,snaps[0]); setInviteHeightVh(next); triggerHaptic('impact') } inviteDragStartY.current=null }}
                            onPointerCancel={()=>{ inviteDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <div style={{position:'relative', width:'100%', height:'100%', overflowY:'auto', padding:'10px', boxSizing:'border-box', display:'flex', flexDirection:'column', alignItems:'center'}}>
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
                            const wrap: React.CSSProperties = { 
                                background:'linear-gradient(180deg,#163b78 0%, #0b2f68 100%)', 
                                borderRadius:22, 
                                padding:18, 
                                boxShadow:'inset 0 0 0 4px rgba(140,188,255,0.6), 0 12px 30px rgba(0,0,0,0.35)', 
                                width:'100%', 
                                maxWidth:'100%',
                                margin:'0 auto', 
                                position:'relative',
                                display:'grid',
                                gap:12,
                                boxSizing:'border-box'
                            }
                            return (
                                <div style={wrap}>
                                    <div style={{display:'grid', placeItems:'center'}}>
                                        <img src="/friends.png" alt="friends" style={inviteHeroImg} />
                                    </div>
                                    <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:8}}>
                                        <div style={inviteTitleLarge}>{t('invite_title')}</div>
                                        <button 
                                            style={{ 
                                                width:24, height:24, borderRadius:'50%', 
                                                border:'2px solid rgba(255,255,255,0.5)', 
                                                background:'rgba(255,255,255,0.2)', 
                                                color:'#fff', fontWeight:900, fontSize:14, 
                                                display:'grid', placeItems:'center', cursor:'pointer' 
                                            }}
                                            onClick={() => setInviteInfoOpen(true)}
                                        >
                                            i
                                        </button>
                                    </div>
                                    <button style={inviteCtaPill} onClick={handleShare}>
                                        <img src="/coin-w.png" alt="coin" style={{width:26,height:26, filter:'drop-shadow(0 4px 6px rgba(0,0,0,0.25))'}} />
                                        <span style={{marginLeft:10}}>{t('invite_cta')}</span>
                                    </button>
                                    
                                    {/* Счётчик приглашённых друзей с иконкой достижения */}
                                    <div style={{
                                        display:'flex', 
                                        alignItems:'center', 
                                        justifyContent:'center', 
                                        gap:10,
                                        padding:'12px 16px',
                                        background:'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.15))',
                                        borderRadius:16,
                                        boxShadow:'inset 0 0 0 2px rgba(255,215,0,0.4)',
                                        marginTop:8
                                    }}>
                                        <div style={{
                                            fontSize:32,
                                            filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                        }}>🏆</div>
                                        <div style={{display:'grid', gap:2}}>
                                            <div style={{color:'#ffd700', fontWeight:900, fontSize:18, textShadow:'0 1px 2px rgba(0,0,0,0.4)'}}>
                                                {friends.length} {lang==='ru' ? (friends.length === 1 ? 'друг' : friends.length < 5 ? 'друга' : 'друзей') : (friends.length === 1 ? 'friend' : 'friends')}
                                            </div>
                                            <div style={{color:'#ffe27a', fontSize:12, fontWeight:700, opacity:0.9}}>
                                                {lang==='ru' ? 'Приглашено' : 'Invited'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{display:'grid', placeItems:'center', marginTop:8}}>
                                        <div style={friendsHeaderLbl}>{t('friends_list')}</div>
                                    </div>
                                    <div style={{display:'grid', gap:12}}>
                                        {friends.length === 0 ? (
                                            <div style={{color:'#e8f1ff', textAlign:'center', opacity:.85}}>{t('empty')}</div>
                                        ) : friends.map((f, idx)=> (
                                            <div 
                                                key={`fr-${f.id}`} 
                                                style={{
                                                    ...friendRow,
                                                    animation: `friendSlideIn 400ms ease-out ${idx * 80}ms both`,
                                                    gridTemplateColumns:'56px 1fr auto auto'
                                                }}
                                            >
                                                <div style={friendAvatar}>
                                                    {f.photo ? (
                                                        <img src={f.photo} alt="avatar" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
                                                    ) : (
                                                        <div style={{
                                                            width:'100%',
                                                            height:'100%',
                                                            borderRadius:'50%',
                                                            background:'linear-gradient(135deg, #ffd86b 0%, #f2a93b 100%)',
                                                            boxShadow:'inset 0 0 0 3px #7a4e06',
                                                            display:'grid',
                                                            placeItems:'center',
                                                            fontSize:24,
                                                            fontWeight:900,
                                                            color:'#7a4e06'
                                                        }}>
                                                            {(f.name?.[0] || '?').toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{display:'grid', gap:2}}>
                                                    <div style={friendName}>{f.name || 'Игрок'}</div>
                                                    <div style={{
                                                        color:'#ffe27a',
                                                        fontSize:12,
                                                        fontWeight:700,
                                                        display:'flex',
                                                        alignItems:'center',
                                                        gap:4
                                                    }}>
                                                        <span>⭐</span>
                                                        <span>lvl {f.level || 1}</span>
                                                    </div>
                                                </div>
                                                <div style={friendAmount}>
                                                    <img src="/coin-w.png" alt="c" style={{width:22,height:22,marginRight:6}}/> 
                                                    {typeof f.coins === 'number'
                                                        ? (f.coins >= 1000 ? `${(f.coins/1000).toFixed(1)}K` : f.coins)
                                                        : `${(f.rewardW/1000).toFixed(1)}K`
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })()}
                        </div>
                    </div>
                </div>
            )}
            {inviteInfoOpen && (
                <div style={centerInfoOverlay} onClick={() => setInviteInfoOpen(false)}>
                    <div style={centerInfoCard} onClick={(e)=>e.stopPropagation()}>
                        <div style={{color:'#e8f1ff', textAlign:'center', fontWeight:800, lineHeight:1.4}}>
                            {t('invite_hint')}
                        </div>
                        <div style={{display:'grid', placeItems:'center', marginTop:16}}>
                            <button style={inviteSecondaryBtn} onClick={() => setInviteInfoOpen(false)}>{t('close')}</button>
                        </div>
                    </div>
                </div>
            )}
            {shopOpen && (
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setShopAnimatingOut(true); setTimeout(()=>{ setShopOpen(false); setShopAnimatingOut(false) }, 320) }}>
                    <div style={{...shopSheet, height:`${shopHeightVh}vh`, animation: shopAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ shopDragStartY.current = e.clientY; shopDragStartTs.current=Date.now(); shopDragStartHeightVh.current = shopHeightVh; shopLastY.current=e.clientY; shopLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (shopDragStartY.current==null) return; const dy = shopDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, shopDragStartHeightVh.current + dy/(window.innerHeight/100))); setShopHeightVh(vh); shopLastY.current=e.clientY; shopLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (shopDragStartY.current==null) return; const totalDy = shopDragStartY.current - (shopLastY.current || shopDragStartY.current); const dt = Math.max(1, Date.now() - (shopDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setShopAnimatingOut(true); setTimeout(()=>{ setShopOpen(false); setShopAnimatingOut(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-shopHeightVh)<Math.abs(a-shopHeightVh)?b:a,snaps[0]); setShopHeightVh(next); triggerHaptic('impact') } shopDragStartY.current=null }}
                            onPointerCancel={()=>{ shopDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <ShopPanel
                            t={t}
                            lang={lang}
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
                            onOpenWheelShop={() => {
                                setShopAnimatingOut(true)
                                setTimeout(() => {
                                    setShopOpen(false)
                                    setShopAnimatingOut(false)
                                    setWheelShopOpen(true)
                                }, 300)
                            }}
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
                        <WheelShopPanel
                            t={t}
                            lang={lang}
                            onClose={() => { triggerHaptic('impact'); setWheelAnimatingOut(true); setTimeout(()=>{ setWheelShopOpen(false); setWheelAnimatingOut(false) }, 300) }}
                            bonusLabels={BONUS_LABELS}
                            bonusImages={BONUS_IMAGES}
                            onPurchase={(b) => {
                                if (balanceB < 1) { setToast('Недостаточно B'); return }
                                saveBalances(balanceW, balanceB - 1, `WheelShop purchase: bought bonus "${b}" for 1 B`)
                                try {
                                    const invRaw = localStorage.getItem('bonuses_inv') || '[]'
                                    const inv: string[] = JSON.parse(invRaw)
                                    inv.push(b)
                                    localStorage.setItem('bonuses_inv', JSON.stringify(inv))
                                } catch {}
                                setToast(`Куплено: ${b} за 1 B`)
                            }}
                        />
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
                        <TasksPanel t={t} lang={lang} userId={userId} onClose={() => { triggerHaptic('impact'); setTasksAnimatingOut(true); setTimeout(()=>{ setTasksOpen(false); setTasksAnimatingOut(false) }, 300) }} onShare5={() => {
                            try {
                                const tg = (window as any).Telegram?.WebApp
                                const url = window.location.href
                                const shareText = lang==='ru' ? 'Присоединяйся в игру!' : 'Join the game!'
                                const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`
                                if (tg?.openTelegramLink) tg.openTelegramLink(share)
                                else window.open(share, '_blank')
                            } catch {}
                        }} onReward={(rw)=>{
                            const w = Number(localStorage.getItem('balance_w')||'0') + (rw.W||0)
                            const b = Number(localStorage.getItem('balance_b')||'0') + (rw.B||0)
                            saveBalances(w, b)
                            if (rw.W) setToast(`+${rw.W} W`) 
                            if (rw.B) setToast(`+${rw.B} B`)
                            // level stats: tasks claimed (+B tasks separately)
                            try {
                                const s = levelStatsRef.current
                                bumpStats({
                                    tasksClaimed: (s.tasksClaimed || 0) + 1,
                                    tasksClaimedB: (s.tasksClaimedB || 0) + ((rw.B || 0) > 0 ? 1 : 0),
                                })
                            } catch {}
                        }} />
                    </div>
                </div>
            )}
            {levelsOpen && (() => {
                try {
                    return (
                        <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setLevelsAnimatingOut(true); setTimeout(()=>{ setLevelsOpen(false); setLevelsAnimatingOut(false) }, 320) }}>
                            <div style={{...inviteSheet, height:`${levelsSheetHeightVh}vh`, animation: levelsAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                                <div
                                    style={inviteGrabWrap}
                                    onPointerDown={(e)=>{ levelsDragStartY.current = e.clientY; levelsDragStartTs.current=Date.now(); levelsDragStartHeightVh.current = levelsSheetHeightVh; levelsLastY.current=e.clientY; levelsLastTs.current=Date.now() }}
                                    onPointerMove={(e)=>{ if (levelsDragStartY.current==null) return; const dy = levelsDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, levelsDragStartHeightVh.current + dy/(window.innerHeight/100))); setLevelsSheetHeightVh(vh); levelsLastY.current=e.clientY; levelsLastTs.current=Date.now() }}
                                    onPointerUp={()=>{ if (levelsDragStartY.current==null) return; const totalDy = levelsDragStartY.current - (levelsLastY.current || levelsDragStartY.current); const dt = Math.max(1, Date.now() - (levelsDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setLevelsAnimatingOut(true); setTimeout(()=>{ setLevelsOpen(false); setLevelsAnimatingOut(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-levelsSheetHeightVh)<Math.abs(a-levelsSheetHeightVh)?b:a,snaps[0]); setLevelsSheetHeightVh(next); triggerHaptic('impact') } levelsDragStartY.current=null }}
                                    onPointerCancel={()=>{ levelsDragStartY.current=null }}
                                >
                                    <div style={inviteGrabBar} />
                                </div>
                                <LevelsPanel
                                    t={t}
                                    lang={lang}
                                    onClose={() => { triggerHaptic('impact'); setLevelsAnimatingOut(true); setTimeout(()=>{ setLevelsOpen(false); setLevelsAnimatingOut(false) }, 300) }}
                                    playerLevel={playerLevel}
                                    stats={levelStats}
                                    levels={levelsConfig}
                                    isReady={(lvl) => isLevelRequirementMet(lvl)}
                                    getProgress={(lvl) => getLevelProgress(lvl)}
                                    onClaimLevel={(lvl) => {
                                        tryClaimNextLevel(lvl)
                                    }}
                                />
                            </div>
                        </div>
                    )
                } catch (err) {
                    console.error('Error rendering levels panel:', err)
                    return null
                }
            })()}
            {newsOpen && (
                <div style={overlayDim} onClick={() => setNewsOpen(false)}>
                    <div style={newsPopup} onClick={(e)=>e.stopPropagation()}>
                        <div style={newsPopupHeader}>
                            <div style={newsPopupTitle}>{t('news_title')}</div>
                        </div>
                        <NewsPanel onClose={() => setNewsOpen(false)} isAdmin={userId === 1408757717} lang={lang} />
                    </div>
                </div>
            )}
            {settingsOpen && (
                <div style={overlayDim} onClick={()=> setSettingsOpen(false)}>
                    <div style={newsPopup} onClick={(e)=>e.stopPropagation()}>
                        <div style={newsPopupHeader}>
                            <div style={newsPopupTitle}>{t('settings')}</div>
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
                            t={t}
                            lang={lang}
                            onClose={() => { setDailyAnimatingOut(true); setTimeout(()=>{ setDailyOpen(false); setDailyAnimatingOut(false) }, 300) }}
                            onClaim={(amount) => {
                                saveBalances(balanceW + amount, balanceB)
                                setToast(`+${amount} W за ежедневный вход`)
                                // level stats: daily claims + 7-day cycles
                                try {
                                    const s = levelStatsRef.current
                                    let addCycle = 0
                                    try {
                                        const streak = Number(localStorage.getItem('daily_streak') || '0') || 0
                                        const last = localStorage.getItem('daily_last') || ''
                                        if (streak >= 7 && last) addCycle = 1
                                    } catch {}
                                    bumpStats({
                                        dailyClaims: (s.dailyClaims || 0) + 1,
                                        daily7Cycles: (s.daily7Cycles || 0) + addCycle,
                                    })
                                } catch {}
                                // Окно больше не закрывается автоматически - пользователь сам закроет крестиком
                            }}
                        />
                    </div>
                </div>
            )}
            {leaderboardOpen && (
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setLeaderboardAnimatingOut(true); setTimeout(()=>{ setLeaderboardOpen(false); setLeaderboardAnimatingOut(false) }, 320) }}>
                    <div style={{...inviteSheet, height:`${leaderboardHeightVh}vh`, animation: leaderboardAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ leaderboardDragStartY.current = e.clientY; leaderboardDragStartTs.current=Date.now(); leaderboardDragStartHeightVh.current = leaderboardHeightVh; leaderboardLastY.current=e.clientY; leaderboardLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (leaderboardDragStartY.current==null) return; const dy = leaderboardDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, leaderboardDragStartHeightVh.current + dy/(window.innerHeight/100))); setLeaderboardHeightVh(vh); leaderboardLastY.current=e.clientY; leaderboardLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (leaderboardDragStartY.current==null) return; const totalDy = leaderboardDragStartY.current - (leaderboardLastY.current || leaderboardDragStartY.current); const dt = Math.max(1, Date.now() - (leaderboardDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setLeaderboardAnimatingOut(true); setTimeout(()=>{ setLeaderboardOpen(false); setLeaderboardAnimatingOut(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-leaderboardHeightVh)<Math.abs(a-leaderboardHeightVh)?b:a,snaps[0]); setLeaderboardHeightVh(next); triggerHaptic('impact') } leaderboardDragStartY.current=null }}
                            onPointerCancel={()=>{ leaderboardDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <LeaderboardPanel
                            onClose={() => { setLeaderboardAnimatingOut(true); setTimeout(()=>{ setLeaderboardOpen(false); setLeaderboardAnimatingOut(false) }, 300) }}
                            userId={userId}
                            username={username}
                            avatarUrl={avatarUrl}
                            t={t}
                            lang={lang}
                        />
                    </div>
                </div>
            )}
            {leaderboardOpen && (
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setLeaderboardAnimatingOut(true); setTimeout(()=>{ setLeaderboardOpen(false); setLeaderboardAnimatingOut(false) }, 320) }}>
                    <div style={{...inviteSheet, height:`${leaderboardHeightVh}vh`, animation: leaderboardAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ leaderboardDragStartY.current = e.clientY; leaderboardDragStartTs.current=Date.now(); leaderboardDragStartHeightVh.current = leaderboardHeightVh; leaderboardLastY.current=e.clientY; leaderboardLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (leaderboardDragStartY.current==null) return; const dy = leaderboardDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, leaderboardDragStartHeightVh.current + dy/(window.innerHeight/100))); setLeaderboardHeightVh(vh); leaderboardLastY.current=e.clientY; leaderboardLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (leaderboardDragStartY.current==null) return; const totalDy = leaderboardDragStartY.current - (leaderboardLastY.current || leaderboardDragStartY.current); const dt = Math.max(1, Date.now() - (leaderboardDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setLeaderboardAnimatingOut(true); setTimeout(()=>{ setLeaderboardOpen(false); setLeaderboardAnimatingOut(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-leaderboardHeightVh)<Math.abs(a-leaderboardHeightVh)?b:a,snaps[0]); setLeaderboardHeightVh(next); triggerHaptic('impact') } leaderboardDragStartY.current=null }}
                            onPointerCancel={()=>{ leaderboardDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <LeaderboardPanel
                            onClose={() => { setLeaderboardAnimatingOut(true); setTimeout(()=>{ setLeaderboardOpen(false); setLeaderboardAnimatingOut(false) }, 300) }}
                            userId={userId}
                            username={username}
                            avatarUrl={avatarUrl}
                            t={t}
                            lang={lang}
                        />
                    </div>
                </div>
            )}
            {levelsOpen && (
                <div style={overlayDimModal} onClick={() => { triggerHaptic('impact'); setLevelsAnimatingOut(true); setTimeout(()=>{ setLevelsOpen(false); setLevelsAnimatingOut(false) }, 320) }}>
                    <div style={{...inviteSheet, height:`${levelsSheetHeightVh}vh`, animation: levelsAnimatingOut ? 'bottomSheetDown 300ms ease-out forwards' : 'bottomSheetUp 320ms ease-out forwards'}} onClick={(e)=>e.stopPropagation()}>
                        <div
                            style={inviteGrabWrap}
                            onPointerDown={(e)=>{ levelsDragStartY.current = e.clientY; levelsDragStartTs.current=Date.now(); levelsDragStartHeightVh.current = levelsSheetHeightVh; levelsLastY.current=e.clientY; levelsLastTs.current=Date.now() }}
                            onPointerMove={(e)=>{ if (levelsDragStartY.current==null) return; const dy = levelsDragStartY.current - e.clientY; const vh = Math.max(40, Math.min(90, levelsDragStartHeightVh.current + dy/(window.innerHeight/100))); setLevelsSheetHeightVh(vh); levelsLastY.current=e.clientY; levelsLastTs.current=Date.now() }}
                            onPointerUp={()=>{ if (levelsDragStartY.current==null) return; const totalDy = levelsDragStartY.current - (levelsLastY.current || levelsDragStartY.current); const dt = Math.max(1, Date.now() - (levelsDragStartTs.current||Date.now())); const velocity = (totalDy/dt); if (velocity < -0.8) { triggerHaptic('impact'); setLevelsAnimatingOut(true); setTimeout(()=>{ setLevelsOpen(false); setLevelsAnimatingOut(false) }, 300) } else { const snaps=[40,60,80,90]; const next=snaps.reduce((a,b)=>Math.abs(b-levelsSheetHeightVh)<Math.abs(a-levelsSheetHeightVh)?b:a,snaps[0]); setLevelsSheetHeightVh(next); triggerHaptic('impact') } levelsDragStartY.current=null }}
                            onPointerCancel={()=>{ levelsDragStartY.current=null }}
                        >
                            <div style={inviteGrabBar} />
                        </div>
                        <div style={{position:'relative', width:'100%', height:'100%', overflowY:'auto', padding:'10px', boxSizing:'border-box'}}>
                            <LevelsPanel
                                onClose={() => { setLevelsAnimatingOut(true); setTimeout(()=>{ setLevelsOpen(false); setLevelsAnimatingOut(false) }, 300) }}
                                onClaimLevel={(lvl) => { claimLevelReward(lvl) }}
                                onGoTo={(lvl) => {
                                    // quick navigation to complete current level task
                                    const target = Math.max(0, Math.min(50, Math.floor(lvl)))
                                    // close levels sheet first for cleaner UX
                                    setLevelsAnimatingOut(true)
                                    setTimeout(() => {
                                        setLevelsOpen(false)
                                        setLevelsAnimatingOut(false)
                                        if (target === 3) { setDailyOpen(true); return }
                                        if (target === 4) { setTasksOpen(true); return }
                                        if (target === 5) { setInviteOpen(true); return }
                                        if (target === 6) { setMode('pyramid'); setIsMenuOpen(false); setIsRightMenuOpen(false); return }
                                    }, 260)
                                }}
                                playerLevel={playerLevel}
                                claimedLevel={claimedLevel}
                                stats={levelStats}
                                levels={levelsConfig}
                                isReady={isLevelRequirementMet}
                                getProgress={getLevelProgress}
                                t={t}
                                lang={lang}
                            />
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast text={toast} onClose={() => setToast(null)} />}
            <div style={{ position: 'absolute', bottom: 8, left: 8, color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, zIndex: 10 }}>v0.1.6</div>
        </div>
        </>
    )
}

function Coin(){
    return (
        <img src="/Bcoin.png" alt="B" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }} />
    )
}

function DailyBonus({ onClose, onClaim, t, lang }: { onClose: () => void, onClaim: (amount: number) => void, t: (k:string, vars?: Record<string, any>) => string, lang: 'ru'|'en' }){
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

    const [infoOpen, setInfoOpen] = React.useState(false)

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
    const wrap: React.CSSProperties = { background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)', borderRadius:20, padding:16, boxShadow:'inset 0 0 0 3px #0b2f68', width:'88%', margin:'0 auto', position:'relative' }
    const titleWrap: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:8, position:'relative' }
    const title: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1.2, textShadow:'0 2px 0 rgba(0,0,0,0.35)' }
    const infoBtn: React.CSSProperties = { 
        width:24, height:24, borderRadius:'50%', 
        background:'rgba(255,255,255,0.2)', 
        border:'2px solid rgba(255,255,255,0.4)', 
        color:'#fff', 
        fontWeight:900, 
        fontSize:14, 
        display:'grid', 
        placeItems:'center', 
        cursor:'pointer',
        transition:'all 120ms ease',
        boxShadow:'0 2px 4px rgba(0,0,0,0.2)'
    }
    const descr: React.CSSProperties = { color:'#e8f1ff', textAlign:'center', fontWeight:800, lineHeight:1.35, textShadow:'0 2px 0 rgba(0,0,0,0.35)', margin:'8px 0 14px' }
    const infoModal: React.CSSProperties = {
        position:'fixed', left:0, right:0, top:0, bottom:0,
        background:'rgba(0,0,0,0.7)',
        display:'grid', placeItems:'center',
        zIndex:10000,
        pointerEvents: infoOpen ? 'auto' : 'none',
        opacity: infoOpen ? 1 : 0,
        transition:'opacity 200ms ease'
    }
    const infoModalContent: React.CSSProperties = {
        background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)',
        borderRadius:20,
        padding:20,
        maxWidth:'85%',
        boxShadow:'inset 0 0 0 3px #0b2f68, 0 8px 24px rgba(0,0,0,0.4)',
        transform: infoOpen ? 'scale(1)' : 'scale(0.9)',
        transition:'transform 200ms ease'
    }
    // сетка карточек — чуть ниже заголовка и на всю ширину
    const grid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginTop:12, width:'100%' }
    // основной градиент карточек — более мягкий голубой, чтобы не выбиваться из синей темы
    const cardBase: React.CSSProperties = { background:'linear-gradient(135deg,#cbe6ff 0%, #2a67b7 100%)', borderRadius:22, boxShadow:'0 10px 24px rgba(0,0,0,0.25), inset 0 0 0 3px rgba(11,47,104,0.9)', padding:'12px 10px', display:'grid', placeItems:'center', cursor:'pointer' }
    const dayLbl: React.CSSProperties = { color:'#e8f1ff', fontWeight:900, textShadow:'0 1px 0 rgba(0,0,0,0.35)', marginBottom:6 }
    const amountLbl: React.CSSProperties = { color:'#fff', fontWeight:900, textShadow:'0 1px 0 rgba(0,0,0,0.35)' }
    const day7: React.CSSProperties = { ...cardBase, gridColumn:'1 / -1', borderRadius:36, padding:'16px 12px' }

    const renderCard = (day: number) => {
        const claimed = state.claimedToday && day <= state.current || (!state.claimedToday && day < state.current)
        const isCurrent = !state.claimedToday && day === state.current
        
        // Стили для полученных карточек - серые и потухшие
        const claimedCardBase: React.CSSProperties = {
            ...cardBase,
            background: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
            cursor: 'default'
        }
        const claimedDay7: React.CSSProperties = {
            ...day7,
            background: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
            cursor: 'default'
        }
        
        const cardStyle = claimed && !isCurrent 
            ? (day === 7 ? claimedDay7 : claimedCardBase)
            : (day === 7 ? day7 : cardBase)
        
        const finalStyle = {
            ...cardStyle,
            boxShadow: isCurrent ? '0 0 0 3px #ffd23a, 0 10px 24px rgba(0,0,0,0.25)' : (cardStyle.boxShadow as any),
            position: 'relative' as const
        }
        
        return (
            <div 
                key={day} 
                style={finalStyle as React.CSSProperties} 
                onClick={() => !claimed && handleClaim(day)}
            >
                {claimed && !isCurrent && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 10
                    }}>
                        <span style={{ 
                            color: '#22c55e', 
                            fontSize: 56, 
                            fontWeight: 900, 
                            lineHeight: 1,
                            textShadow: '0 0 4px #0b2f68, 0 0 10px rgba(0,0,0,0.7)' 
                        }}>✓</span>
                    </div>
                )}
                <div style={dayLbl}>{`${t('day')} ${day}`}</div>
                <div style={{display:'grid', placeItems:'center', marginBottom:6}}>
                    <img src="/coin-w.png" alt="coin" style={{width:32,height:32,filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.25))'}} />
                </div>
                <div style={amountLbl}>{day<7 ? (day===3? '1к': day===4? '2,5к' : day===5? '5к' : day===6? '7,5к' : String(rewards[day-1])) : '10к'}</div>
            </div>
        )
    }

    return (
        <>
        <div style={wrap}>
            <div style={{display:'grid', placeItems:'center'}}>
                <img src="/nagrada days.png" alt="daily" style={{width:110, height:110, objectFit:'contain', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'}} />
            </div>
            <div style={titleWrap}>
                <div style={title}>{t('daily_title')}</div>
                <button 
                    style={infoBtn} 
                    onClick={() => setInfoOpen(true)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                >
                    i
                </button>
            </div>
            <div style={grid}>
                {[1,2,3,4,5,6].map(renderCard)}
                {renderCard(7)}
            </div>
            <div style={{marginTop:14, display:'grid', placeItems:'center'}}>
                <button
                    style={{
                        padding:'10px 22px',
                        borderRadius:999,
                        border:'none',
                        background: state.claimedToday ? '#64748b' : '#22c55e',
                        color:'#0b2f68',
                        fontWeight:900,
                        boxShadow:'0 6px 16px rgba(0,0,0,0.35), inset 0 0 0 3px #0a5d2b',
                        cursor: state.claimedToday ? 'default' : 'pointer',
                        opacity: state.claimedToday ? 0.7 : 1
                    }}
                    disabled={state.claimedToday}
                    onClick={() => handleClaim(state.current)}
                >
                    {t('get')}
                </button>
            </div>
        </div>
        <div style={infoModal} onClick={() => setInfoOpen(false)}>
            <div style={infoModalContent} onClick={(e) => e.stopPropagation()}>
                <div style={descr}>{t('daily_descr')}</div>
                <div style={{display:'grid', placeItems:'center', marginTop:16}}>
                    <button style={inviteSecondaryBtn} onClick={() => setInfoOpen(false)}>{t('close')}</button>
                </div>
            </div>
        </div>
        </>
    )
}

function TasksPanel({ onClose, onShare5, onReward, t, lang, userId }: { onClose: () => void, onShare5: () => void, onReward: (rw: {W?:number,B?:number}) => void, t: (k:string, vars?: Record<string, any>) => string, lang: 'ru'|'en', userId: number | null }){
    const [infoOpen, setInfoOpen] = React.useState(false)
    const k = (base: string) => (userId ? `${base}_${userId}` : base)
    const spins = Number(localStorage.getItem(k('task_spins')) || localStorage.getItem('task_spins') || '0')
    const loginStreak = (()=>{
        try {
            const today = new Date().toDateString()
            const last = localStorage.getItem(k('task_last_login'))
            let streak = Number(localStorage.getItem(k('task_streak')) || '0')
            if (last !== today) {
                if (last) streak = (new Date(today).getTime() - new Date(last).getTime()) <= 86400000*2 ? streak + 1 : 1
                else streak = 1
                localStorage.setItem(k('task_last_login'), today)
                localStorage.setItem(k('task_streak'), String(streak))
                // keep legacy keys for any older UI reads
                localStorage.setItem('task_last_login', today)
                localStorage.setItem('task_streak', String(streak))
            }
            return streak
        } catch { return 1 }
    })()
    const sharedCount = Number(localStorage.getItem(k('task_shared')) || localStorage.getItem('task_shared') || '0')
    function claim(name: string, reward: {W?:number, B?:number}){
        const key = k(`task_done_${name}`)
        if (localStorage.getItem(key) === '1') return
        onReward(reward)
        try { localStorage.setItem(key,'1') } catch {}
    }

    const wrap: React.CSSProperties = { background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)', borderRadius:20, padding:16, boxShadow:'inset 0 0 0 3px #0b2f68', display:'grid', gap:12 }
    const titleWrap: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', gap:8, position:'relative' }
    const title: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1.2, textShadow:'0 2px 0 rgba(0,0,0,0.35)' }
    const infoBtn: React.CSSProperties = { 
        width:24, height:24, borderRadius:'50%', 
        background:'rgba(255,255,255,0.2)', 
        border:'2px solid rgba(255,255,255,0.4)', 
        color:'#fff', 
        fontWeight:900, 
        fontSize:14, 
        display:'grid', 
        placeItems:'center', 
        cursor:'pointer',
        transition:'all 120ms ease',
        boxShadow:'0 2px 4px rgba(0,0,0,0.2)'
    }
    const descrPill: React.CSSProperties = { color:'#e8f1ff', textAlign:'center', fontWeight:800, lineHeight:1.4, margin:'0 auto', width:'95%' }
    const taskCard: React.CSSProperties = {
        display:'grid',
        gridTemplateColumns:'1fr auto',
        alignItems:'center',
        gap:12,
        background:'linear-gradient(180deg,#6bb3ff 0%, #2b66b9 100%)',
        borderRadius:14,
        boxShadow:'inset 0 0 0 3px #0b2f68, 0 4px 8px rgba(0,0,0,0.25)',
        padding:14,
        position:'relative',
        transition:'transform 120ms ease, boxShadow 120ms ease'
    }
    const taskCardDone: React.CSSProperties = {
        ...taskCard,
        background:'linear-gradient(180deg, #4b5563 0%, #1f2937 100%)',
        opacity:0.7
    }
    const taskInfo: React.CSSProperties = { display:'grid', gap:6 }
    const taskTitle: React.CSSProperties = { color:'#fff', fontWeight:900, fontSize:15, textShadow:'0 1px 2px rgba(0,0,0,0.35)' }
    const taskProgress: React.CSSProperties = { color:'#e8f1ff', opacity:0.9, fontSize:13, fontWeight:700 }
    const taskButton: React.CSSProperties = {
        padding:'10px 18px',
        borderRadius:10,
        border:'none',
        background:'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
        color:'#0b2f68',
        fontWeight:900,
        fontSize:13,
        boxShadow:'inset 0 0 0 2px #0a5d2b, 0 2px 4px rgba(0,0,0,0.25)',
        cursor:'pointer',
        transition:'all 120ms ease'
    }
    const taskButtonDisabled: React.CSSProperties = {
        ...taskButton,
        background:'linear-gradient(180deg, #889bb9 0%, #64748b 100%)',
        cursor:'default',
        opacity:0.6
    }
    const infoModal: React.CSSProperties = {
        position:'fixed', left:0, right:0, top:0, bottom:0,
        background:'rgba(0,0,0,0.7)',
        display:'grid', placeItems:'center',
        zIndex:10000,
        pointerEvents: infoOpen ? 'auto' : 'none',
        opacity: infoOpen ? 1 : 0,
        transition:'opacity 200ms ease'
    }
    const infoModalContent: React.CSSProperties = {
        background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)',
        borderRadius:20,
        padding:20,
        maxWidth:'85%',
        boxShadow:'inset 0 0 0 3px #0b2f68, 0 8px 24px rgba(0,0,0,0.4)',
        transform: infoOpen ? 'scale(1)' : 'scale(0.9)',
        transition:'transform 200ms ease'
    }

    const spin50Done = (localStorage.getItem(k('task_done_spin50')) === '1')
    const spin100Done = (localStorage.getItem(k('task_done_spin100')) === '1')
    const streak7Done = (localStorage.getItem(k('task_done_streak7')) === '1')
    const share5Done = (localStorage.getItem(k('task_done_share5')) === '1')

    const renderTask = (title: string, progress: string, canClaim: boolean, done: boolean, onClick: () => void) => (
        <div 
            key={title}
            style={done ? taskCardDone : taskCard}
            onMouseEnter={(e) => {
                if (!done) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 3px #0b2f68, 0 6px 12px rgba(0,0,0,0.35)'
                }
            }}
            onMouseLeave={(e) => {
                if (!done) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 3px #0b2f68, 0 4px 8px rgba(0,0,0,0.25)'
                }
            }}
        >
            {done && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    fontSize: 48,
                    color: '#22c55e',
                    textShadow: '0 0 4px #0b2f68, 0 0 10px rgba(0,0,0,0.7)'
                }}>✓</div>
            )}
            <div style={taskInfo}>
                <div style={taskTitle}>{title}</div>
                <div style={taskProgress}>{progress}</div>
            </div>
            <button 
                disabled={!canClaim || done}
                style={(!canClaim || done) ? taskButtonDisabled : taskButton}
                onClick={onClick}
                onMouseEnter={(e) => {
                    if (canClaim && !done) {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #2dd977 0%, #16a34a 100%)'
                        e.currentTarget.style.transform = 'scale(1.05)'
                    }
                }}
                onMouseLeave={(e) => {
                    if (canClaim && !done) {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)'
                        e.currentTarget.style.transform = 'scale(1)'
                    }
                }}
            >
                {t('get')}
            </button>
        </div>
    )

    return (
        <>
        <div style={wrap}>
            <div style={{display:'grid', placeItems:'center', marginTop:4}}>
                <img src="/press9.png" alt="tasks" style={{width:110,height:110,objectFit:'contain',filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'}} />
            </div>
            <div style={titleWrap}>
                <div style={title}>{t('tasks_title')}</div>
                <button 
                    style={infoBtn} 
                    onClick={() => setInfoOpen(true)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                >
                    i
                </button>
            </div>
            <div style={{display:'grid', gap:12}}>
                {renderTask(
                    lang==='ru' ? '50 прокрутов — 1000 W' : '50 spins — 1000 W', 
                    `${Math.min(50, spins)}/50`, 
                    !spin50Done && spins >= 50, 
                    spin50Done,
                    () => claim('spin50', {W:1000})
                )}
                {renderTask(
                    lang==='ru' ? '100 прокрутов — 1 B' : '100 spins — 1 B', 
                    `${Math.min(100, spins)}/100`, 
                    !spin100Done && spins >= 100, 
                    spin100Done,
                    () => claim('spin100', {B:1})
                )}
                {renderTask(
                    lang==='ru' ? 'Заходи 7 дней подряд — 1 B' : 'Login 7 days in a row — 1 B', 
                    `${Math.min(7, loginStreak)}/7`, 
                    !streak7Done && loginStreak >= 7, 
                    streak7Done,
                    () => claim('streak7', {B:1})
                )}
                {renderTask(
                    lang==='ru' ? 'Поделись с 5 друзьями — 5000 W' : 'Share with 5 friends — 5000 W', 
                    `${Math.min(5, sharedCount)}/5`, 
                    !share5Done && sharedCount >= 5, 
                    share5Done,
                    () => {
                        claim('share5', {W:5000})
                        onShare5()
                    }
                )}
            </div>
        </div>
        <div style={infoModal} onClick={() => setInfoOpen(false)}>
            <div style={infoModalContent} onClick={(e) => e.stopPropagation()}>
                <div style={descrPill}>{lang==='ru' ? 'Выполняй задания и получай награды. Каждое задание можно выполнить только один раз.' : 'Complete tasks and get rewards. Each task can only be completed once.'}</div>
                <div style={{display:'grid', placeItems:'center', marginTop:16}}>
                    <button style={inviteSecondaryBtn} onClick={() => setInfoOpen(false)}>{t('close')}</button>
                </div>
            </div>
        </div>
        </>
    )
}

function LevelsPanel({
    onClose,
    onClaimLevel,
    onGoTo,
    playerLevel,
    claimedLevel,
    stats,
    levels,
    isReady,
    getProgress,
    t,
    lang,
}: {
    onClose: () => void
    onClaimLevel: (level: number) => void
    onGoTo?: (level: number) => void
    playerLevel: number
    claimedLevel: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats: any
    levels: Array<{ level: number, action: string, how: string, unlocks: string[], rewardW: number, minInvites?: number }>
    isReady: (lvl: number) => boolean
    getProgress: (lvl: number) => { current: number, required: number, text: string }
    t: (k:string, vars?: Record<string, any>) => string
    lang: 'ru'|'en'
}) {
    const [infoOpen, setInfoOpen] = React.useState(false)

    const wrap: React.CSSProperties = {
        background:'linear-gradient(180deg, rgba(41, 103, 183, 0.92) 0%, rgba(18, 55, 120, 0.92) 100%)',
        borderRadius:24,
        padding:16,
        boxShadow:'inset 0 0 0 3px rgba(11,47,104,0.9), 0 18px 40px rgba(0,0,0,0.35)',
        display:'grid',
        gap:12,
        position:'relative',
        overflow:'hidden',
    }
    const glow: React.CSSProperties = {
        position:'absolute',
        inset:-80,
        background:'radial-gradient(circle at 30% 20%, rgba(34, 197, 94, 0.22) 0%, rgba(34, 197, 94, 0) 45%), radial-gradient(circle at 70% 10%, rgba(255, 210, 58, 0.18) 0%, rgba(255, 210, 58, 0) 40%), radial-gradient(circle at 60% 80%, rgba(107, 179, 255, 0.22) 0%, rgba(107, 179, 255, 0) 45%)',
        pointerEvents:'none',
        filter:'blur(2px)'
    }
    const titleWrap: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', gap:8, position:'relative' }
    const title: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1.2, textShadow:'0 2px 0 rgba(0,0,0,0.35)' }
    const infoBtn: React.CSSProperties = { 
        width:24, height:24, borderRadius:'50%', 
        background:'rgba(255,255,255,0.2)', 
        border:'2px solid rgba(255,255,255,0.4)', 
        color:'#fff', 
        fontWeight:900, 
        fontSize:14, 
        display:'grid', 
        placeItems:'center', 
        cursor:'pointer',
        transition:'all 120ms ease',
        boxShadow:'0 2px 4px rgba(0,0,0,0.2)'
    }
    const descrPill: React.CSSProperties = { color:'#e8f1ff', textAlign:'center', fontWeight:800, lineHeight:1.4, margin:'0 auto', width:'95%' }
    const taskCard: React.CSSProperties = {
        display:'grid',
        gridTemplateColumns:'1fr auto',
        alignItems:'center',
        gap:12,
        background:'linear-gradient(180deg, rgba(107,179,255,0.95) 0%, rgba(43,102,185,0.98) 100%)',
        borderRadius:18,
        boxShadow:'inset 0 0 0 3px rgba(11,47,104,0.95), 0 10px 20px rgba(0,0,0,0.25)',
        padding:16,
        position:'relative',
        transition:'transform 120ms ease, boxShadow 120ms ease'
    }
    const taskCardDone: React.CSSProperties = {
        ...taskCard,
        background:'linear-gradient(180deg, rgba(34,197,94,0.28) 0%, rgba(22,163,74,0.18) 100%)',
        opacity:1
    }
    const taskInfo: React.CSSProperties = { display:'grid', gap:6 }
    const taskTitle: React.CSSProperties = { color:'#fff', fontWeight:900, fontSize:15, textShadow:'0 1px 2px rgba(0,0,0,0.35)' }
    const taskProgress: React.CSSProperties = { color:'#e8f1ff', opacity:0.9, fontSize:13, fontWeight:700 }
    const taskHow: React.CSSProperties = { color:'#e8f1ff', opacity:0.92, fontSize:12, fontWeight:800, lineHeight:1.35 }
    const progressBarWrap: React.CSSProperties = { height:10, borderRadius:999, background:'rgba(11,47,104,0.55)', boxShadow:'inset 0 0 0 2px rgba(11,47,104,0.85)' }
    const progressBarFill = (p: number): React.CSSProperties => ({ height:'100%', width:`${Math.max(0, Math.min(100, p))}%`, borderRadius:999, background:'linear-gradient(90deg,#22c55e,#ffd23a)', boxShadow:'0 6px 16px rgba(34,197,94,0.35)' })
    const taskButton: React.CSSProperties = {
        padding:'10px 18px',
        borderRadius:10,
        border:'none',
        background:'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
        color:'#0b2f68',
        fontWeight:900,
        fontSize:13,
        boxShadow:'inset 0 0 0 2px #0a5d2b, 0 2px 4px rgba(0,0,0,0.25)',
        cursor:'pointer',
        transition:'all 120ms ease'
    }
    const taskButtonDisabled: React.CSSProperties = {
        ...taskButton,
        background:'linear-gradient(180deg, #889bb9 0%, #64748b 100%)',
        cursor:'default',
        opacity:0.6
    }
    const taskButtonGhost: React.CSSProperties = {
        padding:'10px 14px',
        borderRadius:10,
        border:'2px solid rgba(255,255,255,0.35)',
        background:'rgba(255,255,255,0.12)',
        color:'#fff',
        fontWeight:900,
        fontSize:13,
        cursor:'pointer',
        transition:'all 120ms ease',
        boxShadow:'0 6px 14px rgba(0,0,0,0.18)'
    }
    const infoModal: React.CSSProperties = {
        position:'fixed', left:0, right:0, top:0, bottom:0,
        background:'rgba(0,0,0,0.7)',
        display:'grid', placeItems:'center',
        zIndex:10000,
        pointerEvents: infoOpen ? 'auto' : 'none',
        opacity: infoOpen ? 1 : 0,
        transition:'opacity 200ms ease'
    }
    const infoModalContent: React.CSSProperties = {
        background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)',
        borderRadius:20,
        padding:20,
        maxWidth:'85%',
        boxShadow:'inset 0 0 0 3px #0b2f68, 0 8px 24px rgba(0,0,0,0.4)',
        transform: infoOpen ? 'scale(1)' : 'scale(0.9)',
        transition:'transform 200ms ease'
    }

    // We show exactly ONE "current" task: the next unclaimed level reward.
    // This keeps the same task visible until the user presses "Claim", even if level already increased.
    const currentTargetLevel = Math.max(1, Math.min(50, claimedLevel + 1))
    const currentConf = levels.find(l => l.level === currentTargetLevel)
    const progress = getProgress(currentTargetLevel)
    const reached = playerLevel >= currentTargetLevel
    const ready = isReady(currentTargetLevel)
    const canClaimReward = reached && ready && currentTargetLevel === claimedLevel + 1
    const pct = progress.required > 0 ? (progress.current / progress.required) * 100 : (ready ? 100 : 0)

    const renderLevelTask = (level: number, action: string, progressText: string, howText: string, canClaim: boolean, done: boolean, rewardW: number, onClick: () => void, btnText?: string, showCheckOnBtn?: boolean) => (
        <div 
            key={`level-${level}`}
            style={done ? taskCardDone : taskCard}
            onMouseEnter={(e) => {
                if (!done) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 3px #0b2f68, 0 6px 12px rgba(0,0,0,0.35)'
                }
            }}
            onMouseLeave={(e) => {
                if (!done) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 3px #0b2f68, 0 4px 8px rgba(0,0,0,0.25)'
                }
            }}
        >
            {done && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    fontSize: 48,
                    color: '#22c55e',
                    textShadow: '0 0 4px #0b2f68, 0 0 10px rgba(0,0,0,0.7)'
                }}>✓</div>
            )}
            <div style={taskInfo}>
                <div style={taskTitle}>{lang === 'ru' ? `Уровень ${level}: ${action}` : `Level ${level}: ${action}`}</div>
                <div style={taskProgress}>{progressText}</div>
                <div style={progressBarWrap}><div style={progressBarFill(pct)} /></div>
                <div style={taskHow}>{howText}</div>
                <div style={{color:'#ffe27a', fontSize:12, fontWeight:800, marginTop:2}}>{lang === 'ru' ? `Награда: +${rewardW} W` : `Reward: +${rewardW} W`}</div>
            </div>
            <div style={{display:'grid', gap:10, justifyItems:'end'}}>
                {onGoTo && (
                    <button
                        style={taskButtonGhost}
                        onClick={() => onGoTo(level)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
                    >
                        {lang === 'ru' ? 'Перейти' : 'Go'}
                    </button>
                )}
                <button 
                    disabled={!canClaim || done}
                    style={(!canClaim || done) ? taskButtonDisabled : taskButton}
                    onClick={onClick}
                    onMouseEnter={(e) => {
                        if (canClaim && !done) {
                            e.currentTarget.style.background = 'linear-gradient(180deg, #2dd977 0%, #16a34a 100%)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (canClaim && !done) {
                            e.currentTarget.style.background = 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)'
                            e.currentTarget.style.transform = 'scale(1)'
                        }
                    }}
                >
                    {(btnText || t('get'))}{showCheckOnBtn ? ' ✓' : ''}
                </button>
            </div>
        </div>
    )

    return (
        <>
        <div style={wrap}>
            <div style={glow} />
            <div style={{display:'grid', placeItems:'center', marginTop:4}}>
                <img src="/press10.png" alt="levels" style={{width:110,height:110,objectFit:'contain',filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'}} />
            </div>
            <div style={titleWrap}>
                <div style={title}>{lang==='ru' ? 'Повысил уровень? Забирай бонусы!' : 'Leveled up? Claim bonuses!'}</div>
                <button 
                    style={infoBtn} 
                    onClick={() => setInfoOpen(true)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                >
                    i
                </button>
            </div>
            <div style={{color:'#e8f1ff', textAlign:'center', fontWeight:900, fontSize:16, marginBottom:4}}>
                {lang==='ru' ? `Твой уровень: ${playerLevel}` : `Your level: ${playerLevel}`}
            </div>
            <div style={{display:'grid', gap:12}}>
                {currentConf ? (
                    <>
                        <div style={{color:'#e8f1ff', textAlign:'center', fontWeight:900, opacity:0.95}}>
                            {lang === 'ru' ? 'Задание для следующей награды:' : 'Task for the next reward:'}
                        </div>
                        {renderLevelTask(
                            currentTargetLevel,
                            currentConf.action,
                            progress.text,
                            currentConf.how,
                            canClaimReward,
                            false,
                            currentConf.rewardW,
                            () => onClaimLevel(currentTargetLevel),
                            canClaimReward ? (lang === 'ru' ? 'Забрать' : 'Claim') : (lang === 'ru' ? 'Не готово' : 'Not ready'),
                            reached && ready
                        )}
                    </>
                ) : (
                    <div style={{color:'#e8f1ff', textAlign:'center', fontWeight:800, padding:20}}>
                        {lang === 'ru' ? 'Пока нет заданий.' : 'No tasks yet.'}
                    </div>
                )}
            </div>
        </div>
        <div style={infoModal} onClick={() => setInfoOpen(false)}>
            <div style={infoModalContent} onClick={(e) => e.stopPropagation()}>
                <div style={descrPill}>{lang==='ru' ? 'Выполняй задания для повышения уровня и получай награды. Каждый уровень можно получить только один раз.' : 'Complete tasks to level up and get rewards. Each level can only be claimed once.'}</div>
                <div style={{display:'grid', placeItems:'center', marginTop:16}}>
                    <button style={inviteSecondaryBtn} onClick={() => setInfoOpen(false)}>{t('close')}</button>
                </div>
            </div>
        </div>
        </>
    )
}

function NewsPanel({ onClose, isAdmin, lang }: { onClose: () => void, isAdmin: boolean, lang: 'ru'|'en' }){
    const [title, setTitle] = React.useState('')
    const [text, setText] = React.useState('')
    const [images, setImages] = React.useState<string[]>([])
    const [list, setList] = React.useState<Array<{title:string, text:string, images:string[], ts:number}>>([])
    // Загружаем новости для всех игроков (не только для админа)
    React.useEffect(() => {
        const API_BASE = ((import.meta as any)?.env?.VITE_API_BASE || 'https://speen-server.onrender.com').trim()
        const url = `${API_BASE}/api/news`.replace(/\/+api/,'/api')
        fetch(url)
            .then(async r => r.ok ? r.json() : Promise.resolve({ items: [] }))
            .then(d => { if (Array.isArray(d?.items)) setList(d.items) })
            .catch(() => {})
    }, [])
    async function addNews(){
        if (!isAdmin) return
        try{
            const tg = (window as any).Telegram?.WebApp
            const adminId = tg?.initDataUnsafe?.user?.id
            const API_BASE = ((import.meta as any)?.env?.VITE_API_BASE || 'https://speen-server.onrender.com').trim()
            const url = `${API_BASE}/api/news`.replace(/\/+api/,'/api')
            const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ adminId, title, text, images }) })
            if (res.ok) {
                setTitle(''); setText(''); setImages([])
                const d = await fetch(url).then(r=> r.ok ? r.json() : { items: [] }).catch(()=>null)
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
            {/* Админка: показывается только админу */}
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
                <button style={newsAddBtn} onClick={addNews}>{lang==='ru' ? '🚀 Опубликовать' : '🚀 Publish'}</button>
                    </div>
                </div>
            )}
            {/* Список новостей: виден всем игрокам */}
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

function OnboardingPanel({ lang, onFinish }: { lang: 'ru'|'en', onFinish: () => void }) {
    const [step, setStep] = React.useState<number>(0)
    const steps = lang === 'ru'
        ? [
            { title: 'Добро пожаловать!', body: 'Это регистрация и краткий инструктаж — показывается только один раз.\nСейчас объясню как играть.', image: '/press10.png' },
            { title: '1) Выбери цифру', body: 'Нажми на цифру 0–9 на колесе.\nПотом жми кнопку “Старт”.', image: '/wheel.png' },
            { title: '2) Бонусный сектор', body: 'Перед стартом выбери бонусный сектор на колесе.\nЕсли угадаешь сектор — получишь деньги/бустер.', image: '/bonus.png' },
            { title: '3) Бустеры', body: 'В “плюсе” можно выбрать бустер:\n- Сердце: вернёт ставку при проигрыше\n- Батарейка: даст доп. вращение при промахе\n- Ракета: усиливает выигрыш', image: '/plus.png' },
            { title: '4) Уровни и награды', body: 'Открой “Повысил уровень? — Забирай бонусы!”.\nВыполняй задания, кнопка “Забрать” загорится.\nВажно: накопитель по центру откроется с 5 уровня.', image: '/press10.png' },
        ]
        : [
            { title: 'Welcome!', body: 'Registration & quick tutorial — shown only once.\nLet\'s learn the basics.', image: '/press10.png' },
            { title: '1) Pick a digit', body: 'Tap a digit 0–9 on the wheel.\nThen press “Start”.', image: '/wheel.png' },
            { title: '2) Bonus sector', body: 'Before spinning, select a bonus sector.\nIf you hit it — you get money/booster.', image: '/bonus.png' },
            { title: '3) Boosters', body: 'In the “plus” menu you can choose a booster:\n- Heart: returns bet on loss\n- Battery: extra spin on miss\n- Rocket: boosts winnings', image: '/plus.png' },
            { title: '4) Levels & rewards', body: 'Open “Leveled up? — claim bonuses!”.\nComplete tasks and the “Claim” button will light up.\nCenter accumulator unlocks at level 5.', image: '/press10.png' },
        ]

    const isLast = step >= steps.length - 1

    const wrap: React.CSSProperties = {
        background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)',
        borderRadius:20,
        padding:16,
        boxShadow:'inset 0 0 0 3px #0b2f68',
        display:'grid',
        gap:12,
        height:'100%',
    }
    const title: React.CSSProperties = {
        color:'#fff',
        fontWeight:900,
        fontSize:22,
        textAlign:'center',
        textShadow:'0 2px 0 rgba(0,0,0,0.35)',
        letterSpacing:0.8,
    }
    const card: React.CSSProperties = {
        background:'rgba(255,255,255,0.10)',
        borderRadius:18,
        padding:14,
        boxShadow:'inset 0 0 0 3px rgba(11,47,104,0.55)',
        display:'grid',
        gap:10,
    }
    const body: React.CSSProperties = {
        whiteSpace:'pre-line',
        color:'#e8f1ff',
        fontWeight:800,
        lineHeight:1.35,
        textAlign:'center',
    }
    const dotsWrap: React.CSSProperties = { display:'flex', gap:8, justifyContent:'center', alignItems:'center' }
    const dot = (active: boolean): React.CSSProperties => ({
        width:10,
        height:10,
        borderRadius:'50%',
        background: active ? '#ffd23a' : 'rgba(255,255,255,0.25)',
        boxShadow: active ? '0 0 0 3px rgba(122,78,6,0.65)' : 'inset 0 0 0 2px rgba(11,47,104,0.6)',
    })
    const btnRow: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:'auto' }
    const btn: React.CSSProperties = { padding:'10px 14px', borderRadius:12, border:'none', background:'#244e96', color:'#fff', fontWeight:900, boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer' }
    const btnPrimary: React.CSSProperties = { ...btn, background:'#22c55e', color:'#0b2f68', boxShadow:'inset 0 0 0 3px #0a5d2b' }

    return (
        <div style={wrap}>
            <div style={{display:'grid', placeItems:'center', marginTop:4}}>
                <img 
                    src={steps[step]?.image || '/press10.png'} 
                    alt="guide" 
                    style={{
                        width: step === 0 ? 96 : step === 1 ? 120 : step === 2 ? 80 : step === 3 ? 80 : 96,
                        height: step === 0 ? 96 : step === 1 ? 120 : step === 2 ? 80 : step === 3 ? 80 : 96,
                        objectFit:'contain',
                        filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'
                    }} 
                />
            </div>
            <div style={title}>{steps[step]?.title || ''}</div>
            <div style={card}>
                <div style={body}>{steps[step]?.body || ''}</div>
            </div>
            <div style={dotsWrap}>
                {steps.map((_, i) => <div key={`dot-${i}`} style={dot(i === step)} />)}
            </div>
            <div style={btnRow}>
                <button
                    style={{...btn, opacity: step === 0 ? 0.6 : 1, cursor: step === 0 ? 'default' : 'pointer'}}
                    onClick={() => { if (step === 0) return; setStep(s => Math.max(0, s - 1)) }}
                >
                    {lang === 'ru' ? 'Назад' : 'Back'}
                </button>
                <button
                    style={btnPrimary}
                    onClick={() => { if (isLast) onFinish(); else setStep(s => Math.min(steps.length - 1, s + 1)) }}
                >
                    {isLast ? (lang === 'ru' ? 'Начать игру' : 'Start') : (lang === 'ru' ? 'Далее' : 'Next')}
                </button>
            </div>
        </div>
    )
}

function ShopPanel({ onClose, onPurchase, bonusLabels, bonusImages, onBuyStars, onOpenWheelShop, t, lang }: { onClose: () => void, onPurchase: (title: string, priceB: number) => boolean, bonusLabels: string[], bonusImages: string[], onBuyStars: (stars: number, toB: number) => void, onOpenWheelShop: () => void, t: (k:string, vars?: Record<string, any>) => string, lang: 'ru'|'en' }){
    // визуальный инвентарь в стиле макета
    const [infoOpen, setInfoOpen] = React.useState(false)
    
    // Получаем количество каждого бонуса из localStorage
    const getBonusCounts = () => {
        try {
            const invRaw = localStorage.getItem('bonuses_inv') || '[]'
            const inv: string[] = JSON.parse(invRaw)
            const counts: Record<string, number> = {}
            inv.forEach(bonusName => {
                counts[bonusName] = (counts[bonusName] || 0) + 1
            })
            return counts
        } catch {
            return {}
        }
    }
    
    const bonusCounts = getBonusCounts()
    
    const wrap: React.CSSProperties = { background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)', borderRadius:20, padding:16, boxShadow:'inset 0 0 0 3px #0b2f68', display:'grid', gap:12 }
    const titleWrap: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', gap:8, position:'relative' }
    const title: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1.2, textShadow:'0 2px 0 rgba(0,0,0,0.35)' }
    const infoBtn: React.CSSProperties = { 
        width:24, height:24, borderRadius:'50%', 
        background:'rgba(255,255,255,0.2)', 
        border:'2px solid rgba(255,255,255,0.4)', 
        color:'#fff', 
        fontWeight:900, 
        fontSize:14, 
        display:'grid', 
        placeItems:'center', 
        cursor:'pointer',
        transition:'all 120ms ease',
        boxShadow:'0 2px 4px rgba(0,0,0,0.2)'
    }
    const descrPill: React.CSSProperties = { color:'#e8f1ff', textAlign:'center', fontWeight:800, lineHeight:1.4, margin:'0 auto', width:'95%' }
    const grid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginTop:10 }
    const cellBase: React.CSSProperties = { background:'linear-gradient(180deg,#6bb3ff,#2b66b9)', borderRadius:26, boxShadow:'inset 0 0 0 3px #0b2f68', height:110, display:'grid', placeItems:'center', position:'relative' }
    const iconImg: React.CSSProperties = { width:64, height:64, objectFit:'contain', filter:'drop-shadow(0 8px 12px rgba(0,0,0,0.35))' }
    const emptyCell: React.CSSProperties = { 
        ...cellBase, 
        background:'linear-gradient(180deg,rgba(107,179,255,0.25),rgba(43,102,185,0.4))', 
        boxShadow:'inset 0 0 0 3px rgba(11,47,104,0.7)',
        opacity:0.75,
        cursor:'pointer'
    }
    const comingSoonCell: React.CSSProperties = {
        ...cellBase,
        background:'linear-gradient(180deg,rgba(107,179,255,0.15),rgba(43,102,185,0.25))',
        boxShadow:'inset 0 0 0 3px rgba(11,47,104,0.5)',
        opacity:0.5
    }
    const plusInner: React.CSSProperties = { width:48, height:48, borderRadius:12, display:'grid', placeItems:'center', background:'transparent', color:'#ffffff', fontWeight:900, fontSize:40 }
    const questionMark: React.CSSProperties = { width:48, height:48, borderRadius:12, display:'grid', placeItems:'center', background:'transparent', color:'rgba(255,255,255,0.6)', fontWeight:900, fontSize:40 }
    const countBadge: React.CSSProperties = {
        position:'absolute',
        bottom:8,
        right:8,
        background:'#ffffff',
        color:'#0b2f68',
        borderRadius:'50%',
        width:26,
        height:26,
        display:'grid',
        placeItems:'center',
        fontSize:12,
        fontWeight:900,
        boxShadow:'0 2px 6px rgba(0,0,0,0.35)',
        border:'2px solid rgba(11,47,104,0.85)'
    }
    const infoModal: React.CSSProperties = {
        position:'fixed', left:0, right:0, top:0, bottom:0,
        background:'rgba(0,0,0,0.7)',
        display:'grid', placeItems:'center',
        zIndex:10000,
        pointerEvents: infoOpen ? 'auto' : 'none',
        opacity: infoOpen ? 1 : 0,
        transition:'opacity 200ms ease'
    }
    const infoModalContent: React.CSSProperties = {
        background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)',
        borderRadius:20,
        padding:20,
        maxWidth:'85%',
        boxShadow:'inset 0 0 0 3px #0b2f68, 0 8px 24px rgba(0,0,0,0.4)',
        transform: infoOpen ? 'scale(1)' : 'scale(0.9)',
        transition:'transform 200ms ease'
    }

    return (
        <>
        <div style={wrap}>
            <div style={{display:'grid', placeItems:'center', marginTop:4}}>
                <img src="/lev bonus.png" alt="bag" style={{width:110,height:110,objectFit:'contain',filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'}} />
            </div>
            <div style={titleWrap}>
                <div style={title}>{t('shop_title')}</div>
                <button 
                    style={infoBtn} 
                    onClick={() => setInfoOpen(true)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                >
                    i
                </button>
            </div>
            <div style={grid}>
                {bonusLabels.slice(0, 4).map((bonusLabel, i) => {
                    const hasBonus = bonusCounts[bonusLabel] > 0
                    return (
                        <div 
                            key={`bonus-${i}`} 
                            style={hasBonus ? cellBase : emptyCell}
                            onClick={() => {
                                if (!hasBonus) {
                                    onOpenWheelShop()
                                }
                            }}
                        >
                            {hasBonus ? (
                                <>
                                    <img src={bonusImages[i]} alt={bonusLabel} style={iconImg} />
                                    <div style={countBadge}>{bonusCounts[bonusLabel]}</div>
                                </>
                            ) : (
                                <div style={plusInner}>+</div>
                            )}
                        </div>
                    )
                })}
                {Array.from({length:2}).map((_,i)=> (
                    <div key={`soon-${i}`} style={comingSoonCell}>
                        <div style={questionMark}>?</div>
                    </div>
                ))}
            </div>
        </div>
        <div style={infoModal} onClick={() => setInfoOpen(false)}>
            <div style={infoModalContent} onClick={(e) => e.stopPropagation()}>
                <div style={descrPill}>{lang==='ru' ? 'Данный раздел — это твой рюкзак. Тут хранятся все твои покупки и бонусы, полученные в игре.' : 'This section is your backpack. Here are all your purchases and bonuses received in the game.'}</div>
                <div style={{display:'grid', placeItems:'center', marginTop:16}}>
                    <button style={inviteSecondaryBtn} onClick={() => setInfoOpen(false)}>{t('close')}</button>
                </div>
            </div>
        </div>
        </>
    )
}

function WheelShopPanel({ onClose, bonusLabels, bonusImages, onPurchase, t, lang }: { onClose: () => void, bonusLabels: string[], bonusImages: string[], onPurchase: (title: string) => void, t: (k:string, vars?: any) => string, lang: 'ru'|'en' }){
    const [infoOpen, setInfoOpen] = React.useState(false)
    
    const wrap: React.CSSProperties = { 
        background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)', 
        borderRadius:20, 
        padding:16, 
        boxShadow:'inset 0 0 0 3px #0b2f68', 
        display:'grid', 
        gap:12,
        width:'100%',
        maxWidth:'100%',
        boxSizing:'border-box'
    }
    const titleWrap: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', gap:8, position:'relative' }
    const title: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1.2, textShadow:'0 2px 0 rgba(0,0,0,0.35)' }
    const infoBtn: React.CSSProperties = { 
        width:24, height:24, borderRadius:'50%', 
        background:'rgba(255,255,255,0.2)', 
        border:'2px solid rgba(255,255,255,0.4)', 
        color:'#fff', 
        fontWeight:900, 
        fontSize:14, 
        display:'grid', 
        placeItems:'center', 
        cursor:'pointer',
        transition:'all 120ms ease',
        boxShadow:'0 2px 4px rgba(0,0,0,0.2)'
    }
    const descrPill: React.CSSProperties = { color:'#e8f1ff', textAlign:'center', fontWeight:800, lineHeight:1.4, margin:'0 auto', width:'95%' }
    const bonusGrid: React.CSSProperties = {
        display:'grid',
        gridTemplateColumns:'repeat(2, 1fr)',
        gap:10,
        width:'100%'
    }
    const bonusCard: React.CSSProperties = {
        display:'grid',
        gridTemplateRows:'auto 1fr auto',
        gap:8,
        background:'linear-gradient(180deg,#6bb3ff 0%, #2b66b9 100%)',
        borderRadius:12,
        boxShadow:'inset 0 0 0 2px #0b2f68, 0 3px 6px rgba(0,0,0,0.25)',
        padding:10,
        minHeight:110,
        position:'relative',
        transition:'transform 120ms ease, boxShadow 120ms ease'
    }
    const bonusIcon: React.CSSProperties = {
        width:48,
        height:48,
        objectFit:'contain',
        filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
        margin:'0 auto'
    }
    const bonusLabel: React.CSSProperties = {
        color:'#fff',
        fontWeight:900,
        fontSize:13,
        textAlign:'center',
        textShadow:'0 1px 2px rgba(0,0,0,0.35)'
    }
    const bonusButton: React.CSSProperties = {
        padding:'8px 12px',
        borderRadius:8,
        border:'none',
        background:'linear-gradient(180deg, #ffd23a 0%, #f2a93b 100%)',
        color:'#0b2f68',
        fontWeight:900,
        fontSize:12,
        boxShadow:'inset 0 0 0 2px #7a4e06, 0 2px 4px rgba(0,0,0,0.25)',
        cursor:'pointer',
        transition:'all 120ms ease',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        gap:4
    }
    const infoModal: React.CSSProperties = {
        position:'fixed', left:0, right:0, top:0, bottom:0,
        background:'rgba(0,0,0,0.7)',
        display:'grid', placeItems:'center',
        zIndex:10000,
        pointerEvents: infoOpen ? 'auto' : 'none',
        opacity: infoOpen ? 1 : 0,
        transition:'opacity 200ms ease'
    }
    const infoModalContent: React.CSSProperties = {
        background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)',
        borderRadius:20,
        padding:20,
        maxWidth:'85%',
        boxShadow:'inset 0 0 0 3px #0b2f68, 0 8px 24px rgba(0,0,0,0.4)',
        transform: infoOpen ? 'scale(1)' : 'scale(0.9)',
        transition:'transform 200ms ease'
    }
    const comingSoonCell: React.CSSProperties = {
        ...bonusCard,
        background:'linear-gradient(180deg,rgba(107,179,255,0.15),rgba(43,102,185,0.25))',
        boxShadow:'inset 0 0 0 3px rgba(11,47,104,0.5)',
        opacity:0.5,
        cursor:'default'
    }
    const questionMark: React.CSSProperties = { 
        width:48, 
        height:48, 
        borderRadius:12, 
        display:'grid', 
        placeItems:'center', 
        background:'transparent', 
        color:'rgba(255,255,255,0.6)', 
        fontWeight:900, 
        fontSize:40 
    }

    return (
        <>
        <div style={wrap}>
            <div style={{display:'grid', placeItems:'center', marginTop:4}}>
                <img src="/press7.png" alt="wheel" style={{width:110,height:110,objectFit:'contain',filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'}} />
            </div>
            <div style={titleWrap}>
                <div style={title}>{t('press7_title')}</div>
                <button 
                    style={infoBtn} 
                    onClick={() => setInfoOpen(true)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                >
                    i
                </button>
            </div>
            <div style={bonusGrid}>
                {bonusLabels.map((b, originalIndex) => {
                    const bonusNames: Record<string, string> = {
                        'Heart': 'Сердце',
                        'Battery': 'Батарейка',
                        'Rocket': 'Ракета'
                    }
                    const bonusDescriptions: Record<string, string> = {
                        'Heart': 'Сохраняет деньги при проигрыше',
                        'Battery': 'Дополнительное вращение (2 раза)',
                        'Rocket': 'Удваивает выигрыш'
                    }
                    return (
                    <div 
                        key={`wb-${b}`} 
                        style={bonusCard}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)'
                            e.currentTarget.style.boxShadow = 'inset 0 0 0 3px #0b2f68, 0 6px 12px rgba(0,0,0,0.35)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = 'inset 0 0 0 3px #0b2f68, 0 4px 8px rgba(0,0,0,0.25)'
                        }}
                    >
                        <img src={bonusImages[originalIndex]} alt={b} style={bonusIcon} />
                        <div style={bonusLabel}>{bonusNames[b] || b}</div>
                        <div style={{fontSize:10, color:'#e8f1ff', fontWeight:700, opacity:.8, textAlign:'center', marginTop:2}}>{bonusDescriptions[b] || ''}</div>
                        <button 
                            style={bonusButton}
                            onClick={() => onPurchase(b)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(180deg, #ffd86b 0%, #f2a93b 100%)'
                                e.currentTarget.style.transform = 'scale(1.05)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(180deg, #ffd23a 0%, #f2a93b 100%)'
                                e.currentTarget.style.transform = 'scale(1)'
                            }}
                        >
                            <Coin />
                            <span>1 B</span>
                        </button>
                    </div>
                    )
                })}
                <div style={comingSoonCell}>
                    <div style={questionMark}>?</div>
                </div>
            </div>
        </div>
        <div style={infoModal} onClick={() => setInfoOpen(false)}>
            <div style={infoModalContent} onClick={(e) => e.stopPropagation()}>
                <div style={descrPill}>{lang==='ru' ? 'Покупай бонусы за 1 B и используй их в игре для увеличения выигрыша.' : 'Buy bonuses for 1 B and use them in the game to increase your winnings.'}</div>
                <div style={{display:'grid', placeItems:'center', marginTop:16}}>
                    <button style={inviteSecondaryBtn} onClick={() => setInfoOpen(false)}>{t('close')}</button>
                </div>
            </div>
        </div>
        </>
    )
}

const root: React.CSSProperties = {
    minHeight: '100dvh',
    // Возврат к прежнему фону приложения
    background: 'linear-gradient(180deg, #68b1ff 0%, #3f7ddb 60%, #2e63bf 100%)',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
}

const preloaderWrap: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, #68b1ff 0%, #3f7ddb 60%, #2e63bf 100%)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 9999,
}

const preloaderContent: React.CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    gap: 20,
}

const neonWrap: React.CSSProperties = {
    display: 'grid',
    gap: 6,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(0,255,200,0.25)',
    boxShadow: '0 0 16px rgba(0,255,200,0.25), inset 0 0 12px rgba(0,0,0,0.35)',
}

const neonText: React.CSSProperties = {
    color: '#d9fffb',
    fontWeight: 900,
    letterSpacing: 1.8,
    fontSize: 18,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    animation: 'neonFlicker 2400ms ease-in-out forwards, neonPulse 1600ms ease-in-out infinite 2400ms',
    filter: 'drop-shadow(0 0 6px rgba(0,255,200,0.5))',
}

const preloaderSpinner: React.CSSProperties = {
    width: 60,
    height: 60,
    border: '6px solid rgba(255, 255, 255, 0.3)',
    borderTop: '6px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
}

const preloaderText: React.CSSProperties = {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 700,
    fontFamily: '"Rubik", Inter, system-ui',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
}

const topBar: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }
const leftUser: React.CSSProperties = { display:'flex', alignItems:'center', gap:10 }

const avatar: React.CSSProperties = { width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '3px solid #2a5b9f', boxShadow:'0 2px 0 #0b2f68', display:'grid', placeItems:'center', overflow:'hidden' }
const avatarImg: React.CSSProperties = { width:'100%', height:'100%', objectFit:'cover' }
const usernameRow: React.CSSProperties = { display:'flex', alignItems:'center', gap:6 }
const usernameStyle: React.CSSProperties = { color:'#083068', fontWeight: 900, fontSize:22, letterSpacing:0.2, textShadow:'0 2px 0 rgba(255,255,255,0.7)', fontFamily:'"Rubik", Inter, system-ui' }
const levelStyle: React.CSSProperties = { color:'#083068', fontWeight:900, fontSize:16, lineHeight:1.2, padding:'2px 10px', background:'linear-gradient(90deg,#ffe27a 0%, #ffbe3d 100%)', borderRadius:999, boxShadow:'inset 0 0 0 2px rgba(255,255,255,0.75), 0 2px 8px rgba(0,0,0,0.25)', textShadow:'none', justifySelf:'start' }
const avatarText: React.CSSProperties = { display:'grid', placeItems:'center', width:'100%', height:'100%', fontWeight:900, color:'#0b2f68' }
const balances: React.CSSProperties = { display:'grid', gap:8 }
const balanceRow: React.CSSProperties = { display:'flex', alignItems:'center', padding:'6px 10px', background: 'linear-gradient(90deg,#2a5b9f,#184b97)', borderRadius: 12, color:'#fff', boxShadow:'inset 0 0 0 2px #8cbcff' }
const coinImg: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }

const content: React.CSSProperties = { margin: '8px 10px', borderRadius: 12, boxShadow:'inset 0 0 0 3px #8cbcff', background:'rgba(0,0,0,0.05)', position:'relative', display:'flex', flexDirection:'column', minHeight:0 }
// wheelWrap будет создан динамически с учетом размера колеса
const plusNearWheel: React.CSSProperties = { position:'absolute', left: -10, bottom: -40, width: 48, height: 48, objectFit:'contain', pointerEvents:'none', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }
// removed external plusOutsideWrap
const panelsWrap: React.CSSProperties = { position:'absolute', top: 8, left: '50%', transform:'translateX(-50%)', display:'grid', gap:8, width:'calc(100% - 40px)', maxWidth: 440, zIndex: 2 }

const bottomNav: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, padding:8, transform:'translateY(-10px)' }
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
                            {/* Глобально убираем бейдж "coming soon" из оверлей-меню */}
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
    width:'88%',
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
    width:'82%', maxWidth: 420, maxHeight:'85vh',
    background:'linear-gradient(180deg, #3d74c6 0%, #2b66b9 100%)',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 12,
    paddingBottom: 42,
    overflowY:'auto' as const,
    overflowX:'hidden' as const,
    boxSizing:'border-box' as const
}

// Invite friends: more dark-blue body (closer to the light-blue border color)
const inviteSheetInvite: React.CSSProperties = {
    ...inviteSheet,
    width:'86%',
    maxWidth: 460,
    padding: 14,
    paddingBottom: 46,
    background:'linear-gradient(180deg, #1f4d8f 0%, #0b2f68 100%)',
    boxShadow:'inset 0 0 0 3px rgba(140,188,255,0.6), 0 -10px 26px rgba(0,0,0,0.45)',
}

const shopSheet: React.CSSProperties = {
    position:'absolute', left:'50%', bottom:0, transform:'translateX(-50%)',
    width:'82%', maxWidth: 420, maxHeight:'85vh',
    background:'linear-gradient(180deg, #1f4d8f 0%, #153a6b 100%)',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 12,
    paddingBottom: 42,
    overflowY:'auto' as const,
    overflowX:'hidden' as const,
    boxSizing:'border-box' as const
}

const inviteSheetHeader: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 36px', alignItems:'center', marginBottom:10 }
// универсальная круглая кнопка закрытия для всех вкладок/окон
const sheetCloseArrow: React.CSSProperties = { 
    width:36, 
    height:36, 
    borderRadius:'50%', 
    border:'none', 
    background:'linear-gradient(180deg,#ffffff 0%, #dbeafe 100%)', 
    color:'#0b2f68', 
    fontSize:18, 
    fontWeight:900, 
    boxShadow:'0 4px 10px rgba(0,0,0,0.35), inset 0 0 0 2px #0b2f68', 
    cursor:'pointer' 
}
const inviteGrabWrap: React.CSSProperties = { display:'grid', placeItems:'center', paddingTop:6, paddingBottom:2, cursor:'pointer' }
const inviteGrabBar: React.CSSProperties = { width:48, height:6, borderRadius:3, background:'rgba(255,255,255,0.8)', boxShadow:'0 1px 0 rgba(0,0,0,0.2), inset 0 0 0 2px rgba(11,47,104,0.6)' }
const settingsFloatBtn: React.CSSProperties = { position:'fixed' } // not used anymore
// Invite redesign styles
const inviteHeroImg: React.CSSProperties = { width:110, height:110, objectFit:'contain', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))' }
const inviteTitleLarge: React.CSSProperties = { textAlign:'center', color:'#fff', fontWeight:900, fontSize:24, letterSpacing:1.2, textShadow:'0 2px 0 rgba(0,0,0,0.35)' }
const inviteSubtitlePill: React.CSSProperties = { padding:'6px 10px', background:'#ffffff', borderRadius:10, display:'inline-block', boxShadow:'0 3px 0 rgba(0,0,0,0.2)', color:'#0b2f68', fontWeight:900 }
const inviteCtaPill: React.CSSProperties = { display:'grid', gridAutoFlow:'column', alignItems:'center', justifyContent:'center', gap:6, padding:'14px 16px', background:'linear-gradient(180deg,#5aa2ff,#2b66b9)', color:'#fff', border:'none', borderRadius:26, fontWeight:900, boxShadow:'inset 0 0 0 3px #0b2f68', cursor:'pointer' }
const friendsHeaderLbl: React.CSSProperties = { color:'#fff', fontWeight:900, fontSize:18, textShadow:'0 2px 0 rgba(0,0,0,0.35)', textAlign:'center' }
const friendsRefreshBtn: React.CSSProperties = { width:32, height:32, borderRadius:10, border:'none', background:'#1e4b95', color:'#bfe0ff', fontSize:18, fontWeight:900, boxShadow:'inset 0 0 0 2px #0b2f68', cursor:'pointer' }
const friendRow: React.CSSProperties = { display:'grid', gridTemplateColumns:'56px 1fr auto', alignItems:'center', gap:12, padding:'12px 14px', background:'linear-gradient(180deg,#6bb3ff,#2b66b9)', borderRadius:26, boxShadow:'inset 0 0 0 3px #0b2f68' }
const friendAvatar: React.CSSProperties = { width:56, height:56, borderRadius:'50%', display:'grid', placeItems:'center', background:'#fff', boxShadow:'inset 0 0 0 3px #0b2f68' }
const friendName: React.CSSProperties = { color:'#fff', fontWeight:900, letterSpacing:1, textShadow:'0 1px 0 rgba(0,0,0,0.35)' }
const friendAmount: React.CSSProperties = { color:'#fff', fontWeight:900, textShadow:'0 1px 0 rgba(0,0,0,0.35)', display:'grid', gridAutoFlow:'column', alignItems:'center' }

const newsPopup: React.CSSProperties = {
    width:'88%',
    maxWidth: 460,
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
    ...sheetCloseArrow,
    width:32,
    height:32,
}

const sheet: React.CSSProperties = {
    position:'absolute',
    left:'50%',
    top:'50%',
    transform:'translate(-50%, -50%)',
    width:'88%',
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
    width:'82%', maxWidth: 420, maxHeight:'72vh',
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
const inviteInnerWrap: React.CSSProperties = { 
    background:'linear-gradient(180deg, #2a67b7 0%, #1a4b97 100%)', // темно-синий фон как в DailyBonus
    borderRadius:20, 
    padding:16, 
    display:'grid', 
    gap:12,
    width:'88%',
    margin:'0 auto',
    position:'relative',
    pointerEvents:'none'
}

const inviteContentWrap: React.CSSProperties = {
    position:'relative',
    zIndex:1,
    padding:0,
    display:'grid',
    gap:12,
    pointerEvents:'auto'
}


// центрированное модальное окно для подсказок (используется для Invite)
const centerInfoOverlay: React.CSSProperties = {
    position:'fixed', left:0, right:0, top:0, bottom:0,
    background:'rgba(0,0,0,0.7)',
    display:'grid', placeItems:'center',
    zIndex:90,
    animation:'overlayFadeIn 260ms ease-out'
}
const centerInfoCard: React.CSSProperties = {
    width:'88%',
    maxWidth:420,
    background:'linear-gradient(180deg,#3d74c6 0%, #2b66b9 100%)',
    borderRadius:16,
    boxShadow:'inset 0 0 0 3px #0b2f68, 0 10px 24px rgba(0,0,0,0.45)',
    padding:14
}

function LeaderboardPanel({ onClose, userId, username, avatarUrl, t, lang }: { onClose: () => void, userId: number | null, username: string, avatarUrl: string, t: (k:string, vars?: Record<string, any>) => string, lang: 'ru'|'en' }) {
    type LeaderboardEntry = { id: number, name: string, photo: string | null, level: number, coins: number }
    const [topPlayers, setTopPlayers] = React.useState<LeaderboardEntry[]>([])
    const [myRank, setMyRank] = React.useState<number | null>(null)
    const [myData, setMyData] = React.useState<LeaderboardEntry | null>(null)
    const [totalPlayers, setTotalPlayers] = React.useState<number>(0)
    const [loading, setLoading] = React.useState<boolean>(true)
    const [infoOpen, setInfoOpen] = React.useState<boolean>(false)

    React.useEffect(() => {
        async function fetchLeaderboard() {
            try {
                // Жёстко указываем backend для рейтинга
                const API_BASE = 'https://speen-server.onrender.com'
                
                // Fetch top 10
                const topUrl = `${API_BASE}/api/leaderboard/top?limit=10`
                const topRes = await fetch(topUrl)
                if (topRes.ok) {
                    const topData = await topRes.json()
                    setTopPlayers(topData.items || [])
                }
                
                // Fetch current player rank
                if (userId) {
                    const rankUrl = `${API_BASE}/api/leaderboard/rank/${userId}`
                    const rankRes = await fetch(rankUrl)
                    if (rankRes.ok) {
                        const rankData = await rankRes.json()
                        setMyRank(rankData.rank)
                        setMyData(rankData.player)
                        setTotalPlayers(rankData.total)
                    }
                }
            } catch (e) {
                console.error('Failed to fetch leaderboard:', e)
            } finally {
                setLoading(false)
            }
        }
        
        if (userId) {
            fetchLeaderboard()
        }
    }, [userId])

    const wrap: React.CSSProperties = { 
        background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)', 
        borderRadius:20, 
        padding:16, 
        boxShadow:'inset 0 0 0 3px #0b2f68', 
        width:'88%', 
        margin:'0 auto', 
        position:'relative',
        display:'grid',
        gap:14
    }
    
    const titleWrap: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4 }
    const title: React.CSSProperties = { 
        textAlign:'center', 
        color:'#fff', 
        fontWeight:900, 
        fontSize:22, 
        letterSpacing:1.2, 
        textShadow:'0 2px 0 rgba(0,0,0,0.35)' 
    }
    const infoBtn: React.CSSProperties = { 
        width:24, height:24, borderRadius:'50%', 
        background:'rgba(255,255,255,0.2)', 
        border:'2px solid rgba(255,255,255,0.4)', 
        color:'#fff', 
        fontWeight:900, 
        fontSize:14, 
        display:'grid', 
        placeItems:'center', 
        cursor:'pointer',
        transition:'all 120ms ease',
        boxShadow:'0 2px 4px rgba(0,0,0,0.2)'
    }
    
    const subtitle: React.CSSProperties = {
        textAlign:'center',
        color:'#e8f1ff',
        fontSize:13,
        fontWeight:700,
        opacity:0.9,
        lineHeight:1.4
    }
    
    const playerCard: React.CSSProperties = {
        display:'grid',
        gridTemplateColumns:'auto 56px minmax(0,1fr) auto',
        alignItems:'center',
        gap:10,
        padding:'10px 12px',
        background:'linear-gradient(180deg,#6bb3ff,#2b66b9)',
        borderRadius:20,
        boxShadow:'inset 0 0 0 3px #0b2f68',
        animation:'friendSlideIn 400ms ease-out both',
        width:'100%',
        boxSizing:'border-box'
    }
    
    const myPlayerCard: React.CSSProperties = {
        ...playerCard,
        background:'linear-gradient(135deg, #ffd700 0%, #f2a93b 100%)',
        boxShadow:'0 0 0 3px #ffd700, inset 0 0 0 3px #7a4e06'
    }
    
    const avatar: React.CSSProperties = {
        width:56,
        height:56,
        borderRadius:'50%',
        display:'grid',
        placeItems:'center',
        background:'#fff',
        boxShadow:'inset 0 0 0 3px #0b2f68',
        overflow:'hidden'
    }
    
    const playerInfo: React.CSSProperties = {
        display:'grid',
        gap:4,
        minWidth:0
    }
    
    const playerName: React.CSSProperties = {
        color:'#fff',
        fontWeight:900,
        fontSize:15,
        textShadow:'0 1px 0 rgba(0,0,0,0.35)',
        whiteSpace:'nowrap',
        overflow:'hidden',
        textOverflow:'ellipsis',
        maxWidth:'100%'
    }
    
    const playerLevel: React.CSSProperties = {
        color:'#ffe27a',
        fontSize:12,
        fontWeight:700,
        display:'flex',
        alignItems:'center',
        gap:4
    }
    
    const coinsDisplay: React.CSSProperties = {
        color:'#fff',
        fontWeight:900,
        fontSize:13,
        display:'flex',
        alignItems:'center',
        gap:4,
        textShadow:'0 1px 0 rgba(0,0,0,0.35)',
        justifyContent:'flex-end'
    }

    const infoModal: React.CSSProperties = {
        position:'fixed', left:0, right:0, top:0, bottom:0,
        background:'rgba(0,0,0,0.7)',
        display:'grid', placeItems:'center',
        zIndex:10000,
        pointerEvents: infoOpen ? 'auto' : 'none',
        opacity: infoOpen ? 1 : 0,
        transition:'opacity 200ms ease'
    }
    const infoModalContent: React.CSSProperties = {
        background:'linear-gradient(180deg,#2a67b7 0%, #1a4b97 100%)',
        borderRadius:20,
        padding:20,
        maxWidth:'85%',
        boxShadow:'inset 0 0 0 3px #0b2f68, 0 8px 24px rgba(0,0,0,0.4)',
        transform: infoOpen ? 'scale(1)' : 'scale(0.9)',
        transition:'transform 200ms ease'
    }

    return (
        <>
        <div style={wrap}>
            <div style={{display:'grid', placeItems:'center', marginTop:4}}>
                <img src="/reiting.png" alt="leaderboard" style={{width:180, height:180, objectFit:'contain', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'}} />
            </div>
            <div style={titleWrap}>
                <div style={title}>{lang==='ru' ? 'Рейтинг игроков' : 'Leaderboard'}</div>
                <button 
                    style={infoBtn} 
                    onClick={() => setInfoOpen(true)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                >
                    i
                </button>
            </div>
            
            {loading ? (
                <div style={{color:'#e8f1ff', textAlign:'center', padding:20}}>
                    {lang==='ru' ? 'Загрузка...' : 'Loading...'}
                </div>
            ) : (
                <>
                    {/* My Position */}
                    {myRank && myData && (
                        <div style={{marginTop:8}}>
                            <div style={{color:'#ffe27a', fontWeight:900, fontSize:14, marginBottom:8, textAlign:'center'}}>
                                {lang==='ru' ? 'Ваша позиция' : 'Your Position'}
                            </div>
                            <div style={myPlayerCard}>
                                <div style={{color:'#7a4e06', fontWeight:900, fontSize:16, minWidth:40}}>
                                    {`#${myRank}`}
                                </div>
                                <div style={avatar}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="you" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                    ) : (
                                        <div style={{
                                            width:'100%',
                                            height:'100%',
                                            borderRadius:'50%',
                                            background:'linear-gradient(135deg, #ffd86b 0%, #f2a93b 100%)',
                                            display:'grid',
                                            placeItems:'center',
                                            fontSize:24,
                                            fontWeight:900,
                                            color:'#7a4e06'
                                        }}>
                                            {(username?.[0] || '?').toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div style={playerInfo}>
                                    <div style={{...playerName, color:'#7a4e06'}}>{username || 'You'}</div>
                                <div style={{...playerLevel, color:'#7a4e06'}}>
                                        <span>⭐</span>
                                        <span>lvl {myData.level}</span>
                                    </div>
                                </div>
                                <div style={{...coinsDisplay, color:'#7a4e06'}}>
                                    <img src="/coin-w.png" alt="W" style={{width:22,height:22}} />
                                    {myData.coins >= 1000 ? `${(myData.coins/1000).toFixed(1)}K` : myData.coins}
                                </div>
                            </div>
                            <div style={{color:'#e8f1ff', fontSize:12, textAlign:'center', marginTop:6, opacity:0.8}}>
                                {lang==='ru' ? `из ${totalPlayers} игроков` : `of ${totalPlayers} players`}
                            </div>
                        </div>
                    )}
                    
                    {/* Top 10 */}
                    <div style={{marginTop:12}}>
                        <div style={{color:'#fff', fontWeight:900, fontSize:16, marginBottom:10, textAlign:'center', textShadow:'0 2px 0 rgba(0,0,0,0.35)'}}>
                            🏆 {lang==='ru' ? 'Топ-10 игроков' : 'Top 10 Players'}
                        </div>
                        <div style={{display:'grid', gap:10}}>
                            {topPlayers.length === 0 ? (
                                <div style={{color:'#e8f1ff', textAlign:'center', opacity:.85}}>
                                    {lang==='ru' ? 'Пока нет игроков' : 'No players yet'}
                                </div>
                            ) : topPlayers.map((player, idx) => {
                                const isMe = player.id === userId
                                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null
                                
                                return (
                                    <div 
                                        key={player.id} 
                                        style={{
                                            ...(isMe ? myPlayerCard : playerCard),
                                            animationDelay: `${idx * 60}ms`
                                        }}
                                    >
                                        <div style={{
                                            fontWeight:900,
                                            fontSize:16,
                                            minWidth:40,
                                            color: isMe ? '#7a4e06' : '#fff',
                                            textAlign:'left'
                                        }}>
                                            {medal || `#${idx + 1}`}
                                        </div>
                                        <div style={avatar}>
                                            {player.photo ? (
                                                <img src={player.photo} alt={player.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                            ) : (
                                                <div style={{
                                                    width:'100%',
                                                    height:'100%',
                                                    borderRadius:'50%',
                                                    background:'linear-gradient(135deg, #ffd86b 0%, #f2a93b 100%)',
                                                    display:'grid',
                                                    placeItems:'center',
                                                    fontSize:24,
                                                    fontWeight:900,
                                                    color:'#7a4e06'
                                                }}>
                                                    {(player.name?.[0] || '?').toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={playerInfo}>
                                            <div style={isMe ? {...playerName, color:'#7a4e06'} : playerName}>{player.name || 'Player'}</div>
                                            <div style={isMe ? {...playerLevel, color:'#7a4e06'} : playerLevel}>
                                                <span>⭐</span>
                                                <span>lvl {player.level}</span>
                                            </div>
                                        </div>
                                        <div style={isMe ? {...coinsDisplay, color:'#7a4e06'} : coinsDisplay}>
                                            <img src="/coin-w.png" alt="W" style={{width:22,height:22}} />
                                            {player.coins >= 1000 ? `${(player.coins/1000).toFixed(1)}K` : player.coins}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
        {infoOpen && (
            <div style={infoModal} onClick={() => setInfoOpen(false)}>
                <div style={infoModalContent} onClick={(e)=>e.stopPropagation()}>
                    <div style={{color:'#e8f1ff', textAlign:'center', fontWeight:800, lineHeight:1.4}}>
                        {lang==='ru'
                            ? 'Отслеживай свои достижения в рейтинге среди игроков по всему миру. Стань лучшим — займи верхнюю строчку!'
                            : 'Track your achievements in the global leaderboard. Climb to the very top and become the best!'}
                    </div>
                    <div style={{display:'grid', placeItems:'center', marginTop:16}}>
                        <button style={inviteSecondaryBtn} onClick={() => setInfoOpen(false)}>{t('close')}</button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}

function createMenuItemsLeft(tr: (k:string)=>string): Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode, action?: 'invite' | 'daily' | 'shop' | 'ton' | 'leaderboard' | 'telegram_group' }> {
    return [
        { title: tr('press1_title'), badgeImg:'/coming1.png', action: 'ton', icon: <PressIcon src="/press1.png" alt="press1" fallbackEmoji="🙂" /> },
        { title: tr('press2_title'), badgeImg:'/coming1.png', action: 'invite', icon: <PressIcon src="/press2.png" alt="press2" fallbackEmoji="🙂" /> },
        { title: tr('press3_title'), badgeImg:'/coming1.png', action: 'daily', icon: <PressIcon src="/press3.png" alt="press3" fallbackEmoji="🙂" /> },
        { title: tr('press4_title'), action: 'leaderboard', icon: <PressIcon src="/press4.png" alt="press4" fallbackEmoji="🙂" /> },
        { title: tr('press5_title'), badgeImg:'/coming1.png', action: 'shop', icon: <PressIcon src="/press5.png" alt="press5" fallbackEmoji="🙂" /> },
        { title: tr('press6_title'), action: 'telegram_group', icon: <PressIcon src="/press6.png" alt="press6" fallbackEmoji="🙂" /> },
    ]
}

function createMenuItemsRight(tr: (k:string)=>string): Array<{ title: string, subtitle?: string, badge?: string, badgeImg?: string, icon: React.ReactNode, action?: 'wheelshop' | 'tasks' | 'news' }> {
    return [
        { title: tr('press7_title'), subtitle: tr('press7_sub'), action: 'wheelshop', icon: <PressIcon src="/press7.png" alt="press7" fallbackEmoji="🙂" /> },
        { title: tr('press8_title'), subtitle: tr('press8_sub'), badgeImg:'/coming1.png', icon: <PressIcon src="/press8.png" alt="press8" fallbackEmoji="🙂" /> },
        { title: tr('press9_title'), subtitle: tr('press9_sub'), action: 'tasks', icon: <PressIcon src="/press9.png" alt="press9" fallbackEmoji="🙂" /> },
        { title: tr('press10_title'), subtitle: tr('press10_sub'), badgeImg:'/coming1.png', icon: <PressIcon src="/press10.png" alt="press10" fallbackEmoji="🙂" /> },
        { title: tr('press11_title'), subtitle: tr('press11_sub'), action: 'news', icon: <PressIcon src="/press11.png" alt="press11" fallbackEmoji="🙂" /> },
    ]
}





