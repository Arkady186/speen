export type Category = {
	key: string;
	parent?: string | null;
	title: string;
};

export type Product = {
	sku: string;
	category: string; // category key
	brand?: string;
	title: string;
	price: number;
	oldPrice?: number;
	images: string[];
	description?: string;
	specs?: Record<string, string | number>;
};

export const categories: Category[] = [
	{ key: 'root', parent: null, title: 'Каталог' },
	{ key: 'cables', parent: 'root', title: 'Кабели/шнуры/провода' },
	{ key: 'power', parent: 'root', title: 'Зарядные устройства' },
	{ key: 'audio', parent: 'root', title: 'Гарнитуры и аудио' },
	{ key: 'watch', parent: 'root', title: 'Аксессуары для Apple Watch' },
	{ key: 'holders', parent: 'root', title: 'Держатели для телефона' },
];

export const products: Product[] = [
	{
		sku: 'hoco-usb-c-2m',
		category: 'cables',
		brand: 'HOCO',
		title: 'Кабель USB-C 2м',
		price: 590,
		oldPrice: 690,
		images: [
			'https://images.unsplash.com/photo-1581093458791-9d09c5b7e63c?q=80&w=1600&auto=format&fit=crop',
		],
		description: 'Плотная оплетка, быстрая зарядка и передача данных.',
		specs: { Длина: '2 м', Коннектор: 'USB-C', Ток: '3A' },
	},
	{
		sku: 'hoco-charger-20w',
		category: 'power',
		brand: 'HOCO',
		title: 'Сетевое зарядное 20W',
		price: 1290,
		images: [
			'https://images.unsplash.com/photo-1609592424514-c7c90907b7d6?q=80&w=1600&auto=format&fit=crop',
		],
		description: 'Быстрая зарядка для смартфонов и планшетов.',
		specs: { Мощность: '20W', Порты: 'USB-C', Протоколы: 'PD/QC' },
	},
	{
		sku: 'hoco-bt-headset',
		category: 'audio',
		brand: 'HOCO',
		title: 'Bluetooth гарнитура',
		price: 1990,
		images: [
			'https://images.unsplash.com/photo-1518445305435-4e3780a1f743?q=80&w=1600&auto=format&fit=crop',
		],
		description: 'Шумоподавление, стабильное соединение, до 20 часов.',
		specs: { Bluetooth: '5.3', Время_работы: '20 ч' },
	},
];

export function childrenOf(parent: string | null): Category[] {
	return categories.filter(c => (parent === null ? c.parent == null : c.parent === parent));
}

export function getCategory(key: string): Category | undefined {
	return categories.find(c => c.key === key);
}

export function listProductsByCategory(category: string): Product[] {
	return products.filter(p => p.category === category);
}

export function getProduct(sku: string): Product | undefined {
	return products.find(p => p.sku === sku);
}


