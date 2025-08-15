import { useState } from 'react';
import { getUserIdUnsafe } from '../shared/telegram';

export default function AuthScreen() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [mode, setMode] = useState<'login' | 'register'>('register');
	const [status, setStatus] = useState<string | null>(null);

	async function submit() {
		setStatus('Отправка...');
		try {
			const endpoint = mode === 'register' ? '/api/register' : '/api/login';
			const res = await fetch(import.meta.env.VITE_API_URL + endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: getUserIdUnsafe() || 'guest', username, password })
			});
			if (!res.ok) throw new Error('fail');
			setStatus(mode === 'register' ? 'Успешная регистрация! Проверьте сообщение от бота.' : 'Вход выполнен');
		} catch {
			setStatus('Ошибка. Попробуйте позже');
		}
	}

	return (
		<div style={{ display: 'grid', gap: 12 }}>
			<h2 style={{ margin: 0 }}>{mode === 'register' ? 'Регистрация' : 'Вход'}</h2>
			<input placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} style={input} />
			<input placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} type="password" style={input} />
			<button style={primary} onClick={submit}>{mode === 'register' ? 'Зарегистрироваться' : 'Войти'}</button>
			<button style={ghost} onClick={() => setMode(m => m === 'register' ? 'login' : 'register')}>
				{mode === 'register' ? 'У меня уже есть аккаунт' : 'Создать новый аккаунт'}
			</button>
			{status && <div>{status}</div>}
		</div>
	);
}

const input: React.CSSProperties = { padding: '10px 12px', borderRadius: 12, border: '1px solid #2a6e96', background: '#07263c', color: '#fff' };
const primary: React.CSSProperties = { background: '#48d597', color: '#05344f', border: 'none', borderRadius: 12, padding: '12px 14px', fontWeight: 900, cursor: 'pointer' };
const ghost: React.CSSProperties = { background: 'transparent', color: '#fff', border: '1px solid #2a6e96', borderRadius: 12, padding: '10px 12px', cursor: 'pointer' };


