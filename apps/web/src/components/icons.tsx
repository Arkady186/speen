import React from 'react';

export function IconClock(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</svg>
	);
}

export function IconStar(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" {...props}>
			<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
		</svg>
	);
}

export function IconBack(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
			<path d="M15 18l-6-6 6-6" />
		</svg>
	);
}

export function IconCart(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
			<circle cx="9" cy="21" r="1" />
			<circle cx="20" cy="21" r="1" />
			<path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L21 6H6" />
		</svg>
	);
}



