// Placeholder: this screen will be replaced by CatalogScreen as home
import CatalogScreen from './CatalogScreen';

export default function RestaurantHome() { return <CatalogScreen />; }

// styles no longer used here
const grid: React.CSSProperties = { display: 'grid', gap: 12 };
const card: React.CSSProperties = { background: '#0f3f61', borderRadius: 14, padding: 12, display: 'grid', gap: 10, color: '#fff', textDecoration: 'none' };
const pic: React.CSSProperties = { height: 140, borderRadius: 12, backgroundSize: 'cover', backgroundPosition: 'center' };
const title: React.CSSProperties = { fontSize: 18, fontWeight: 800 };
const desc: React.CSSProperties = { opacity: 0.85 };
const price: React.CSSProperties = { fontSize: 20, fontWeight: 900, color: '#4de1a1' };


