import React from 'react'

type Props = { size?: number }

// Палитры, приближённые к референсу (только цвета)
const OUTER_COLORS = [
    '#b91c1c', // тёмно-красный
    '#ef4444', // красный
    '#f59e0b', // оранжевый
    '#f97316', // ярко-оранжевый
    '#fde047', // жёлтый
    '#a3e635', // салатовый
    '#22c55e', // зелёный
    '#10b981', // зелёно-бирюзовый
    '#06b6d4', // бирюзовый
    '#3b82f6', // синий
    '#7c3aed', // фиолетовый
    '#d946ef', // пурпур
]
const INNER_COLORS = [
    '#84cc16', // светло-зелёный
    '#22c55e', // зелёный
    '#06b6d4', // бирюзовый
    '#3b82f6', // синий
    '#7c3aed', // фиолетовый
    '#d946ef', // пурпур
    '#ef4444', // красный
    '#b91c1c', // тёмно-красный
    '#f472b6', // розовый
    '#f97316', // оранжевый
    '#fde047', // жёлтый
    '#a3e635', // салатовый
]

export function FortuneWheel({ size = 260 }: Props) {
    const rOuter = 100
    const rOuterRing = 92   // жёлтый обод
    const rOuterInner = 78  // внешний цветной круг внутренняя граница
    const rInnerOuter = 78  // равен внутренней границе внешнего цветного круга — остаётся только чёрная полоска
    const rInnerInner = 30  // внутренняя сторона внутреннего круга
    const rHub = 30         // ступица вплотную к внутреннему кругу
    const strokeBlack = 6

    function arcPath(r1: number, r2: number, start: number, end: number) {
        const toXY = (r: number, ang: number) => [r * Math.cos(ang), r * Math.sin(ang)]
        const large = end - start > Math.PI ? 1 : 0
        const [x1, y1] = toXY(r1, start)
        const [x2, y2] = toXY(r1, end)
        const [x3, y3] = toXY(r2, end)
        const [x4, y4] = toXY(r2, start)
        return `M ${x1} ${y1} A ${r1} ${r1} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r2} ${r2} 0 ${large} 0 ${x4} ${y4} Z`
    }

    const seg = (2 * Math.PI) / 12
    const toDeg = (rad: number) => (rad * 180) / Math.PI

    return (
        <div style={{ width: size, height: size }}>
            <svg viewBox={[-rOuter-8, -rOuter-8, (rOuter+8)*2, (rOuter+8)*2].join(' ')} width={size} height={size}>
                {/* outer black outline */}
                <circle cx={0} cy={0} r={rOuter} fill="none" stroke="#000" strokeWidth={strokeBlack} />
                {/* outer yellow donut (без радиальных разделителей) */}
                <path d={arcPath(rOuter, rOuterRing, 0, 2*Math.PI)} fill="#f6e24d" stroke="#000" strokeWidth={4} />

                {/* outer 12 colored ring (между жёлтым и синим) */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const start = i * seg
                    const end = (i + 1) * seg
                    return (
                        <path key={`o-${i}`} d={arcPath(rOuterRing, rOuterInner, start, end)} fill={OUTER_COLORS[i % OUTER_COLORS.length]} stroke="#000" strokeWidth={3} />
                    )
                })}

                {/* разделительная окружность (без заливки) вместо синего кольца */}
                <circle cx={0} cy={0} r={rInnerOuter} fill="none" stroke="#000" strokeWidth={3} />

                {/* inner 12 slices ring */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const start = i * seg
                    const end = (i + 1) * seg
                    return (
                        <path key={`i-${i}`} d={arcPath(rInnerOuter, rInnerInner, start, end)} fill={INNER_COLORS[i % INNER_COLORS.length]} stroke="#000" strokeWidth={3} />
                    )
                })}

                {/* цифры 0–9 (без повторов). Два сектора оставляем без цифр */}
                {(() => {
                    const DIGITS = ['0','1','2','3','4','5','6','7','8','9','', '']
                    return DIGITS.map((label, i) => {
                        const angle = i * seg + seg / 2
                        const rText = (rOuterInner + rOuterRing) / 2
                        if (!label) return null
                        return (
                            <text key={`t-${i}`} x={0} y={0} fontSize={10} fontWeight={900} fill="#000" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${toDeg(angle)}) translate(${rText} 0)`}>
                                {label}
                            </text>
                        )
                    })
                })()}

                {/* hub: red with black contour */}
                <circle cx={0} cy={0} r={rHub} fill="#e53935" stroke="#000" strokeWidth={3} />
            </svg>
        </div>
    )
}


