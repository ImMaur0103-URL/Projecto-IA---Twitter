// routes/explore.js
const express = require('express');
const router = express.Router();
const UserModel = require('../models/userModel');
const TweetModel = require('../models/tweetModel');

// Explore page route
router.get('/', async (req, res) => {
  try {
    // Get trending topics
    const trendingTopics = await TweetModel.getTrendingTopics();
    
    // Get popular accounts (simplification - in a real app, you'd determine popularity)
    const allUsers = await UserModel.getAllUsers();
    const popularAccounts = allUsers.slice(0, 6).map(user => ({
      name: user.name,
      username: user.username,
      initials: user.name.split(' ').map(n => n[0]).join(''),
      avatarUrl: user.picture ? `data:image/jpeg;base64,${user.picture.toString('base64')}` : null
    }));
    
    // Mock news items (these would come from another source in a real app)
    const newsItems = [
      {
        title: 'New Features Coming to JavaScript in ES2023',
        description: 'The ECMAScript committee has announced several new features that will be included in the upcoming release.',
        imageUrl: '/api/placeholder/400/220',
        source: { name: 'Tech Daily', avatarUrl: null, initials: 'TD' },
        timeAgo: '3 hours ago'
      },
      {
        title: 'Popular Framework Releases Major Update',
        description: 'The new version includes performance improvements, bug fixes, and several new features requested by the community.',
        imageUrl: '/api/placeholder/400/220',
        source: { name: 'Web Dev News', avatarUrl: null, initials: 'WD' },
        timeAgo: '5 hours ago'
      },
      {
        title: 'Study Shows Demand for Full-Stack Developers Continues to Rise',
        description: 'Companies are increasingly looking for developers with both frontend and backend skills, according to a new industry report.',
        imageUrl: '/api/placeholder/400/220',
        source: { name: 'Tech Careers', avatarUrl: null, initials: 'TC' },
        timeAgo: '8 hours ago'
      }
    ];
    
    res.render('explore', {
      title: 'Explore',
      trendingTopics,
      popularAccounts,
      newsItems
    });
  } catch (err) {
    console.error('Error in explore route:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'An error occurred while loading the explore page.'
    });
  }
});

// Search route
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  // In a real app, you would search your database with this query
  console.log('Search query:', q);
  
  res.render('search-results', {
    title: 'Search Results',
    query: q,
    // You would replace these with actual search results
    results: []
  });
});

module.exports = router;