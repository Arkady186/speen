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

export function WheelLoader({ onDone }: { onDone?: () => void }) {
	const slices = React.useMemo(() => generateSlices(SLICE_COUNT), [])
	const [userId, setUserId] = React.useState<string | null>(null)

	React.useEffect(() => {
		try {
			const tg = (window as any).Telegram?.WebApp
			tg?.ready?.()
			tg?.expand?.()
			const id = tg?.initDataUnsafe?.user?.id ?? null
			if (id) {
				setUserId(String(id))
				try { localStorage.setItem('speen_user_id', String(id)) } catch {}
			}
		} catch {}

		// таймаут-фоллбек на случай, если событие animationend не сработает
		const t = setTimeout(() => onDone?.(), 3500)
		return () => clearTimeout(t)
	}, [])

	return (
		<div className="center">
			<div style={styles.wrapper}>
				<div style={styles.glow} />
				<div style={styles.ring} />
				<div style={styles.wheelOnce} onAnimationEnd={() => onDone?.()}>
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
			<div className="subtitle">Загрузка мини‑приложения… {userId ? `(ID: ${userId})` : ''}</div>
		</div>
	)
}

const spinAnimationOnce = {
	animation: 'spin 3s cubic-bezier(0.22, 1, 0.36, 1) 1 forwards',
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
	wheelOnce: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		borderRadius: '50%',
		background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 60%, transparent 62%)',
		maskImage: 'radial-gradient(circle, black 70%, transparent 71%)',
		transformOrigin: '50% 50%',
		...spinAnimationOnce,
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
@keyframes midpop {
    0% { transform: translateY(0); opacity: 0; }
    20% { transform: translateY(-6px); opacity: 1; }
    100% { transform: translateY(-18px); opacity: 0; }
}
`
document.head.appendChild(style)



