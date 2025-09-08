import React from 'react'

type ImageWheelProps = {
    size?: number
    imageSrc: string
    labels: string[]
    startOffsetDeg?: number
    onResult?: (index: number, label: string) => void
}

export function ImageWheel({ size = 260, imageSrc, labels, startOffsetDeg = 0, onResult }: ImageWheelProps) {
    const [rotation, setRotation] = React.useState<number>(0)
    const [isSpinning, setIsSpinning] = React.useState<boolean>(false)
    const seg = 360 / labels.length
    const SECTOR_OFFSET = 2 // визуальное смещение: фактически выпадает сектор на 2 больше

    function normalizeDeg(d: number) {
        return ((d % 360) + 360) % 360
    }

    function indexFromRotation(rotDeg: number) {
        // Какой сектор находится у указателя (сверху), если колесо повернуто на rotDeg по часовой
        const a = normalizeDeg(-rotDeg - startOffsetDeg)
        const idx = Math.floor(a / seg) % labels.length
        return (idx + SECTOR_OFFSET) % labels.length
    }

    function computeRotationForIndex(index: number) {
        // Центр целевого сектора должен оказаться под указателем
        const physIndex = (index - SECTOR_OFFSET + labels.length) % labels.length
        const center = physIndex * seg + seg / 2
        // Базовый угол (без полных оборотов), который приведет центр сектора к указателю
        const base = -(center + startOffsetDeg)
        return base
    }

    const wheelRef = React.useRef<HTMLDivElement | null>(null)
    const timeoutRef = React.useRef<number | null>(null)

    React.useEffect(() => () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current) }, [])

    function spin(toIndex?: number) {
        if (isSpinning) return
        const targetIndex = typeof toIndex === 'number' ? ((toIndex % labels.length) + labels.length) % labels.length : Math.floor(Math.random() * labels.length)
        // небольшой рандом внутри сектора, чтобы не останавливаться строго по центру
        const jitter = (Math.random() - 0.5) * (seg * 0.4) // ±20% сектора
        const base = computeRotationForIndex(targetIndex) + jitter

        // обеспечим как минимум несколько полных оборотов вперёд
        const minSpins = 5
        let target = base
        while (target < rotation + minSpins * 360) target += 360

        setIsSpinning(true)
        const degreesToTravel = target - rotation
        const duration = Math.max(3.2, Math.min(5.2, degreesToTravel / 360 * 0.9 + 3.2))

        if (wheelRef.current) {
            wheelRef.current.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.76, 0.12, 1)`
        }
        requestAnimationFrame(() => setRotation(target))

        // безопасный коллбэк результата по окончанию анимации
        timeoutRef.current = window.setTimeout(() => {
            setIsSpinning(false)
            const idx = indexFromRotation(target)
            onResult?.(idx, labels[idx])
        }, duration * 1000 + 50)
    }

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
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
                }}
                onTransitionEnd={() => {
                    if (!isSpinning) return
                    setIsSpinning(false)
                    const idx = indexFromRotation(rotation)
                    onResult?.(idx, labels[idx])
                }}
            />
            {/* указатель повернут на 90° */}
            <div style={{ position: 'absolute', left: '50%', top: -8, transform: 'translateX(-50%) rotate(90deg)', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.35))' }}>
                <svg width="34" height="40" viewBox="0 0 34 40">
                    <defs>
                        <linearGradient id="g2" x1="0" x2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#bcd7ff" stopOpacity="0.6" />
                        </linearGradient>
                    </defs>
                    <path d="M17 0 L34 22 L0 22 Z" fill="url(#g2)"/>
                </svg>
            </div>

            {/* область клика для старта вращения */}
            <button
                type="button"
                onClick={() => spin()}
                disabled={isSpinning}
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -14,
                    transform: 'translateX(-50%)',
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: 'none',
                    background: isSpinning ? '#355da1' : '#244e96',
                    color: '#fff',
                    fontWeight: 800,
                    boxShadow: 'inset 0 0 0 3px #0b2f68',
                    cursor: isSpinning ? 'default' : 'pointer'
                }}
            >{isSpinning ? 'Крутится…' : 'Крутить'}</button>
        </div>
    )
}


