/*
* Este proyecto es un copia no lucrativa de tweeter para un proyecto universitario.
* Fue creado por Mauricio Lopez y Benjamin Izquierdo con ayuda de una IA que proporciona el HTML
* de las vistas para facilitar el proceso de creación
*/
const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const app = express();
const session = require('express-session');
const handlebars = require('handlebars'); 


const PORT = process.env.PORT || 3000;

app.use(session({
  secret: 'tweeter-universitario', // clave para firmar la cookie
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 10 * 60 * 1000 // 10 minutos en milisegundos
  }
}));
function authMiddleware(req, res, next) {
    if (req.session && req.session.user) {
      // Usuario autenticado
      next();
    } else {
      // No autenticado, redirige a login
      res.redirect('/login');
    }
  }
  
// Import routes
const homeRoutes = require('./routes/home');
const exploreRoutes = require('./routes/explore');
const profileRoutes = require('./routes/profile');
const loginRoutes = require('./routes/login');

// Setup Handlebars as the view engine
const hbs = exphbs.create({
  extname: '.hjs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views'),
  partialsDir: path.join(__dirname, 'views/partials')
});

app.engine('hjs', hbs.engine);
app.set('view engine', 'hjs');
handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});
app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'views/login'),
    path.join(__dirname, 'views/Explore'),
    path.join(__dirname, 'views/home'),
    path.join(__dirname, 'views/Users')
  ]);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/login', loginRoutes);
app.use('/explore', authMiddleware, exploreRoutes);
app.use('/profile', authMiddleware, profileRoutes);
app.use('/', authMiddleware, homeRoutes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Not Found',
    message: 'Page not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('error', {
    title: 'Error',
    message: err.message || 'Something went wrong'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;