export type Nutrition = {
	kcal: number; // калории
	protein: number; // белки
	fat: number; // жиры
	carbs: number; // углеводы
};

export type MenuItem = {
	slug: string;
	category: 'burgers' | 'pizza' | 'salads' | 'drinks' | 'desserts';
	title: string;
	description: string;
	imageUrl: string;
	price: number;
	nutrition: Nutrition;
};

export const categories: { key: MenuItem['category']; title: string }[] = [
	{ key: 'burgers', title: 'Бургеры' },
	{ key: 'pizza', title: 'Пицца' },
	{ key: 'salads', title: 'Салаты' },
	{ key: 'drinks', title: 'Напитки' },
	{ key: 'desserts', title: 'Десерты' },
];

export const menu: MenuItem[] = [
	{
		slug: 'classic-burger',
		category: 'burgers',
		title: 'Классический бургер',
		description: 'Сочная котлета, сыр чеддер, соус и свежие овощи в бриошь булочке.',
		imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop',
		price: 390,
		nutrition: { kcal: 540, protein: 28, fat: 32, carbs: 38 },
	},
	{
		slug: 'double-cheese',
		category: 'burgers',
		title: 'Дабл чиз',
		description: 'Две котлеты, много сыра, фирменный соус и маринованные огурчики.',
		imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=1200&auto=format&fit=crop',
		price: 470,
		nutrition: { kcal: 720, protein: 44, fat: 46, carbs: 40 },
	},
	{
		slug: 'pepperoni-pizza',
		category: 'pizza',
		title: 'Пепперони',
		description: 'Тонкое тесто, соус из томатов, сыр моцарелла и пряная пепперони.',
		imageUrl: 'https://images.unsplash.com/photo-1548365328-9f547fb095de?q=80&w=1200&auto=format&fit=crop',
		price: 690,
		nutrition: { kcal: 890, protein: 36, fat: 48, carbs: 74 },
	},
	{
		slug: 'ceasar-salad',
		category: 'salads',
		title: 'Цезарь',
		description: 'Классика: ромэн, курица, пармезан, сухарики и соус цезарь.',
		imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=1200&auto=format&fit=crop',
		price: 420,
		nutrition: { kcal: 360, protein: 28, fat: 18, carbs: 20 },
	},
	{
		slug: 'lemonade',
		category: 'drinks',
		title: 'Лимонад домашний',
		description: 'Свежий лимон, мята и газированная вода.',
		imageUrl: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?q=80&w=1200&auto=format&fit=crop',
		price: 190,
		nutrition: { kcal: 120, protein: 0, fat: 0, carbs: 28 },
	},
	{
		slug: 'cheesecake',
		category: 'desserts',
		title: 'Чизкейк Нью-Йорк',
		description: 'Нежный сырный десерт на песочной основе с ванилью.',
		imageUrl: 'https://images.unsplash.com/photo-1541782814459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop',
		price: 290,
		nutrition: { kcal: 410, protein: 8, fat: 26, carbs: 36 },
	},
];

export function findItem(slug: string): MenuItem | undefined {
	return menu.find(m => m.slug === slug);
}


