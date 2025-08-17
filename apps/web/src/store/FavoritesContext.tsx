import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getUserIdUnsafe } from '../shared/telegram';

export type Favorite = { sku: string };

type FavoritesValue = {
	items: Set<string>;
	isFav: (sku: string) => boolean;
	toggle: (sku: string) => void;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

function storageKey() {
	return `speen_fav_${getUserIdUnsafe() || 'guest'}`;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
	const [items, setItems] = useState<Set<string>>(new Set());

	useEffect(() => {
		try {
			const raw = localStorage.getItem(storageKey());
			if (raw) setItems(new Set(JSON.parse(raw)));
		} catch {}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(storageKey(), JSON.stringify(Array.from(items)));
		} catch {}
	}, [items]);

	const isFav = (sku: string) => items.has(sku);
	const toggle = (sku: string) => setItems(prev => {
		const next = new Set(prev);
		if (next.has(sku)) next.delete(sku); else next.add(sku);
		return next;
	});

	const value: FavoritesValue = useMemo(() => ({ items, isFav, toggle }), [items]);
	return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
	const ctx = useContext(FavoritesContext);
	if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
	return ctx;
}


