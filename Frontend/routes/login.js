const express = require('express');
const UserModel = require('../models/userModel');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('login', { title: 'Iniciar sesión' });
});

router.post('/', async (req, res) => {
  const { username } = req.body;

  if (username) {
    try{
        const user = await UserModel.getUserByUsername(req.body);
        req.session.user = user;
        res.redirect('/');
    } catch (err) {
        res.redirect('/login');
    }
  } else {
    res.render('login', { error: 'Debes ingresar un nombre de usuario' });
  }
});

module.exports = router;