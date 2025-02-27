const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const methodOverride = require('method-override');

dotenv.config();
const app = express();

// SSL configuration
const sslOptions = {
    key: fs.readFileSync('./ssl/private.key'),
    cert: fs.readFileSync('./ssl/certificate.crt'),
    ca: fs.readFileSync('./ssl/ca_bundle.crt')
};

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));



// Set Pug as view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
}));

// Routes
const inventoryRoutes = require('./routes/inventory');
const roomsRoutes = require('./routes/rooms');        // Changed from locations
const storageRoutes = require('./routes/storage');
const containersRoutes = require('./routes/containers');
const itemsRoutes = require('./routes/items');
const qrsRoutes = require('./routes/qrs');
const qrAssignmentRoutes = require('./routes/qr_assignment');
const apiRoute = require('./routes/api');


 
app.use('/', inventoryRoutes);
app.use('/rooms', roomsRoutes);                       // Changed from locations
app.use('/storage', storageRoutes);
app.use('/containers', containersRoutes);
app.use('/items', itemsRoutes);
app.use('/qr', qrAssignmentRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/qrs', qrsRoutes);
app.use('/api', apiRoute);


const PORT = process.env.PORT || 3001;

const httpsServer = https.createServer(sslOptions, app);
httpsServer.listen(PORT, () => {
    console.log(`Secure server running on https://localhost:${PORT}`);
});
//app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
// Update the error handler at the bottom of app.js
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('pages/inventory/dashboard', {
        error: 'Something broke!',
        stats: { items_count: 0, rooms_count: 0, storage_count: 0, containers_count: 0 },
        recentItems: []
    });
});

/**
 * Main Application Entry Point
 * 
 * Dependencies:
 * - express: Web framework
 * - path: File path operations
 * - cookie-parser: Parse Cookie header
 * - express-session: Session middleware
 * - body-parser: Parse HTTP request bodies
 * - dotenv: Environment variables
 * - method-override: Support PUT/DELETE in forms
 * 
 * Configuration:
 * - Uses Pug templating engine
 * - Static files served from /public
 * - Session management with JWT secret
 * 
 * Routes:
 * - /: Main inventory dashboard
 * - /rooms: Room management
 * - /storage: Storage locations
 * - /containers: Container management
 * - /items: Item tracking
 * 
 * Error Handling:
 * - Global error handler renders dashboard with error message
 */
