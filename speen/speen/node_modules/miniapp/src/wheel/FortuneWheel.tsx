import React from 'react'

type Props = { size?: number }

const OUTER_COLORS = [
    '#ff6b6b', '#ff9f43', '#ff6b6b', '#8b0f0f', '#ff6b6b', '#3b82f6', '#14b8a6', '#22c55e', '#22c55e', '#a3e635', '#fde047', '#a3e635'
]
const INNER_COLORS = [
    '#3b82f6', '#7c3aed', '#ec4899', '#8b0f0f', '#ff6b6b', '#ff9f43', '#fde047', '#a3e635', '#22c55e', '#14b8a6', '#3b82f6', '#7c3aed'
]

export function FortuneWheel({ size = 260 }: Props) {
    const rOuter = 100
    const rOuterRing = 94
    const rOuterInner = 78
    const rInnerOuter = 64
    const rInnerInner = 26 // доводим до ступицы, чтобы не было жёлтого кольца внутри
    const rHub = 26
    const strokeBlack = 4

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

    return (
        <div style={{ width: size, height: size }}>
            <svg viewBox={[-rOuter-6, -rOuter-6, (rOuter+6)*2, (rOuter+6)*2].join(' ')} width={size} height={size}>
                {/* outer black outline */}
                <circle cx={0} cy={0} r={rOuter} fill="none" stroke="#000" strokeWidth={strokeBlack} />
                {/* outer yellow donut */}
                <path d={arcPath(rOuter, rOuterRing, 0, 2*Math.PI)} fill="#f6e24d" stroke="#000" strokeWidth={1.5} />

                {/* outer 12 slices ring */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const start = i * seg
                    const end = (i + 1) * seg
                    return (
                        <path key={`o-${i}`} d={arcPath(rOuterRing, rOuterInner, start, end)} fill={OUTER_COLORS[i % OUTER_COLORS.length]} stroke="#000" strokeWidth={1.5} />
                    )
                })}

                {/* middle blue ring */}
                <path d={arcPath(rOuterInner, rInnerOuter, 0, 2*Math.PI)} fill="#3aa0ff" stroke="#000" strokeWidth={1.5} />

                {/* inner 12 slices ring */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const start = i * seg
                    const end = (i + 1) * seg
                    return (
                        <path key={`i-${i}`} d={arcPath(rInnerOuter, rInnerInner, start, end)} fill={INNER_COLORS[i % INNER_COLORS.length]} stroke="#000" strokeWidth={1.5} />
                    )
                })}

                {/* hub */}
                <circle cx={0} cy={0} r={rHub} fill="#e53935" stroke="#000" strokeWidth={2} />
            </svg>
        </div>
    )
}


