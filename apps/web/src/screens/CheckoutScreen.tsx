import { useState } from 'react';
import { useCart } from '../store/CartContext';
import { getUserIdUnsafe } from '../shared/telegram';

export default function CheckoutScreen() {
	const { items, total, clear } = useCart();
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [address, setAddress] = useState('');
	const [status, setStatus] = useState<string | null>(null);

	async function submit() {
		if (!name || !phone || !address) { setStatus('Заполните все поля'); return; }
		setStatus('Отправляем заказ...');
		try {
			const res = await fetch(import.meta.env.VITE_API_URL + '/api/order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: getUserIdUnsafe() || 'guest',
					name, phone, address,
					items,
					total,
				})
			});
			if (!res.ok) throw new Error('fail');
			setStatus('Заказ принят! Мы свяжемся с вами.');
			clear();
		} catch {
			setStatus('Ошибка при оформлении. Попробуйте позже');
		}
	}

	return (
		<div style={{ display: 'grid', gap: 10 }}>
			<h2 style={{ margin: 0 }}>Оформление заказа</h2>
			<input placeholder="Имя" value={name} onChange={e => setName(e.target.value)} style={input} />
			<input placeholder="Телефон" value={phone} onChange={e => setPhone(e.target.value)} style={input} />
			<textarea placeholder="Адрес доставки" value={address} onChange={e => setAddress(e.target.value)} style={textarea} />
			<div>Итого к оплате: <b>{total.toLocaleString('ru-RU')} ₽</b></div>
			<button style={primary} onClick={submit}>Подтвердить заказ</button>
			{status && <div>{status}</div>}
		</div>
	);
}

const input: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid #2a6e96', background: '#07263c', color: '#fff' };
const textarea: React.CSSProperties = { ...input, minHeight: 80 } as React.CSSProperties;
const primary: React.CSSProperties = { background: '#48d597', color: '#05344f', border: 'none', borderRadius: 12, padding: '12px 14px', fontWeight: 900, cursor: 'pointer' };



