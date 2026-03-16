// Recipe model
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  dishName: {
    type: String,
    required: true,
    trim: true
  },
  countryOfOrigin: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true
  },
  ingredients: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorName: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);