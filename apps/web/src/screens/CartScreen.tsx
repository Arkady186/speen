import { useCart } from '../store/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartScreen() {
	const { items, total, setQty, removeItem, clear } = useCart();
	const nav = useNavigate();
	return (
		<div style={{ display: 'grid', gap: 12 }}>
			<h2 style={{ margin: 0 }}>Корзина</h2>
			{items.length === 0 ? (
				<p>Корзина пуста. Перейти в каталог.</p>
			) : (
				<div style={{ display: 'grid', gap: 10 }}>
					{items.map(i => (
						<div key={i.sku} style={{ background: '#0f3f61', borderRadius: 12, padding: 10, display: 'grid', gap: 8 }}>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<b>{i.title}</b>
								<span>{(i.price * i.qty).toLocaleString('ru-RU')} ₽</span>
							</div>
							<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
								<button onClick={() => setQty(i.sku, Math.max(1, i.qty - 1))}>-</button>
								<span>{i.qty}</span>
								<button onClick={() => setQty(i.sku, i.qty + 1)}>+</button>
								<button onClick={() => removeItem(i.sku)} style={{ marginLeft: 'auto' }}>Удалить</button>
							</div>
						</div>
					))}
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<b>Итого</b>
						<b>{total.toLocaleString('ru-RU')} ₽</b>
					</div>
					<button style={primary} onClick={() => nav('/checkout')}>Оформить заказ</button>
				</div>
			)}
		</div>
	);
}

const primary: React.CSSProperties = { background: '#48d597', color: '#05344f', border: 'none', borderRadius: 12, padding: '12px 14px', fontWeight: 900, cursor: 'pointer' };



