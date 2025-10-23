import React from 'react'

type ImageWheelProps = {
    size?: number
    imageSrc: string
    labels: string[]
    startOffsetDeg?: number
    onResult?: (index: number, label: string) => void
    onBeforeSpin?: () => boolean | void
    onSpinningChange?: (spinning: boolean) => void
    selectedIndex?: number | null
    onSelectIndex?: (index: number, label: string) => void
    onOpenBonuses?: () => void
    selectedBonusIndex?: number | null
    onSelectBonusSector?: (index: number) => void
}

export function ImageWheel({ size = 260, imageSrc, labels, startOffsetDeg = 0, onResult, onBeforeSpin, onSpinningChange, selectedIndex, onSelectIndex, onOpenBonuses, selectedBonusIndex, onSelectBonusSector }: ImageWheelProps) {
    const seg = 360 / labels.length
    const SECTOR_OFFSET = 2 // визуальное смещение: фактически выпадает сектор на 2 больше
    // Pointer offsets from original top-center position
    const POINTER_DX = 100 // px to the right from center
    const POINTER_DY = 30  // px down from original top (-16 + 30 => top: 14)
    
    // Вычисляем начальное вращение для сектора 0
    const getInitialRotation = () => {
        const cx = size / 2
        const cy = size / 2
        const pointerTop = -16 + POINTER_DY
        const px = cx + POINTER_DX
        const py = pointerTop
        const pointerAzimuth = Math.atan2(py - cy, px - cx) * 180 / Math.PI
        const pointerCorrectionDeg = pointerAzimuth + 90
        const physIndex = (0 - SECTOR_OFFSET + labels.length) % labels.length
        const center = physIndex * seg + seg / 2
        return -(center + startOffsetDeg - pointerCorrectionDeg)
    }
    
    const [rotation, setRotation] = React.useState<number>(getInitialRotation())
    const [isSpinning, setIsSpinning] = React.useState<boolean>(false)
    const [highlightVisible, setHighlightVisible] = React.useState<boolean>(false)
    const lastSectorRef = React.useRef<number>(-1)
    const audioContextRef = React.useRef<AudioContext | null>(null)

    function normalizeDeg(d: number) {
        return ((d % 360) + 360) % 360
    }

    function indexFromRotation(rotDeg: number) {
        // Коррекция под положение указателя
        const cx = size / 2
        const cy = size / 2
        const pointerTop = -16 + POINTER_DY
        const px = cx + POINTER_DX
        const py = pointerTop
        const pointerAzimuth = Math.atan2(py - cy, px - cx) * 180 / Math.PI // от центра к указателю
        const pointerCorrectionDeg = pointerAzimuth + 90 // 0 соответствует верхней позиции
        // Какой сектор под указателем при повороте rotDeg
        const a = normalizeDeg(-rotDeg - startOffsetDeg + pointerCorrectionDeg)
        const idx = Math.floor(a / seg) % labels.length
        return (idx + SECTOR_OFFSET) % labels.length
    }

    function computeRotationForIndex(index: number) {
        // Центр целевого сектора должен оказаться под указателем
        const physIndex = (index - SECTOR_OFFSET + labels.length) % labels.length
        const center = physIndex * seg + seg / 2
        // Учесть смещение указателя от верхней позиции
        const cx = size / 2
        const cy = size / 2
        const pointerTop = -16 + POINTER_DY
        const px = cx + POINTER_DX
        const py = pointerTop
        const pointerAzimuth = Math.atan2(py - cy, px - cx) * 180 / Math.PI
        const pointerCorrectionDeg = pointerAzimuth + 90
        // Базовый угол, который приведет центр сектора к указателю
        const base = -(center + startOffsetDeg - pointerCorrectionDeg)
        return base
    }

    const wheelRef = React.useRef<HTMLDivElement | null>(null)
    const timeoutRef = React.useRef<number | null>(null)
    const highlightTimeoutRef = React.useRef<number | null>(null)

    React.useEffect(() => () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
    }, [])

    // Функция воспроизведения глухого звука
    function playTickSound() {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            }
            const ctx = audioContextRef.current
            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()
            
            oscillator.type = 'sine'
            oscillator.frequency.value = 80 // глухой низкий звук
            
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
            
            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)
            
            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + 0.05)
        } catch {}
    }

    // Функция вибрации
    function vibrate() {
        try {
            const tg = (window as any).Telegram?.WebApp
            if (tg?.HapticFeedback?.impactOccurred) {
                tg.HapticFeedback.impactOccurred('light')
            } else if (navigator.vibrate) {
                navigator.vibrate(10)
            }
        } catch {}
    }

    // Отслеживание смены сектора во время вращения
    React.useEffect(() => {
        if (!isSpinning) {
            lastSectorRef.current = -1
            return
        }
        
        const interval = setInterval(() => {
            const currentSector = indexFromRotation(rotation)
            if (currentSector !== lastSectorRef.current) {
                lastSectorRef.current = currentSector
                playTickSound()
                vibrate()
            }
        }, 50) // проверяем каждые 50мс
        
        return () => clearInterval(interval)
    }, [isSpinning, rotation])

    function spin(toIndex?: number) {
        if (isSpinning) return
        if (typeof onBeforeSpin === 'function') {
            const ok = onBeforeSpin()
            if (ok === false) return
        }
        setHighlightVisible(false)
        const targetIndex = typeof toIndex === 'number' ? ((toIndex % labels.length) + labels.length) % labels.length : Math.floor(Math.random() * labels.length)
        // небольшой рандом внутри сектора, чтобы не останавливаться строго по центру
        const jitter = (Math.random() - 0.5) * (seg * 0.4) // ±20% сектора
        const base = computeRotationForIndex(targetIndex) + jitter

        // обеспечим как минимум несколько полных оборотов вперёд
        // больше оборотов для интриги
        const minSpins = 8
        let target = base
        while (target < rotation + minSpins * 360) target += 360

        setIsSpinning(true)
        try { onSpinningChange?.(true) } catch {}
        const degreesToTravel = target - rotation
        // дольше и более плавное замедление
        const duration = Math.max(8.5, Math.min(12.5, degreesToTravel / 360 * 0.9 + 8.5))

        if (wheelRef.current) {
            wheelRef.current.style.transition = `transform ${duration}s cubic-bezier(0.05, 0.85, 0.05, 1)`
        }
        requestAnimationFrame(() => setRotation(target))

        // безопасный коллбэк результата по окончанию анимации
        timeoutRef.current = window.setTimeout(() => {
            setIsSpinning(false)
            try { onSpinningChange?.(false) } catch {}
            const idx = indexFromRotation(target)
            onResult?.(idx, labels[idx])
            setHighlightVisible(true)
            if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
            highlightTimeoutRef.current = window.setTimeout(() => setHighlightVisible(false), 1500)
        }, duration * 1000 + 50)
    }

    function handleSelectAt(evt: React.MouseEvent<HTMLDivElement>) {
        if (isSpinning) return
        const rect = (evt.currentTarget as HTMLDivElement).getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const x = evt.clientX - cx
        const y = evt.clientY - cy
        const r = Math.hypot(x, y)
        const angle = (Math.atan2(y, x) * 180) / Math.PI // 0 at +X, CCW positive
        const a = ((angle % 360) + 360) % 360
        // привести к системе отсчёта указателя (0 на вершине), учесть текущий поворот и стартовый сдвиг
        const imgAngle = ((a + 90 - rotation - startOffsetDeg) % 360 + 360) % 360
        const baseIdx = Math.floor(imgAngle / seg) % labels.length
        const logicalIdx = (baseIdx + SECTOR_OFFSET) % labels.length
        // зоны по радиусу: внутренний бонус-круг и внешний круг чисел
        const innerRMin = size * 0.12
        const innerRMax = size * 0.29
        const outerRMin = size * 0.30
        const outerRMax = size * 0.49
        if (r >= innerRMin && r <= innerRMax) {
            onSelectBonusSector?.(logicalIdx)
            return
        }
        if (r >= outerRMin && r <= outerRMax) {
            onSelectIndex?.(logicalIdx, labels[logicalIdx])
            return
        }
    }

    return (
        <div style={{ position: 'relative', width: size, height: size, touchAction:'none' }} onClick={handleSelectAt}>
            <div
                ref={wheelRef}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundImage: `url(${imageSrc})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: `rotate(${rotation}deg)`,
                    willChange: 'transform',
                    filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.35))',
                    position: 'relative'
                }}
                onTransitionEnd={() => {
                    if (!isSpinning) return
                    setIsSpinning(false)
                    try { onSpinningChange?.(false) } catch {}
                    const idx = indexFromRotation(rotation)
                    onResult?.(idx, labels[idx])
                    setHighlightVisible(true)
                    if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
                    highlightTimeoutRef.current = window.setTimeout(() => setHighlightVisible(false), 1500)
                }}
            >
                {/* цельное кольцо бонусов поверх колеса */}
                <img
                    src="/bonus.png"
                    alt="bonus-ring"
                    style={{ position:'absolute', left: '50%', top: '50%', width: '100%', height: '100%', objectFit:'contain', pointerEvents:'none', transform: 'translate(-50%, -50%) scale(0.5)' }}
                />
            </div>
            {!isSpinning && typeof selectedIndex === 'number' && (
                <svg
                    width={size}
                    height={size}
                    style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
                    viewBox={`0 0 ${size} ${size}`}
                >
                    {(() => {
                        const cx = size / 2
                        const cy = size / 2
                        const rOuter = size * 0.49
                        const rInner = size * 0.30
                        const physIndex = (selectedIndex - SECTOR_OFFSET + labels.length) % labels.length
                        const center = physIndex * seg + seg / 2
                        const centerScreen = ((center + rotation + startOffsetDeg) % 360 + 360) % 360
                        const startDeg = centerScreen - seg / 2 - 90
                        const endDeg = centerScreen + seg / 2 - 90
                        const toRad = (d: number) => (Math.PI / 180) * d
                        const sx = cx + rOuter * Math.cos(toRad(startDeg))
                        const sy = cy + rOuter * Math.sin(toRad(startDeg))
                        const ex = cx + rOuter * Math.cos(toRad(endDeg))
                        const ey = cy + rOuter * Math.sin(toRad(endDeg))
                        const sxi = cx + rInner * Math.cos(toRad(startDeg))
                        const syi = cy + rInner * Math.sin(toRad(startDeg))
                        const exi = cx + rInner * Math.cos(toRad(endDeg))
                        const eyi = cy + rInner * Math.sin(toRad(endDeg))
                        const largeArc = endDeg - startDeg <= 180 ? 0 : 1
                        const dOuter = `M ${sxi} ${syi} L ${sx} ${sy} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${ex} ${ey} L ${exi} ${eyi} A ${rInner} ${rInner} 0 ${largeArc} 0 ${sxi} ${syi} Z`
                        return (
                            <path d={dOuter} fill="rgba(76, 217, 100, 0.35)" stroke="#22c55e" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.9))' }} />
                        )
                    })()}
                </svg>
            )}
            {!isSpinning && typeof selectedBonusIndex === 'number' && selectedBonusIndex != null && (
                <svg
                    width={size}
                    height={size}
                    style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
                    viewBox={`0 0 ${size} ${size}`}
                >
                    {(() => {
                        const cx = size / 2
                        const cy = size / 2
                        const segDeg = seg
                        const physIndex = (selectedBonusIndex - SECTOR_OFFSET + labels.length) % labels.length
                        const center = physIndex * segDeg + segDeg / 2
                        const centerScreen = ((center + rotation + startOffsetDeg) % 360 + 360) % 360
                        const startDeg = centerScreen - segDeg / 2 - 90
                        const endDeg = centerScreen + segDeg / 2 - 90
                        const toRad = (d: number) => (Math.PI / 180) * d
                        // внутренний бонус-круг
                        const rOuter2 = size * 0.29
                        const rInner2 = size * 0.12
                        const sx2 = cx + rOuter2 * Math.cos(toRad(startDeg))
                        const sy2 = cy + rOuter2 * Math.sin(toRad(startDeg))
                        const ex2 = cx + rOuter2 * Math.cos(toRad(endDeg))
                        const ey2 = cy + rOuter2 * Math.sin(toRad(endDeg))
                        const sxi2 = cx + rInner2 * Math.cos(toRad(startDeg))
                        const syi2 = cy + rInner2 * Math.sin(toRad(startDeg))
                        const exi2 = cx + rInner2 * Math.cos(toRad(endDeg))
                        const eyi2 = cy + rInner2 * Math.sin(toRad(endDeg))
                        const largeArc = endDeg - startDeg <= 180 ? 0 : 1
                        const dInner = `M ${sxi2} ${syi2} L ${sx2} ${sy2} A ${rOuter2} ${rOuter2} 0 ${largeArc} 1 ${ex2} ${ey2} L ${exi2} ${eyi2} A ${rInner2} ${rInner2} 0 ${largeArc} 0 ${sxi2} ${syi2} Z`
                        return (
                            <path d={dInner} fill="rgba(255, 231, 76, 0.5)" stroke="#ffd23a" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 8px rgba(255,220,60,0.8))' }} />
                        )
                    })()}
                </svg>
            )}
            {highlightVisible && (
                <svg
                    width={size}
                    height={size}
                    style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
                    viewBox={`0 0 ${size} ${size}`}
                >
                    {(() => {
                        const cx = size / 2
                        const cy = size / 2
                        const rOuter = size * 0.49
                        const rInner = size * 0.30
                        // смещение клина с учётом реального положения сектора под указателем (с учётом смещённого указателя)
                        const pointerTop = -16 + POINTER_DY
                        const px = cx + POINTER_DX
                        const py = pointerTop
                        const pointerAzimuth = Math.atan2(py - cy, px - cx) * 180 / Math.PI
                        const pointerCorrectionDeg = pointerAzimuth + 90
                        const a = normalizeDeg(-rotation - startOffsetDeg + pointerCorrectionDeg)
                        const sectorStart = Math.floor(a / seg) * seg
                        const sectorCenter = sectorStart + seg / 2
                        const offsetDeg = sectorCenter - a // (-seg/2..+seg/2) - смещение относительно сектора
                        const startDeg = offsetDeg - seg / 2 - 90 + pointerCorrectionDeg
                        const endDeg = offsetDeg + seg / 2 - 90 + pointerCorrectionDeg
                        const toRad = (d: number) => (Math.PI / 180) * d
                        const sx = cx + rOuter * Math.cos(toRad(startDeg))
                        const sy = cy + rOuter * Math.sin(toRad(startDeg))
                        const ex = cx + rOuter * Math.cos(toRad(endDeg))
                        const ey = cy + rOuter * Math.sin(toRad(endDeg))
                        const sxi = cx + rInner * Math.cos(toRad(startDeg))
                        const syi = cy + rInner * Math.sin(toRad(startDeg))
                        const exi = cx + rInner * Math.cos(toRad(endDeg))
                        const eyi = cy + rInner * Math.sin(toRad(endDeg))
                        const largeArc = endDeg - startDeg <= 180 ? 0 : 1
                        const dOuter = `M ${sxi} ${syi} L ${sx} ${sy} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${ex} ${ey} L ${exi} ${eyi} A ${rInner} ${rInner} 0 ${largeArc} 0 ${sxi} ${syi} Z`

                        // второй клин ниже (над областью цифр)
                        const rOuter2 = size * 0.29
                        const rInner2 = size * 0.12
                        const sx2 = cx + rOuter2 * Math.cos(toRad(startDeg))
                        const sy2 = cy + rOuter2 * Math.sin(toRad(startDeg))
                        const ex2 = cx + rOuter2 * Math.cos(toRad(endDeg))
                        const ey2 = cy + rOuter2 * Math.sin(toRad(endDeg))
                        const sxi2 = cx + rInner2 * Math.cos(toRad(startDeg))
                        const syi2 = cy + rInner2 * Math.sin(toRad(startDeg))
                        const exi2 = cx + rInner2 * Math.cos(toRad(endDeg))
                        const eyi2 = cy + rInner2 * Math.sin(toRad(endDeg))
                        const dInner = `M ${sxi2} ${syi2} L ${sx2} ${sy2} A ${rOuter2} ${rOuter2} 0 ${largeArc} 1 ${ex2} ${ey2} L ${exi2} ${eyi2} A ${rInner2} ${rInner2} 0 ${largeArc} 0 ${sxi2} ${syi2} Z`

                        return (
                            <g>
                                <path
                                    d={dOuter}
                                    fill="rgba(255, 231, 76, 0.55)"
                                    stroke="#ffd23a"
                                    strokeWidth={2}
                                    style={{ filter: 'drop-shadow(0 0 10px rgba(255,220,60,0.9))' }}
                                />
                                <path
                                    d={dInner}
                                    fill="rgba(255, 239, 120, 0.65)"
                                    stroke="#ffe35c"
                                    strokeWidth={2}
                                    style={{ filter: 'drop-shadow(0 0 8px rgba(255,230,90,0.9))' }}
                                />
                            </g>
                        )
                    })()}
                </svg>
            )}
            {/* указатель со смещением; ориентируем остриём к центру */}
            {(() => {
                const cx = size / 2
                const cy = size / 2
                const pointerTop = -16 + POINTER_DY
                const px = cx + POINTER_DX
                const py = pointerTop
                const angleToCenter = Math.atan2(cy - py, cx - px) * 180 / Math.PI // от указателя к центру
                const rotateDeg = angleToCenter + 90 // апекс вверх => +90 чтобы смотреть по вектору
                return (
                    <div style={{ position: 'absolute', left: `calc(50% + ${POINTER_DX}px)`, top: pointerTop, transform: `translateX(-50%) rotate(${rotateDeg}deg)`, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.35))' }}>
                        <svg width="34" height="40" viewBox="0 0 34 40">
                            <defs>
                                <linearGradient id="g2" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="#bcd7ff" stopOpacity="0.6" />
                                </linearGradient>
                            </defs>
                            <path d="M17 0 L34 22 L0 22 Z" fill="#ff3b30" stroke="#7a1d12" strokeWidth={2}/>
                        </svg>
                    </div>
                )
            })()}
            {/* плюс-иконка слева снизу, параллельно треугольнику */}
            {(() => {
                const PLUS_SIZE = 48
                const cx = size / 2
                const cy = size / 2
                const pointerTop = -16 + POINTER_DY
                const px = cx + POINTER_DX
                const py = pointerTop
                const angleToCenter = Math.atan2(cy - py, cx - px) * 180 / Math.PI
                const rotateDeg = angleToCenter + 90
                return (
                    <div
                        role="button"
                        aria-label="Открыть бонусы"
                        onClick={(e) => { e.stopPropagation(); if (!isSpinning) onOpenBonuses?.() }}
                        style={{ position:'absolute', left: 12, bottom: 12, width: PLUS_SIZE, height: PLUS_SIZE, transform:`rotate(${rotateDeg + 55}deg)`, transformOrigin:'50% 50%', cursor: isSpinning ? 'default' : 'pointer', zIndex: 3 }}
                    >
                        <img src="/plus.png" alt="plus" style={{ width: '100%', height: '100%', objectFit:'contain', filter:'drop-shadow(0 6px 10px rgba(0,0,0,0.25))', pointerEvents:'none' }} />
                    </div>
                )
            })()}


            {/* центральная кнопка старта */}
            <button
                type="button"
                onClick={() => spin()}
                disabled={isSpinning}
                aria-label={isSpinning ? 'Крутится' : 'Крутить'}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: Math.round(size * 0.26),
                    height: Math.round(size * 0.26),
                    borderRadius: '50%',
                    border: 'none',
                    background: `url(/center.png) center/contain no-repeat`,
                    boxShadow: '0 6px 12px rgba(0,0,0,0.35)',
                    cursor: isSpinning ? 'default' : 'pointer',
                    display: isSpinning ? 'none' : 'block',
                }}
            />
        </div>
    )
}


