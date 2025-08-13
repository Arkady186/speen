import WebApp from '@twa-dev/sdk';

export function isTelegram(): boolean {
	return typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp);
}

export function getInitData(): string | null {
	try {
		return (window as any).Telegram?.WebApp?.initData ?? null;
	} catch {
		return null;
	}
}

export function getUserIdUnsafe(): string | null {
	try {
		return String((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ?? '') || null;
	} catch {
		return null;
	}
}

export function onTgReady() {
	try {
		WebApp.ready();
		WebApp.expand();
	} catch {}
}


