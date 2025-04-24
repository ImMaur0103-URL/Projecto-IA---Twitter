// routes/profile.js
const express = require('express');
const router = express.Router();
const UserModel = require('../models/userModel');
const TweetModel = require('../models/tweetModel');

// Sample user for now - in a real app, this would come from authentication
const SAMPLE_USER_ID = '10000000-0000-0000-0000-000000000001'; // Replace with a valid UUID from your database

// Helper function to format tweets for profile display
function formatTweetsForProfile(tweets) {
  return tweets.map(tweet => {
    const timeAgo = getTimeAgo(tweet.created_at);
    
    return {
      title: tweet.content.split(' ').slice(0, 5).join(' ') + '...',
      content: tweet.content,
      timeAgo,
      // Mock data for demo purposes
      link: null,
      linkText: null,
      linkPreview: null,
      imageUrl: null,
      imageAlt: null
    };
  });
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
}

// User profile route
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
    
    // Format profile data
    const profileData = {
      name: user.name,
      username: user.username,
      initials: user.name.split(' ').map(n => n[0]).join(''),
      avatarUrl: user.picture ? `data:image/jpeg;base64,${user.picture.toString('base64')}` : null,
      bio: 'Full-stack developer passionate about JavaScript, Node.js, and modern web technologies.',
      skills: ['JavaScript', 'Node.js', 'Express', 'React', 'MongoDB'],
      location: 'San Francisco, CA',
      website: 'https://example.com',
      websiteDisplay: 'example.com',
      joinDate: 'January 2023',
      email: user.mail
    };
    
    // Get user's tweets
    const tweets = await TweetModel.getTweetsByUserId(SAMPLE_USER_ID);
    const formattedPosts = formatTweetsForProfile(tweets);
    
    res.render('users', {
      title: `${profileData.name} (@${profileData.username})`,
      profile: profileData,
      posts: formattedPosts
    });
  } catch (err) {
    console.error('Error in profile route:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'An error occurred while loading the profile page.'
    });
  }
});

// View specific user profile
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Get user by username
    const user = await UserModel.getUserByUsername(username);
    if (!user) {
      return res.status(404).render('error', {
        title: 'User Not Found',
        message: `The user @${username} could not be found.`
      });
    }
    
    // Format profile data
    const profileData = {
      name: user.name,
      username: user.username,
      initials: user.name.split(' ').map(n => n[0]).join(''),
      avatarUrl: user.picture ? `data:image/jpeg;base64,${user.picture.toString('base64')}` : null,
      bio: 'Full-stack developer passionate about JavaScript, Node.js, and modern web technologies.',
      skills: ['JavaScript', 'Node.js', 'Express', 'React', 'MongoDB'],
      location: 'San Francisco, CA',
      website: 'https://example.com',
      websiteDisplay: 'example.com',
      joinDate: 'January 2023',
      email: user.mail
    };
    
    // Get user's tweets
    const tweets = await TweetModel.getTweetsByUserId(user.user_id);
    const formattedPosts = formatTweetsForProfile(tweets);
    
    res.render('users', {
      title: `${profileData.name} (@${profileData.username})`,
      profile: profileData,
      posts: formattedPosts
    });
  } catch (err) {
    console.error('Error in user profile route:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'An error occurred while loading the user profile page.'
    });
  }
});

module.exports = router;