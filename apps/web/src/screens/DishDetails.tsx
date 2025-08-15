import { useParams } from 'react-router-dom';
import { findItem } from '../data/menu';
import { useCart } from '../store/CartContext';

export default function DishDetails() {
	const { slug } = useParams();
	const dish = slug ? findItem(slug) : undefined;
	const { addItem } = useCart();
	if (!dish) return <div>Блюдо не найдено</div>;
	return (
		<div style={{ display: 'grid', gap: 12 }}>
			<div style={{ height: 220, borderRadius: 14, backgroundImage: `url(${dish.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
			<h2 style={{ margin: 0 }}>{dish.title}</h2>
			<p style={{ opacity: 0.85 }}>{dish.description}</p>
			<div style={{ display: 'flex', gap: 12 }}>
				<Nut label="ккал" value={dish.nutrition.kcal} />
				<Nut label="б" value={dish.nutrition.protein} />
				<Nut label="ж" value={dish.nutrition.fat} />
				<Nut label="у" value={dish.nutrition.carbs} />
			</div>
			<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
				<div style={{ fontSize: 24, fontWeight: 900, color: '#4de1a1' }}>{dish.price.toLocaleString('ru-RU')} ₽</div>
				<button style={primary} onClick={() => addItem({ sku: dish.slug, title: dish.title, price: dish.price })}>В корзину</button>
			</div>
		</div>
	);
}

function Nut({ label, value }: { label: string; value: number }) {
	return (
		<div style={{ background: '#0f3f61', borderRadius: 10, padding: '6px 10px', display: 'grid', placeItems: 'center' }}>
			<div style={{ opacity: 0.8 }}>{label}</div>
			<b>{value}</b>
		</div>
	);
}

const primary: React.CSSProperties = { background: '#48d597', color: '#05344f', border: 'none', borderRadius: 12, padding: '12px 14px', fontWeight: 900, cursor: 'pointer' };


