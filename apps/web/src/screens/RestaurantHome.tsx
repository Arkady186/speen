import { categories, menu } from '../data/menu';
import { Link } from 'react-router-dom';
import { IconCart } from '../components/icons';

export default function RestaurantHome() {
	return (
		<div style={{ display: 'grid', gap: 16 }}>
			<header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<h1 style={{ margin: 0 }}>Menu</h1>
				<Link to="/cart" style={{ color: '#fff' }}><IconCart /></Link>
			</header>
			<input placeholder="Search" style={search} />
			<div style={bannerRow}>
				<div style={{ ...banner, backgroundImage: 'url(https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1600&auto=format&fit=crop)' }} />
				<div style={{ ...banner, backgroundImage: 'url(https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1600&auto=format&fit=crop)' }} />
			</div>
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
									<div style={meta}><span>20 мин</span><span>★ 4.8</span></div>
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
const search: React.CSSProperties = { padding: '10px 12px', borderRadius: 12, border: '1px solid #2a6e96', background: '#07263c', color: '#fff' };
const bannerRow: React.CSSProperties = { display: 'flex', gap: 10, overflowX: 'auto' };
const banner: React.CSSProperties = { minWidth: 240, height: 120, borderRadius: 14, backgroundSize: 'cover', backgroundPosition: 'center' };
const meta: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', opacity: 0.85, fontSize: 12 };
const grid: React.CSSProperties = { display: 'grid', gap: 12 };
const card: React.CSSProperties = { background: '#0f3f61', borderRadius: 14, padding: 12, display: 'grid', gap: 10, color: '#fff', textDecoration: 'none' };
const pic: React.CSSProperties = { height: 140, borderRadius: 12, backgroundSize: 'cover', backgroundPosition: 'center' };
const title: React.CSSProperties = { fontSize: 18, fontWeight: 800 };
const desc: React.CSSProperties = { opacity: 0.85 };
const price: React.CSSProperties = { fontSize: 20, fontWeight: 900, color: '#4de1a1' };


