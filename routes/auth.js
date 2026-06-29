const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const crypto = require('crypto');

const router = express.Router();

router.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('index', { user: null, error: null });
});

router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

router.post('/signup', async (req, res) => {
  // Mandatory POST enforced by route definition
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).render('signup', { error: 'Email and password required' });

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).render('signup', { error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(24).toString('hex');
    const user = await User.create({ email, passwordHash, verifyToken, isVerified: false });

    const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${verifyToken}`;
    let previewUrl = null;
    try {
      // attempt to send using nodemailer if available
      const nodemailer = require('nodemailer');
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      const info = await transporter.sendMail({
        from: 'no-reply@example.com',
        to: user.email,
        subject: 'Verify your email',
        text: `Click to verify: ${verifyUrl}`,
        html: `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`
      });
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL:', previewUrl);
    } catch (sendErr) {
      // If nodemailer isn't installed or sending fails, just show the verify link on the page
      console.warn('Email send failed or nodemailer missing:', sendErr && sendErr.message ? sendErr.message : sendErr);
    }

    res.render('check_email', { email: user.email, previewUrl, verifyUrl });
  } catch (err) {
    console.error(err);
    res.status(500).render('signup', { error: 'Server error' });
  }
});

router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ where: { verifyToken: token } });
  if (!user) return res.status(400).render('verify_result', { success: false });
  user.isVerified = true;
  user.verifyToken = null;
  await user.save();
  req.session.userId = user.id;
  res.render('verify_result', { success: true });
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).render('login', { error: 'Email and password required' });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).render('login', { error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).render('login', { error: 'Invalid credentials' });

    req.session.userId = user.id;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('login', { error: 'Server error' });
  }
});

router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findByPk(req.session.userId);
  res.render('dashboard', { user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    res.redirect('/');
  });
});

module.exports = router;
