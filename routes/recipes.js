// Recipe routes
const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/recipes
// @desc    Get all recipes with search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { dishName: { $regex: search, $options: 'i' } },
          { countryOfOrigin: { $regex: search, $options: 'i' } },
          { creatorName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const recipes = await Recipe.find(query).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipes/:id
// @desc    Get single recipe
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipes
// @desc    Create recipe
router.post('/', auth, async (req, res) => {
  try {
    const recipe = new Recipe({
      ...req.body,
      creator: req.userId,
      creatorName: req.username
    });

    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/recipes/:id
// @desc    Update recipe
router.put('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check ownership
    if (recipe.creator.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/recipes/:id
// @desc    Delete recipe
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check ownership
    if (recipe.creator.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await recipe.deleteOne();

    // Remove from users' saved recipes
    await User.updateMany(
      { savedRecipes: req.params.id },
      { $pull: { savedRecipes: req.params.id } }
    );

    res.json({ message: 'Recipe deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipes/:id/save
// @desc    Save/unsave recipe
router.post('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const recipeId = req.params.id;

    const isSaved = user.savedRecipes.includes(recipeId);
    
    if (isSaved) {
      user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== recipeId);
    } else {
      user.savedRecipes.push(recipeId);
    }

    await user.save();
    res.json({ savedRecipes: user.savedRecipes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipes/user/saved
// @desc    Get user's saved recipes
router.get('/user/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('savedRecipes');
    res.json(user.savedRecipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipes/user/published
// @desc    Get user's published recipes
router.get('/user/published', auth, async (req, res) => {
  try {
    const recipes = await Recipe.find({ creator: req.userId }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;