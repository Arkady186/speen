import React from 'react'

const SLICE_COUNT = 12
const COLORS = [
	'#ff6b6b',
	'#ffd93d',
	'#6bcB77',
	'#4d96ff',
	'#a78bfa',
	'#f472b6',
]

function generateSlices(count: number) {
	return Array.from({ length: count }, (_, i) => ({
		index: i,
		angle: (360 / count) * i,
		color: COLORS[i % COLORS.length],
	}))
}

export function WheelLoader() {
	const slices = React.useMemo(() => generateSlices(SLICE_COUNT), [])

	return (
		<div className="center">
			<div style={styles.wrapper}>
				<div style={styles.glow} />
				<div style={styles.ring} />
				<div style={styles.wheel}>
					{slices.map((s) => (
						<div
							key={s.index}
							style={{
								...styles.slice,
								transform: `rotate(${s.angle}deg) translateY(-50%)`,
								background: `linear-gradient(90deg, ${s.color}, transparent 60%)`,
							}}
						/>
					))}
					<div style={styles.hub} />
				</div>
				<div style={styles.pointer}>
					<svg width="34" height="40" viewBox="0 0 34 40">
						<defs>
							<linearGradient id="g" x1="0" x2="1">
								<stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
								<stop offset="100%" stopColor="#bcd7ff" stopOpacity="0.6" />
							</linearGradient>
						</defs>
						<path d="M17 0 L34 22 L0 22 Z" fill="url(#g)"/>
					</svg>
				</div>
			</div>
			<div className="subtitle">Загрузка мини‑приложения…</div>
		</div>
	)
}

const spinAnimation = {
	animation: 'spin 3s cubic-bezier(0.22, 1, 0.36, 1) infinite',
} as const

const styles: Record<string, React.CSSProperties> = {
	wrapper: {
		position: 'relative',
		width: 260,
		height: 260,
		filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.35))',
	},
	glow: {
		position: 'absolute',
		inset: -60,
		background: 'radial-gradient(closest-side, rgba(110,231,255,0.18), transparent 70%)',
		filter: 'blur(18px)',
		pointerEvents: 'none',
	},
	ring: {
		position: 'absolute',
		inset: -6,
		borderRadius: '50%',
		border: '6px solid rgba(255,255,255,0.06)',
		boxShadow: 'inset 0 0 0 1px rgba(110,231,255,0.08)',
	},
	wheel: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		borderRadius: '50%',
		background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 60%, transparent 62%)',
		maskImage: 'radial-gradient(circle, black 70%, transparent 71%)',
		transformOrigin: '50% 50%',
		...spinAnimation,
	},
	slice: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		width: '50%',
		height: 8,
		borderRadius: 6,
		opacity: 0.95,
		transformOrigin: '0% 50%',
		boxShadow: '0 0 10px rgba(0,0,0,0.15)',
	},
	hub: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		width: 56,
		height: 56,
		transform: 'translate(-50%, -50%)',
		borderRadius: '50%',
		background: 'radial-gradient(circle at 30% 30%, #ffffff, #bcd7ff)',
		boxShadow:
			'0 4px 16px rgba(0,0,0,0.35), inset 0 2px 12px rgba(255,255,255,0.7), inset 0 0 0 4px rgba(110,231,255,0.35)'
	},
	pointer: {
		position: 'absolute',
		top: -8,
		left: '50%',
		transform: 'translateX(-50%)',
		filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.35))',
		zIndex: 2,
	},
}

const style = document.createElement('style')
style.innerHTML = `
@keyframes spin {
	0% { transform: rotate(0deg); }
	50% { transform: rotate(380deg); }
	100% { transform: rotate(720deg); }
}
`
document.head.appendChild(style)


