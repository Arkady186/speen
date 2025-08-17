import { Link, useSearchParams } from 'react-router-dom';
import { categories, childrenOf, getCategory, listProductsByCategory } from '../data/catalog';
import { useCart } from '../store/CartContext';
import { useFavorites } from '../store/FavoritesContext';

export default function CatalogScreen() {
	const [params, setParams] = useSearchParams();
	const current = params.get('cat') || 'root';
	const { addItem } = useCart();
	const { isFav, toggle } = useFavorites();

	const children = childrenOf(current === 'root' ? 'root' : current);
	const products = current === 'root' ? [] : listProductsByCategory(current);

	return (
		<div style={{ display: 'grid', gap: 14 }}>
			<h2 style={{ margin: 0 }}>{getCategory(current)?.title ?? 'Каталог'}</h2>
			<div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
				{children.map(c => (
					<Link to={`/?cat=${c.key}`} key={c.key} style={chip}>{c.title}</Link>
				))}
			</div>
			<div style={{ display: 'grid', gap: 10 }}>
				{products.map(p => (
					<div key={p.sku} style={card}>
						<div style={{ ...pic, backgroundImage: `url(${p.images[0]})` }} />
						<div style={{ display: 'grid', gap: 6 }}>
							<div style={title}>{p.title}</div>
							<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
								<div style={price}>{p.price.toLocaleString('ru-RU')} ₽</div>
								<button style={small} onClick={() => addItem({ sku: p.sku, title: p.title, price: p.price })}>В корзину</button>
								<button style={smallGhost} onClick={() => toggle(p.sku)}>{isFav(p.sku) ? '★ В избранном' : '☆ В избранное'}</button>
								<Link to={`/p/${p.sku}`} style={smallGhost}>Подробнее</Link>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

const chip: React.CSSProperties = { background: '#0f3f61', borderRadius: 18, padding: '8px 12px', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' };
const card: React.CSSProperties = { background: '#0f3f61', borderRadius: 14, padding: 12, display: 'grid', gap: 10 };
const pic: React.CSSProperties = { height: 140, borderRadius: 12, backgroundSize: 'cover', backgroundPosition: 'center' };
const title: React.CSSProperties = { fontSize: 16, fontWeight: 800 };
const price: React.CSSProperties = { fontWeight: 900, color: '#4de1a1' };
const small: React.CSSProperties = { background: '#48d597', color: '#05344f', border: 'none', borderRadius: 10, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' };
const smallGhost: React.CSSProperties = { background: 'transparent', color: '#fff', border: '1px solid #2a6e96', borderRadius: 10, padding: '8px 10px', fontWeight: 700, textDecoration: 'none' };


