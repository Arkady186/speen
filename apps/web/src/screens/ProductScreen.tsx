import { useParams } from 'react-router-dom';
import { getProduct } from '../data/catalog';
import { useCart } from '../store/CartContext';
import { useFavorites } from '../store/FavoritesContext';

export default function ProductScreen() {
	const { sku } = useParams();
	const product = sku ? getProduct(sku) : undefined;
	const { addItem } = useCart();
	const { isFav, toggle } = useFavorites();

	if (!product) return <div>Товар не найден</div>;

	return (
		<div style={{ display: 'grid', gap: 12 }}>
			<div style={{ height: 220, borderRadius: 14, backgroundImage: `url(${product.images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
			<h2 style={{ margin: 0 }}>{product.title}</h2>
			<div style={{ display: 'grid', gap: 8 }}>
				{product.description && <p style={{ opacity: 0.85 }}>{product.description}</p>}
				{product.specs && (
					<div style={{ display: 'grid', gap: 6 }}>
						{Object.entries(product.specs).map(([k, v]) => (
							<div key={k} style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
								<span>{k}</span><b>{String(v)}</b>
							</div>
						))}
					</div>
				)}
			</div>
			<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
				<div style={{ fontSize: 22, fontWeight: 900, color: '#4de1a1' }}>{product.price.toLocaleString('ru-RU')} ₽</div>
				<button style={primary} onClick={() => addItem({ sku: product.sku, title: product.title, price: product.price })}>В корзину</button>
				<button style={ghost} onClick={() => toggle(product.sku)}>{isFav(product.sku) ? '★ В избранном' : '☆ В избранное'}</button>
			</div>
		</div>
	);
}

const primary: React.CSSProperties = { background: '#48d597', color: '#05344f', border: 'none', borderRadius: 12, padding: '12px 14px', fontWeight: 900, cursor: 'pointer' };
const ghost: React.CSSProperties = { background: 'transparent', color: '#fff', border: '1px solid #2a6e96', borderRadius: 12, padding: '10px 12px', cursor: 'pointer' };


