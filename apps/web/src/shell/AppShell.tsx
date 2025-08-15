import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { TonConnectUIProvider, TonConnectButton } from '@tonconnect/ui-react';
import { useEffect } from 'react';

const manifestUrl = new URL('/tonconnect-manifest.json', window.location.origin).toString();

export default function AppShell() {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		// In a Telegram Mini App you might want to sync theme/haptics here later.
	}, []);

	return (
		<TonConnectUIProvider manifestUrl={manifestUrl}>
			<div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: '#0b3552', color: '#fff', display: 'flex', flexDirection: 'column' }}>
				<header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
					<div style={{ fontWeight: 700 }}>Speen</div>
					<TonConnectButton />
				</header>
				<main style={{ flex: 1, padding: 12 }}>
					<Outlet />
				</main>
				<nav style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: 12, background: '#07263c' }}>
					<NavLink to="/" style={linkStyle(location.pathname === '/' || location.pathname.startsWith('/dish'))}>Меню</NavLink>
					<NavLink to="/cart" style={linkStyle(location.pathname === '/cart')}>Корзина</NavLink>
					<NavLink to="/checkout" style={linkStyle(location.pathname === '/checkout')}>Заказ</NavLink>
					<NavLink to="/auth" style={linkStyle(location.pathname === '/auth')}>Профиль</NavLink>
				</nav>
			</div>
		</TonConnectUIProvider>
	);
}

function linkStyle(active: boolean) {
	return {
		textAlign: 'center' as const,
		padding: '10px 8px',
		borderRadius: 10,
		textDecoration: 'none',
		color: active ? '#0b3552' : '#fff',
		background: active ? '#4de1a1' : '#0f3f61',
		fontWeight: 600,
	};
}




