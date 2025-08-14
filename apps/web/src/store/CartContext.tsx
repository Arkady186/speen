import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getUserIdUnsafe } from '../shared/telegram';

export type CartItem = {
	sku: string;
	title: string;
	price: number;
	qty: number;
};

type CartContextValue = {
	items: CartItem[];
	total: number;
	addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
	removeItem: (sku: string) => void;
	setQty: (sku: string, qty: number) => void;
	clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function getStorageKey() {
	const userId = getUserIdUnsafe() || 'guest';
	return `speen_cart_${userId}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
	const [items, setItems] = useState<CartItem[]>([]);

	useEffect(() => {
		try {
			const key = getStorageKey();
			const raw = localStorage.getItem(key);
			if (raw) setItems(JSON.parse(raw));
		} catch {}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(getStorageKey(), JSON.stringify(items));
		} catch {}
	}, [items]);

	const addItem = (item: Omit<CartItem, 'qty'>, qty: number = 1) => {
		setItems(prev => {
			const existing = prev.find(i => i.sku === item.sku);
			if (existing) {
				return prev.map(i => i.sku === item.sku ? { ...i, qty: i.qty + qty } : i);
			}
			return [...prev, { ...item, qty }];
		});
	};

	const removeItem = (sku: string) => setItems(prev => prev.filter(i => i.sku !== sku));
	const setQty = (sku: string, qty: number) => setItems(prev => prev.map(i => i.sku === sku ? { ...i, qty } : i));
	const clear = () => setItems([]);

	const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);

	const value: CartContextValue = { items, total, addItem, removeItem, setQty, clear };
	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
	const ctx = useContext(CartContext);
	if (!ctx) throw new Error('useCart must be used within CartProvider');
	return ctx;
}


