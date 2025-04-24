// models/tweetModel.js
const sql = require('mssql');
const db = require('../_config/database');

class TweetModel {
  // Get all tweets
  static async getAllTweets() {
    try {
      const result = await db.executeQuery(`
        SELECT t.*, u.name, u.username, u.picture
        FROM tweets t
        JOIN Users u ON t.user_id = u.user_id
        ORDER BY t.created_at DESC
      `);
      return result.recordset;
    } catch (err) {
      console.error('Error getting all tweets:', err);
      throw err;
    }
  }

  // Get tweet by ID
  static async getTweetById(tweetId) {
    try {
      const result = await db.executeQuery(`
        SELECT t.*, u.name, u.username, u.picture
        FROM tweets t
        JOIN Users u ON t.user_id = u.user_id
        WHERE t.tweet_id = @tweetId
      `, [
        { name: 'tweetId', type: sql.Int, value: tweetId }
      ]);
      return result.recordset[0];
    } catch (err) {
      console.error('Error getting tweet by ID:', err);
      throw err;
    }
  }

  // Get tweets by user ID
  static async getTweetsByUserId(userId) {
    try {
      const result = await db.executeQuery(`
        SELECT t.*, u.name, u.username, u.picture
        FROM tweets t
        JOIN Users u ON t.user_id = u.user_id
        WHERE t.user_id = @userId
        ORDER BY t.created_at DESC
      `, [
        { name: 'userId', type: sql.UniqueIdentifier, value: userId }
      ]);
      return result.recordset;
    } catch (err) {
      console.error('Error getting tweets by user ID:', err);
      throw err;
    }
  }

  // Create a new tweet
  static async createTweet(tweetData) {
    try {
      // Get the next tweet_id (since it's an INT not an auto-increment)
      const maxIdResult = await db.executeQuery('SELECT MAX(tweet_id) as maxId FROM tweets');
      const nextId = (maxIdResult.recordset[0].maxId || 0) + 1;
      
      await db.executeQuery(`
        INSERT INTO tweets (tweet_id, content, created_at, sentiment, likes, user_id)
        VALUES (@tweetId, @content, @createdAt, @sentiment, @likes, @userId)
      `, [
        { name: 'tweetId', type: sql.Int, value: nextId },
        { name: 'content', type: sql.VarChar, value: tweetData.content },
        { name: 'createdAt', type: sql.DateTime, value: new Date() },
        { name: 'sentiment', type: sql.Int, value: tweetData.sentiment || 0 },
        { name: 'likes', type: sql.Int, value: 0 },
        { name: 'userId', type: sql.UniqueIdentifier, value: tweetData.userId }
      ]);
      return { ...tweetData, tweet_id: nextId };
    } catch (err) {
      console.error('Error creating tweet:', err);
      throw err;
    }
  }

  // Like a tweet
  static async likeTweet(userId, tweetId) {
    try {
      const maxIdResult = await db.executeQuery('SELECT MAX(user_tweet_id) as maxId FROM UserTweet');
      const nextId = (maxIdResult.recordset[0].maxId || 0) + 1;
      
      // Insert into UserTweet table
      await db.executeQuery(`
        INSERT INTO UserTweet (user_tweet_id, user_id, tweet_id, liked_at)
        VALUES (@userTweetId, @userId, @tweetId, @likedAt)
      `, [
        { name: 'userTweetId', type: sql.Int, value: nextId },
        { name: 'userId', type: sql.UniqueIdentifier, value: userId },
        { name: 'tweetId', type: sql.Int, value: tweetId },
        { name: 'likedAt', type: sql.DateTime, value: new Date() }
      ]);
      
      // Update the likes count in the tweets table
      await db.executeQuery(`
        UPDATE tweets SET likes = likes + 1 WHERE tweet_id = @tweetId
      `, [
        { name: 'tweetId', type: sql.Int, value: tweetId }
      ]);
      
      return { success: true };
    } catch (err) {
      console.error('Error liking tweet:', err);
      throw err;
    }
  }

  // Get trending topics based on tweet content
  static async getTrendingTopics() {
    try {
      // This is a simple example - in a real app, you'd use more sophisticated analysis
      const result = await db.executeQuery(`
        SELECT TOP 6
          SUBSTRING(content, CHARINDEX('#', content), 
            CASE 
              WHEN CHARINDEX(' ', content, CHARINDEX('#', content)) = 0 THEN LEN(content) 
              ELSE CHARINDEX(' ', content, CHARINDEX('#', content)) - CHARINDEX('#', content)
            END) as hashtag,
          COUNT(*) as count
        FROM tweets
        WHERE content LIKE '%#%'
        GROUP BY SUBSTRING(content, CHARINDEX('#', content), 
            CASE 
              WHEN CHARINDEX(' ', content, CHARINDEX('#', content)) = 0 THEN LEN(content) 
              ELSE CHARINDEX(' ', content, CHARINDEX('#', content)) - CHARINDEX('#', content)
            END)
        ORDER BY COUNT(*) DESC
      `);
      
      return result.recordset.map(item => ({
        category: 'Trending',
        name: item.hashtag,
        count: item.count + 'K'
      }));
    } catch (err) {
      console.error('Error getting trending topics:', err);
      throw err;
    }
  }
}

module.exports = TweetModel;