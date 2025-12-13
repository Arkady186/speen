import React from 'react'
import { createRoot } from 'react-dom/client'
import { WheelLoader } from './wheel/WheelLoader'
import { GameScreen } from './GameScreen'
import './styles.css'

// Глобальная обработка ошибок для подавления ошибок расширений браузера
window.addEventListener('error', (event) => {
	// Подавляем ошибки расширений браузера
	if (event.message?.includes('Extension context invalidated') || 
		event.message?.includes('message port closed') ||
		event.filename?.includes('page.bundle.js')) {
		event.preventDefault()
		return false
	}
	// Остальные ошибки логируем, но не прерываем выполнение
	console.warn('Unhandled error:', event.error || event.message)
	return false
}, true)

// Обработка необработанных отклонений промисов
window.addEventListener('unhandledrejection', (event) => {
	// Подавляем ошибки расширений браузера
	if (event.reason?.message?.includes('Extension context invalidated') ||
		event.reason?.message?.includes('message port closed')) {
		event.preventDefault()
		return
	}
	// Остальные ошибки логируем
	console.warn('Unhandled promise rejection:', event.reason)
})

// Обработка ошибок загрузки favicon
const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement
if (link) {
	link.onerror = () => {
		// Игнорируем ошибку загрузки favicon
		link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>'
	}
}

const container = document.getElementById('root')!
const root = createRoot(container)

function App() {
	const [loading, setLoading] = React.useState(true)
	return loading ? <WheelLoader onDone={() => setLoading(false)} /> : <GameScreen />
}

root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)


