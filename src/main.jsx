import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// WebSocket setup (moved from index.html)
function startWebSocket() {
	try {
		const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
		const wsUrl = `${proto}//${window.location.host}`
		const ws = new WebSocket(wsUrl)

		ws.addEventListener('open', () => console.log('WS connected', wsUrl))
		ws.addEventListener('message', (event) => {
			console.log('Message from server', event.data)
		})
		ws.addEventListener('close', (ev) => console.log('WS closed', ev.code, ev.reason))
		ws.addEventListener('error', (err) => console.error('WS error', err))

		// expose for debugging if needed
		window.__ws = ws
		return ws
	} catch (e) {
		console.error('Failed to start WebSocket', e)
		return null
	}
}

startWebSocket()

createRoot(document.getElementById('root')).render(<App />)
