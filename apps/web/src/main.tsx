import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './shell/AppShell';
import { onTgReady } from './shared/telegram';
import RestaurantHome from './screens/RestaurantHome';
import DishDetails from './screens/DishDetails';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import AuthScreen from './screens/AuthScreen';
import { CartProvider } from './store/CartContext';
import { FavoritesProvider } from './store/FavoritesContext';

const queryClient = new QueryClient();

const router = createBrowserRouter([
	{
		path: '/',
		element: <AppShell />,
		children: [
			{ index: true, element: <RestaurantHome /> },
			{ path: 'dish/:slug', element: <DishDetails /> },
			{ path: 'cart', element: <CartScreen /> },
			{ path: 'checkout', element: <CheckoutScreen /> },
            { path: 'auth', element: <AuthScreen /> },
		],
	},
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<FavoritesProvider>
				<CartProvider>
					<RouterProvider router={router} />
				</CartProvider>
			</FavoritesProvider>
		</QueryClientProvider>
	</React.StrictMode>
);

onTgReady();


