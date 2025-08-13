import { useEffect, useState } from 'react';
import { apiInit, apiReward } from '../api/client';

type Slice = { label: string; color: string; reward: number };

const slices: Slice[] = [
	{ label: '10 000', color: '#F4C430', reward: 10000 },
	{ label: 'Emoji', color: '#F9D76B', reward: 0 },
	{ label: '1', color: '#E84A5F', reward: 1 },
	{ label: '1000 000', color: '#F4C430', reward: 1000000 },
	{ label: 'Грусть', color: '#F9D76B', reward: 0 },
	{ label: '1000', color: '#F4C430', reward: 1000 },
];

export default function WheelScreen() {
	const [spinsLeft, setSpinsLeft] = useState(5);
	const [gameBalance, setGameBalance] = useState(0);
	const [isSpinning, setIsSpinning] = useState(false);
	const [angle, setAngle] = useState(0);

	useEffect(() => {
		apiInit().then((s) => {
			setSpinsLeft(s.spins);
			setGameBalance(s.balance);
		}).catch(() => {});
	}, []);

	function spin() {
		if (isSpinning || spinsLeft <= 0) return;
		setIsSpinning(true);
		const targetIndex = Math.floor(Math.random() * slices.length);
		const sliceAngle = 360 / slices.length;
		const extraTurns = 6 * 360; // 6 rounds for feel
		const targetAngle = extraTurns + (360 - targetIndex * sliceAngle) + Math.random() * (sliceAngle * 0.8);
		const newAngle = angle + targetAngle;
		setAngle(newAngle);
		setTimeout(async () => {
			const reward = slices[targetIndex].reward;
			try {
				const s = await apiReward(reward);
				setGameBalance(s.balance);
				setSpinsLeft((v) => Math.max(0, v - 1));
			} finally {
				setIsSpinning(false);
			}
		}, 2600);
	}

	return (
		<div style={{ display: 'grid', gap: 16 }}>
			<div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
				<Balance label="USDT" value={1000} />
				<Balance label="Игровой" value={gameBalance} />
			</div>
			<div style={{ display: 'grid', placeItems: 'center' }}>
				<div style={{ position: 'relative', width: 280, height: 280 }}>
					<div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '16px solid #4de1a1' }} />
					<svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#efc355', transform: `rotate(${angle}deg)`, transition: isSpinning ? 'transform 2.6s cubic-bezier(0.25, 1, 0.5, 1)' : undefined }}>
						{Array.from({ length: slices.length }).map((_, i) => {
							const start = (i / slices.length) * 2 * Math.PI;
							const end = ((i + 1) / slices.length) * 2 * Math.PI;
							const x1 = 50 + 50 * Math.cos(start);
							const y1 = 50 + 50 * Math.sin(start);
							const x2 = 50 + 50 * Math.cos(end);
							const y2 = 50 + 50 * Math.sin(end);
							const large = end - start > Math.PI ? 1 : 0;
							return (
								<g key={i}>
									<path d={`M50 50 L ${x1} ${y1} A 50 50 0 ${large} 1 ${x2} ${y2} Z`} fill={slices[i].color} stroke="#0b3552" strokeWidth="0.5" />
									<text x="50" y="50" fill="#052235" fontSize="6" textAnchor="middle" transform={`rotate(${(i + 0.5) * (360 / slices.length)} 50 50) translate(0 -30)`}>{slices[i].label}</text>
								</g>
							);
						})}
					</svg>
				</div>
			</div>
			<button onClick={spin} disabled={isSpinning || spinsLeft <= 0} style={primaryButton}>
				FREE ROLL {spinsLeft > 0 ? `(${spinsLeft})` : ''}
			</button>
		</div>
	);
}

function Balance({ label, value }: { label: string; value: number }) {
	return (
		<div style={{ background: '#0f3f61', borderRadius: 10, padding: '6px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
			<span style={{ opacity: 0.8 }}>{label}:</span>
			<b>{value.toLocaleString('ru-RU')}</b>
		</div>
	);
}

const primaryButton: React.CSSProperties = {
	background: '#48d597',
	color: '#05344f',
	border: 'none',
	borderRadius: 12,
	padding: '14px 18px',
	fontSize: 18,
	fontWeight: 800,
	boxShadow: '0 4px 0 #2ea974',
	cursor: 'pointer',
};


