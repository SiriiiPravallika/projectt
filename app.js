const express = require('express');
const session = require('express-session');
const path = require('path');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'replace-with-secure-secret',
  resave: false,
  saveUninitialized: false,
}));

app.use('/', authRoutes);

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync DB:', err);
});
