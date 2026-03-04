const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const Project = require('./models/Project');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('MongoDB connected');
  
  try {
    // Read JSON file
    const data = fs.readFileSync('./data/projects.json', 'utf8');
    const projects = JSON.parse(data);
    
    // Insert all projects
    await Project.insertMany(projects);
    console.log(`✅ ${projects.length} projets migr\u00e9s avec succ\u00e9s !`);
    
    process.exit(0);
  } catch (err) {
    console.error('Erreur migration:', err);
    process.exit(1);
  }
}).catch(err => {
  console.log('MongoDB connection error:', err);
  process.exit(1);
});
