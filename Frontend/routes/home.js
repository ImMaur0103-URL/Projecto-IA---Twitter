// routes/home.js
const express = require('express');
const router = express.Router();
const UserModel = require('../models/userModel');
const TweetModel = require('../models/tweetModel');
const fetch = require('node-fetch');

// Sample user for now - in a real app, this would come from authentication
const SAMPLE_USER_ID = '10000000-0000-0000-0000-000000000001'; // Replace with a valid UUID from your database

// Helper function to format tweets for display
function formatTweetsForDisplay(tweets) {
  return tweets.map(tweet => {
    return {
      user: {
        name: tweet.name,
        username: tweet.username,
        initials: tweet.name.split(' ').map(n => n[0]).join(''),
        avatarUrl: tweet.picture ? `data:image/jpeg;base64,${tweet.picture.toString('base64')}` : null
      },
      content: tweet.content,
      timeAgo: getTimeAgo(tweet.created_at),
      comments: 'Comments', // You'd need a comments table for this
      retweets: 'retweets', // You'd need a retweets table for this
      likes: tweet.likes,
      sentiment: tweet.sentiment
    };
  });
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm';
  
  return Math.floor(seconds) + 's';
}

// Home page route
router.get('/', async (req, res) => {
  try {
    // Get current user
    const user = await UserModel.getUserById(req.session.user.user_id);
    if (!user) {
      return res.status(404).render('error', {
        title: 'User Not Found',
        message: 'The current user could not be found.'
      });
    }
    
    // Format user for display
    const userData = {
      name: user.name,
      username: user.username,
      initials: user.name.split(' ').map(n => n[0]).join(''),
      avatarUrl: user.picture ? `data:image/jpeg;base64,${user.picture.toString('base64')}` : null
    };
    
    // Get all tweets
    const tweets = await TweetModel.getAllTweets();
    const formattedTweets = formatTweetsForDisplay(tweets);
    
    // Get trending topics
    const trends = await TweetModel.getTrendingTopics();
    
    // Get user suggestions (just getting some users from the database)
    const allUsers = await UserModel.getAllUsers();
    const suggestions = allUsers
      .filter(u => u.user_id !== SAMPLE_USER_ID)
      .slice(0, 3)
      .map(u => ({
        name: u.name,
        username: u.username,
        initials: u.name.split(' ').map(n => n[0]).join(''),
        avatarUrl: u.picture ? `data:image/jpeg;base64,${u.picture.toString('base64')}` : null
      }));
    
    res.render('home', {
      title: 'Home',
      user: userData,
      tweets: formattedTweets,
      trends,
      suggestions
    });
  } catch (err) {
    console.error('Error in home route:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'An error occurred while loading the home page.'
    });
  }
});

// Handle tweet submission
router.post('/tweet', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.redirect('/');
    }
    
    // --- Análisis de Sentimiento ---
    const apiUrl = 'http://127.0.0.1:8000/api/Analiza/?text=' + encodeURIComponent(content); // Construye la URL
    let sentimiento = 0; // Valor por defecto
    let valor = "neutral";

    try {
        const response = await fetch(apiUrl); // Hace la petición a la API
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json(); // Parsea la respuesta JSON

        // Asigna los valores desde la respuesta de la API
        sentimiento = data.Valor;
        valor = data.Sentimiento;

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Error al analizar el sentimiento: No se pudo conectar a la API. La API de sentimiento está corriendo? :', error);
            return res.redirect('/');
             // Puedes elegir un manejo de error diferente aquí, como redirigir con un mensaje.
            // Por ahora, mantenemos los valores por defecto y continuamos.
        }
        else{
          console.error('Error al analizar el sentimiento:', error);
          return res.redirect('/');
        }
    }
    // --- Fin del Análisis de Sentimiento ---

    // Create tweet in database
    await TweetModel.createTweet({
      content,
      userId: req.session.user.user_id,
      sentiment: sentimiento // You could implement sentiment analysis here
    });
    
    // Redirect back to home page
    res.redirect('/');
  } catch (err) {
    console.error('Error creating tweet:', err);
    res.status(500).render('error', {
      title: 'Tweet Error',
      message: 'An error occurred while creating your tweet.'
    });
  }
});

module.exports = router;