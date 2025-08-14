import { useCart } from '../store/CartContext';
import { useNavigate } from 'react-router-dom';

const products = [
	{ sku: 'kumys-05', title: 'Кумыс 0.5 л', desc: 'Традиционный кумыс, свежайший', price: 250 },
	{ sku: 'kumys-10', title: 'Кумыс 1 л', desc: 'Натуральный вкус степи', price: 450 },
];

export default function ShopCatalog() {
	const { addItem } = useCart();
	const nav = useNavigate();
	return (
		<div style={page}>
			<h2 style={h2}>Кумыс — свежесть степи</h2>
			<p style={subtitle}>Натуральный фермерский продукт. Доставка по городу в день заказа.</p>
			<div style={grid}>
				{products.map(p => (
					<div key={p.sku} style={card}>
						<div style={pic} />
						<div style={{ display: 'grid', gap: 6 }}>
							<div style={title}>{p.title}</div>
							<div style={desc}>{p.desc}</div>
							<div style={price}>{p.price.toLocaleString('ru-RU')} ₽</div>
						</div>
						<div style={{ display: 'flex', gap: 8 }}>
							<button style={primary} onClick={() => addItem({ sku: p.sku, title: p.title, price: p.price })}>В корзину</button>
							<button style={ghost} onClick={() => nav('/cart')}>Оформить</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

const page: React.CSSProperties = { display: 'grid', gap: 18 };
const h2: React.CSSProperties = { margin: 0, fontSize: 22 };
const subtitle: React.CSSProperties = { marginTop: -6, opacity: 0.8 };
const grid: React.CSSProperties = { display: 'grid', gap: 12 };
const card: React.CSSProperties = { background: '#0f3f61', borderRadius: 14, padding: 12, display: 'grid', gap: 12 };
const pic: React.CSSProperties = { height: 120, borderRadius: 10, background: 'linear-gradient(135deg,#62e4b1,#b9f7de)' };
const title: React.CSSProperties = { fontSize: 18, fontWeight: 800 };
const desc: React.CSSProperties = { opacity: 0.85 };
const price: React.CSSProperties = { fontSize: 20, fontWeight: 900, color: '#4de1a1' };
const primary: React.CSSProperties = { background: '#48d597', color: '#05344f', border: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 800, cursor: 'pointer' };
const ghost: React.CSSProperties = { background: 'transparent', color: '#fff', border: '1px solid #2a6e96', borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer' };


