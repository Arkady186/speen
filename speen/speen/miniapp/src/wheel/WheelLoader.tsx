import React from 'react'

const SLICE_COUNT = 12
// Новогодние цвета: красный, зеленый, золотой, белый, синий
const COLORS = [
	'#dc2626', // красный
	'#16a34a', // зеленый
	'#fbbf24', // золотой
	'#ffffff', // белый
	'#3b82f6', // синий
	'#ef4444', // ярко-красный
]

function generateSlices(count: number) {
	return Array.from({ length: count }, (_, i) => ({
		index: i,
		angle: (360 / count) * i,
		color: COLORS[i % COLORS.length],
	}))
}

function parseUserFromInitDataString(initData: string | undefined) {
	if (!initData) return null
	try {
		const sp = new URLSearchParams(initData)
		const userJson = sp.get('user')
		if (!userJson) return null
		return JSON.parse(userJson)
	} catch {
		return null
	}
}

export function WheelLoader({ onDone }: { onDone?: () => void }) {
	const slices = React.useMemo(() => generateSlices(SLICE_COUNT), [])
	const [userId, setUserId] = React.useState<string | null>(null)

	React.useEffect(() => {
		try {
			const tg = (window as any).Telegram?.WebApp
			tg?.ready?.()
			tg?.expand?.()

			const unsafeUser = tg?.initDataUnsafe?.user
			const parsedUser = unsafeUser ? null : parseUserFromInitDataString(tg?.initData)
			const user = unsafeUser || parsedUser

			const id = user?.id ?? null
			if (id) {
				const idStr = String(id)
				setUserId(idStr)
				try { localStorage.setItem('speen_user_id', idStr) } catch {}
			} else {
				// запасной вариант: показать ID, если он уже был сохранён ранее
				try {
					const stored = localStorage.getItem('speen_user_id')
					if (stored) setUserId(stored)
				} catch {}
			}
		} catch {}

		// таймаут-фоллбек на случай, если событие animationend не сработает
		const t = setTimeout(() => onDone?.(), 3500)
		return () => clearTimeout(t)
	}, [])

	return (
		<div className="center" style={styles.container}>
			{/* Падающие снежинки */}
			{Array.from({ length: 20 }).map((_, i) => (
				<div
					key={`snowflake-${i}`}
					style={{
						...styles.snowflake,
						left: `${(i * 37) % 100}%`,
						animationDelay: `${(i * 0.3) % 3}s`,
						animationDuration: `${3 + (i % 3)}s`,
					}}
				>
					❄
				</div>
			))}
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
								boxShadow: `0 0 8px ${s.color}40`,
							}}
						/>
					))}
					<div style={styles.hub}>
						<div style={styles.star}>⭐</div>
					</div>
				</div>
				<div style={styles.pointer}>
					<svg width="34" height="40" viewBox="0 0 34 40">
						<defs>
							<linearGradient id="g" x1="0" x2="1">
								<stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
								<stop offset="100%" stopColor="#dc2626" stopOpacity="0.8" />
							</linearGradient>
						</defs>
						<path d="M17 0 L34 22 L0 22 Z" fill="url(#g)"/>
					</svg>
				</div>
			</div>
			<div className="subtitle" style={styles.subtitle}>
				🎄 Загрузка мини‑приложения… {userId ? `(ID: ${userId})` : ''} 🎄
			</div>
			<div style={styles.version}>ver. 0.1.1 (build {__BUILD_ID__})</div>
		</div>
	)
}

const spinAnimationOnce = {
	animation: 'spin 3s cubic-bezier(0.22, 1, 0.36, 1) 1 forwards',
} as const

const styles: Record<string, React.CSSProperties> = {
	container: {
		position: 'relative',
		overflow: 'hidden',
		background: 'linear-gradient(180deg, #0a1628 0%, #1a2332 50%, #0f1b2e 100%)',
		minHeight: '100vh',
	},
	wrapper: {
		position: 'relative',
		width: 260,
		height: 260,
		filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.5))',
		zIndex: 1,
	},
	glow: {
		position: 'absolute',
		inset: -60,
		background: 'radial-gradient(closest-side, rgba(251,191,36,0.25), rgba(220,38,38,0.15), transparent 70%)',
		filter: 'blur(20px)',
		pointerEvents: 'none',
	},
	ring: {
		position: 'absolute',
		inset: -6,
		borderRadius: '50%',
		border: '6px solid rgba(251,191,36,0.3)',
		boxShadow: 'inset 0 0 0 1px rgba(251,191,36,0.2), 0 0 20px rgba(251,191,36,0.3)',
	},
	wheelOnce: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		borderRadius: '50%',
		background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), rgba(251,191,36,0.04) 60%, transparent 62%)',
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
		boxShadow: '0 0 10px rgba(0,0,0,0.2)',
	},
	hub: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		width: 56,
		height: 56,
		transform: 'translate(-50%, -50%)',
		borderRadius: '50%',
		background: 'radial-gradient(circle at 30% 30%, #fbbf24, #dc2626)',
		boxShadow:
			'0 4px 16px rgba(251,191,36,0.5), inset 0 2px 12px rgba(255,255,255,0.7), inset 0 0 0 4px rgba(251,191,36,0.4)',
		display: 'grid',
		placeItems: 'center',
	},
	star: {
		fontSize: 24,
		animation: 'starTwinkle 1.5s ease-in-out infinite',
	},
	pointer: {
		position: 'absolute',
		top: -8,
		left: '50%',
		transform: 'translateX(-50%)',
		filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.5))',
		zIndex: 2,
	},
	snowflake: {
		position: 'absolute',
		top: '-20px',
		fontSize: '20px',
		color: 'rgba(255,255,255,0.8)',
		pointerEvents: 'none',
		animation: 'snowfall linear infinite',
		textShadow: '0 0 5px rgba(255,255,255,0.5)',
	},
	subtitle: {
		color: '#fbbf24',
		textShadow: '0 0 10px rgba(251,191,36,0.5)',
		fontWeight: 600,
	},
	version: {
		position: 'fixed',
		bottom: 12,
		left: '50%',
		transform: 'translateX(-50%)',
		color: '#ffffff',
		fontSize: 13,
		fontWeight: 800,
		letterSpacing: 0.2,
		padding: '6px 10px',
		borderRadius: 999,
		background: 'rgba(0,0,0,0.45)',
		boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
		zIndex: 9999,
		pointerEvents: 'none',
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
@keyframes snowfall {
	0% {
		transform: translateY(0) rotate(0deg);
		opacity: 0.8;
	}
	50% {
		opacity: 1;
	}
	100% {
		transform: translateY(100vh) rotate(360deg);
		opacity: 0.3;
	}
}
@keyframes starTwinkle {
	0%, 100% {
		transform: scale(1) rotate(0deg);
		opacity: 1;
	}
	50% {
		transform: scale(1.2) rotate(180deg);
		opacity: 0.8;
	}
}
`
if (!document.head.querySelector('#wheel-loader-styles')) {
	style.id = 'wheel-loader-styles'
	document.head.appendChild(style)
}



