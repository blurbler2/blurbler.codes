const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the Vite build output (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for unknown routes
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});