import { categories, menu } from '../data/menu';
import { Link } from 'react-router-dom';

export default function RestaurantHome() {
	return (
		<div style={{ display: 'grid', gap: 16 }}>
			<h1 style={{ margin: 0 }}>Меню ресторана</h1>
			<p style={{ opacity: 0.85 }}>Выберите раздел и откройте подробности каждого блюда: фото, описание, калории и состав.</p>
			<div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
				{categories.map(c => (
					<a key={c.key} href={`#cat-${c.key}`} style={chip}>{c.title}</a>
				))}
			</div>
			{categories.map(c => (
				<section key={c.key} id={`cat-${c.key}`} style={{ display: 'grid', gap: 10 }}>
					<h2 style={{ margin: 0 }}>{c.title}</h2>
					<div style={grid}>
						{menu.filter(m => m.category === c.key).map(m => (
							<Link to={`/dish/${m.slug}`} key={m.slug} style={card}>
								<div style={{ ...pic, backgroundImage: `url(${m.imageUrl})` }} />
								<div style={{ display: 'grid', gap: 6 }}>
									<div style={title}>{m.title}</div>
									<div style={desc}>{m.description}</div>
									<div style={price}>{m.price.toLocaleString('ru-RU')} ₽</div>
								</div>
							</Link>
						))}
					</div>
				</section>
			))}
		</div>
	);
}

const chip: React.CSSProperties = { background: '#0f3f61', borderRadius: 20, padding: '8px 12px', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' };
const grid: React.CSSProperties = { display: 'grid', gap: 12 };
const card: React.CSSProperties = { background: '#0f3f61', borderRadius: 14, padding: 12, display: 'grid', gap: 10, color: '#fff', textDecoration: 'none' };
const pic: React.CSSProperties = { height: 140, borderRadius: 12, backgroundSize: 'cover', backgroundPosition: 'center' };
const title: React.CSSProperties = { fontSize: 18, fontWeight: 800 };
const desc: React.CSSProperties = { opacity: 0.85 };
const price: React.CSSProperties = { fontSize: 20, fontWeight: 900, color: '#4de1a1' };


