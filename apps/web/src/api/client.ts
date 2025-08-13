const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
import { getInitData, getUserIdUnsafe } from '../shared/telegram';

export type UserState = { balance: number; spins: number };

const defaultUserId = 'local-user';

export async function apiInit(userId: string = defaultUserId): Promise<UserState> {
	const res = await fetch(`${API_URL}/api/init`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'x-telegram-init': getInitData() ?? '' },
		body: JSON.stringify({ userId }),
	});
	if (!res.ok) throw new Error('init failed');
	return res.json();
}

export async function apiReward(amount: number, userId: string = defaultUserId): Promise<UserState> {
	const res = await fetch(`${API_URL}/api/reward`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'x-telegram-init': getInitData() ?? '' },
		body: JSON.stringify({ userId, amount }),
	});
	if (!res.ok) throw new Error('reward failed');
	return res.json();
}


