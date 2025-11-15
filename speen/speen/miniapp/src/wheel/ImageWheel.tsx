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
    hideCenterButton?: boolean // Скрыть центральную кнопку (для режима 3/10)
    disableSelection?: boolean // Заблокировать выбор числа и бонусного сектора
}

export type ImageWheelRef = {
    spin: (toIndex?: number) => void
}

export const ImageWheel = React.forwardRef<ImageWheelRef, ImageWheelProps>(({ size = 260, imageSrc, labels, startOffsetDeg = 0, onResult, onBeforeSpin, onSpinningChange, selectedIndex, onSelectIndex, onOpenBonuses, selectedBonusIndex, onSelectBonusSector, hideCenterButton = false, disableSelection = false }, ref) => {
    const seg = 360 / labels.length
    const SECTOR_OFFSET = 2 // визуальное смещение: фактически выпадает сектор на 2 больше
    // Положение указателя (пропорционально размеру колеса для адаптивности)
    const POINTER_DX = size * 0.30 + 10 // правее: смещение вправо на 10px
    const POINTER_DY = size * 0.031 + 10 // ниже: смещение вниз на 10px
    const TIP_FINE_DEG = 3 // тонкая калибровка совмещения центра сектора под острым углом

    // Выставляем старт так, чтобы колесо было повернуто на 55 градусов (50 + 5 по часовой стрелке)
    const getInitialRotation = () => {
        return 55
    }
    
    const [rotation, setRotation] = React.useState<number>(getInitialRotation())
    const rotationRef = React.useRef<number>(getInitialRotation())
    const [isSpinning, setIsSpinning] = React.useState<boolean>(false)
    // Вопросительные знаки на внутреннем (бонусном) кольце: по умолчанию скрываем бонусы
    const [concealInner, setConcealInner] = React.useState<boolean>(true)
    const [highlightVisible, setHighlightVisible] = React.useState<boolean>(false)
    const lastSectorRef = React.useRef<number>(-1)
    const audioContextRef = React.useRef<AudioContext | null>(null)
    const centerBtnRef = React.useRef<HTMLButtonElement | null>(null)
    const prevHideCenterButtonRef = React.useRef<boolean>(hideCenterButton)
    
    // Синхронизируем ref с состоянием rotation
    React.useEffect(() => {
        rotationRef.current = rotation
    }, [rotation])
    
    // Сбрасываем вращение кнопки когда hideCenterButton меняется с true на false (завершение режима 3/10)
    React.useEffect(() => {
        if (prevHideCenterButtonRef.current === true && hideCenterButton === false) {
            // Режим 3/10 завершился - сбрасываем вращение кнопки
            if (centerBtnRef.current) {
                centerBtnRef.current.style.transition = 'transform 200ms ease'
                centerBtnRef.current.style.transform = 'translate(-50%, -50%) rotate(0deg)'
            }
        }
        prevHideCenterButtonRef.current = hideCenterButton
    }, [hideCenterButton])

    function normalizeDeg(d: number) {
        return ((d % 360) + 360) % 360
    }

    function indexFromRotation(rotDeg: number) {
        // Коррекция под положение указателя (как было)
        const cx = size / 2
        const cy = size / 2
        const pointerTop = -16 + POINTER_DY
        const px = cx + POINTER_DX
        const py = pointerTop
        const pointerAzimuth = Math.atan2(py - cy, px - cx) * 180 / Math.PI // от центра к указателю
        const pointerCorrectionDeg = pointerAzimuth + 90 + TIP_FINE_DEG // 0 соответствует верхней позиции + калибровка
        // Какой сектор под указателем при повороте rotDeg
        const a = normalizeDeg(-rotDeg - startOffsetDeg + pointerCorrectionDeg)
        const idx = Math.floor(a / seg) % labels.length
        return (idx + SECTOR_OFFSET) % labels.length
    }

    function computeRotationForIndex(index: number) {
        // Центр целевого сектора должен оказаться под указателем (как было)
        const physIndex = (index - SECTOR_OFFSET + labels.length) % labels.length
        const center = physIndex * seg + seg / 2
        // Учесть смещение указателя от верхней позиции
        const cx = size / 2
        const cy = size / 2
        const pointerTop = -(size * 0.062) + POINTER_DY // пропорционально размеру (было -16 для 260px)
        const px = cx + POINTER_DX
        const py = pointerTop
        const pointerAzimuth = Math.atan2(py - cy, px - cx) * 180 / Math.PI
        const pointerCorrectionDeg = pointerAzimuth + 90 + TIP_FINE_DEG
        // Базовый угол, который приведет центр сектора к указателю
        const base = -(center + startOffsetDeg - pointerCorrectionDeg)
        return base
    }

    // Позиция кнопки плюс: по диагонали через центр (противоположная сторона от указателя)
    function getPlusCenter(): { x: number, y: number } {
        const cx = size / 2
        const cy = size / 2
        const pointerTop = -(size * 0.062) + POINTER_DY
        const px = cx + POINTER_DX
        const py = pointerTop
        const pointerAzimuth = Math.atan2(py - cy, px - cx) // рад
        const plusAngle = pointerAzimuth + Math.PI // противоположное направление
        const r = size * 0.48 // радиус размещения плюса - чуть ниже, но все еще на колесе
        const x = cx + r * Math.cos(plusAngle)
        const y = cy + r * Math.sin(plusAngle)
        return { x, y }
    }

    const wheelRef = React.useRef<HTMLDivElement | null>(null)
    const timeoutRef = React.useRef<number | null>(null)
    const highlightTimeoutRef = React.useRef<number | null>(null)
    const innerResetTimeoutRef = React.useRef<number | null>(null)

    React.useEffect(() => () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
        if (innerResetTimeoutRef.current) window.clearTimeout(innerResetTimeoutRef.current)
    }, [])

    // Функция воспроизведения глухого звука
    function playTickSound() {
        try {
            try { if (localStorage.getItem('opt_sound') === '0') return } catch {}
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
            try { if (localStorage.getItem('opt_vibro') === '0') return } catch {}
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
        // Сначала проверяем onBeforeSpin, чтобы он мог разрешить вращение даже если isSpinning === true
        if (typeof onBeforeSpin === 'function') {
            const ok = onBeforeSpin()
            if (ok === false) return
            // Если onBeforeSpin вернул true, разрешаем вращение даже если isSpinning === true
            // (для специальных режимов, например pyramid с автоматическими вращениями)
        } else {
            // Если onBeforeSpin не определен, проверяем isSpinning как обычно
            if (isSpinning) return
        }
        setHighlightVisible(false)
        // Используем ref для получения актуального значения rotation (синхронно)
        const currentRotation = rotationRef.current
        const targetIndex = typeof toIndex === 'number' ? ((toIndex % labels.length) + labels.length) % labels.length : Math.floor(Math.random() * labels.length)
        // небольшой рандом внутри сектора, чтобы не останавливаться строго по центру
        const jitter = (Math.random() - 0.5) * (seg * 0.4) // ±20% сектора
        const base = computeRotationForIndex(targetIndex) + jitter

        // обеспечим как минимум несколько полных оборотов вперёд
        // больше оборотов для интриги
        const minSpins = 8
        let target = base
        // Используем currentRotation из ref для правильного вычисления target
        while (target < currentRotation + minSpins * 360) target += 360

        setIsSpinning(true)
        // во время спина и до результатов — держим вопросительные знаки
        setConcealInner(true)
        try { onSpinningChange?.(true) } catch {}
        // Используем currentRotation из ref для правильного вычисления degreesToTravel
        const degreesToTravel = target - currentRotation
        // дольше и более плавное замедление
        const duration = Math.max(8.5, Math.min(12.5, degreesToTravel / 360 * 0.9 + 8.5))

        if (wheelRef.current) {
            wheelRef.current.style.transition = `transform ${duration}s cubic-bezier(0.05, 0.85, 0.05, 1)`
        }
        // стрелок-оверлея нет; синхронизация не требуется
        // центральную кнопку вращаем в ту же сторону, что и колесо, но медленнее
        const CENTER_RATIO = 0.35
        // Вычисляем абсолютное вращение кнопки на основе target (конечного положения колеса)
        // Вращаем в ту же сторону, что и колесо (по часовой стрелке)
        const newCenterRotation = target * CENTER_RATIO
        requestAnimationFrame(() => {
            setRotation(target)
            rotationRef.current = target // Обновляем ref синхронно
            // Применяем вращение к кнопке в том же requestAnimationFrame для синхронизации
            if (centerBtnRef.current) {
                centerBtnRef.current.style.transition = `transform ${duration}s cubic-bezier(0.05, 0.85, 0.05, 1)`
                // крутим в противоположную сторону, накапливая вращение
                centerBtnRef.current.style.transform = `translate(-50%, -50%) rotate(${newCenterRotation}deg)`
            }
        })

        // безопасный коллбэк результата по окончанию анимации
        timeoutRef.current = window.setTimeout(() => {
            setIsSpinning(false)
            try { onSpinningChange?.(false) } catch {}
            const idx = indexFromRotation(target)
            onResult?.(idx, labels[idx])
            // открыть бонусы (снять вопросительные знаки)
            setConcealInner(false)
            setHighlightVisible(true)
            if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
            highlightTimeoutRef.current = window.setTimeout(() => setHighlightVisible(false), 1500)
            // через 1-3 сек вернуть вопросительные знаки на центральном барабане (берём 2с как усреднённое)
            if (innerResetTimeoutRef.current) window.clearTimeout(innerResetTimeoutRef.current)
            innerResetTimeoutRef.current = window.setTimeout(() => setConcealInner(true), 2000)
            // НЕ сбрасываем вращение кнопки здесь - оно должно накапливаться между вращениями
        }, duration * 1000 + 50)
    }

    // Expose spin method via ref
    React.useImperativeHandle(ref, () => ({
        spin: (toIndex?: number) => spin(toIndex)
    }), [])

    function handleSelectAt(evt: React.MouseEvent<HTMLDivElement>) {
        if (isSpinning || disableSelection) return
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
                    // открыть бонусы (снять вопросительные знаки)
                    setConcealInner(false)
                    setHighlightVisible(true)
                    if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
                    highlightTimeoutRef.current = window.setTimeout(() => setHighlightVisible(false), 1500)
                    // через 1-3 сек вернуть вопросительные знаки на центральном барабане (берём 2с как усреднённое)
                    if (innerResetTimeoutRef.current) window.clearTimeout(innerResetTimeoutRef.current)
                    innerResetTimeoutRef.current = window.setTimeout(() => setConcealInner(true), 2000)
                    // НЕ сбрасываем вращение кнопки здесь - оно должно накапливаться между вращениями
                    // Сброс будет происходить только когда hideCenterButton станет false (завершение режима 3/10)
                }}
            >
                {/* цельное кольцо бонусов поверх колеса (прячем во время спина и когда скрыты знаки) */}
                {!isSpinning && !concealInner && (
                    <img
                        src="/bonus.png"
                        alt="bonus-ring"
                        style={{ position:'absolute', left: '50%', top: '50%', width: '100%', height: '100%', objectFit:'contain', pointerEvents:'none', transform: 'translate(-50%, -50%) scale(0.5)' }}
                    />
                )}
                {/* Вопросительные знаки показываем во время спина или когда нужно скрыть бонусы (первый вход и после результата) */}
                {(isSpinning || concealInner) && (
                    <svg
                        width={size}
                        height={size}
                        style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
                        viewBox={`0 0 ${size} ${size}`}
                    >
                        {(() => {
                            const cx = size / 2
                            const cy = size / 2
                            const rInnerText = size * 0.205
                            const toRad = (d: number) => (Math.PI / 180) * d
                            const nodes: JSX.Element[] = []
                            for (let i = 0; i < labels.length; i++) {
                                const center = i * seg + seg / 2
                                const ang = center - 90 // внутри transform родителя, поэтому без rotation
                                const x2 = cx + rInnerText * Math.cos(toRad(ang))
                                const y2 = cy + rInnerText * Math.sin(toRad(ang))
                                nodes.push(
                                    <text key={`q-in-${i}`} x={x2} y={y2} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontWeight={900} fontFamily="'Russo One', Inter, system-ui" fontSize={Math.round(size*0.07)} transform={`rotate(${ang+90}, ${x2}, ${y2})`}>?</text>
                                )
                            }
                            return <g>{nodes}</g>
                        })()}
                    </svg>
                )}
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
                        const pointerTop = -(size * 0.062) + POINTER_DY // пропорционально размеру (было -16 для 260px)
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
                const pointerTop = -(size * 0.062) + POINTER_DY // пропорционально размеру (было -16 для 260px)
                const px = cx + POINTER_DX
                const py = pointerTop
                const angleToCenter = Math.atan2(cy - py, cx - px) * 180 / Math.PI // от указателя к центру
                const rotateDeg = angleToCenter + 90 // апекс вверх => +90 чтобы смотреть по вектору
                const pointerSize = Math.round(size * 0.13) // пропорционально размеру колеса (было 34 для 260px)
                const pointerHeight = Math.round(size * 0.154) // пропорционально размеру колеса (было 40 для 260px)
                return (
                    <div style={{ position: 'absolute', left: `calc(50% + ${POINTER_DX}px)`, top: pointerTop, transform: `translateX(-50%) rotate(${rotateDeg}deg)`, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.35))' }}>
                        <svg width={pointerSize} height={pointerHeight} viewBox="0 0 34 40">
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
                const { x, y } = getPlusCenter()
                const btnSize = Math.round(size * 0.18)
                return onOpenBonuses ? (
                    <button
                        type="button"
                        aria-label="Выбрать бонус"
                        onClick={(e) => { e.stopPropagation(); if (!isSpinning) onOpenBonuses?.() }}
                        style={{
                            position:'absolute',
                            left: x,
                            top: y,
                            transform:'translate(-50%, -50%)',
                            width: btnSize,
                            height: btnSize,
                            border:'none',
                            borderRadius: '50%',
                            background: 'url(/plus.png) center/contain no-repeat',
                            boxShadow:'0 6px 12px rgba(0,0,0,0.35)',
                            cursor: isSpinning ? 'default' : 'pointer',
                            zIndex: 3
                        }}
                    />
                ) : null
            })()}


            {/* центральная кнопка старта (меняет изображение при спине) */}
            <button
                type="button"
                onClick={() => spin()}
                disabled={isSpinning || hideCenterButton}
                aria-label={isSpinning ? 'Крутится' : 'Крутить'}
                ref={centerBtnRef}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: Math.round(size * 0.26),
                    height: Math.round(size * 0.26),
                    borderRadius: '50%',
                    border: 'none',
                    background: `url(${(isSpinning || hideCenterButton) ? '/centerspin.png' : '/center.png'}) center/contain no-repeat`,
                    boxShadow: '0 6px 12px rgba(0,0,0,0.35)',
                    cursor: (isSpinning || hideCenterButton) ? 'default' : 'pointer',
                }}
            />
        </div>
    )
})


