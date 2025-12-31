// routes/adminReviewRoutes.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const auth = require('../middleware/auth'); // Your auth middleware

// Admin middleware (protect all routes)
router.use(auth.authenticate);
router.use(auth.isAdmin);

// Get all reviews (including pending)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(query);
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

// Approve review
router.patch('/:id/approve', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    review.status = 'approved';
    review.approvedAt = new Date();
    review.approvedBy = req.user.id;
    
    await review.save();
    
    res.json({
      success: true,
      message: 'Review approved successfully',
      data: review
    });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving review'
    });
  }
});

// Reject review
router.patch('/:id/reject', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    review.status = 'rejected';
    review.rejectedAt = new Date();
    review.rejectedBy = req.user.id;
    review.rejectionReason = req.body.reason;
    
    await review.save();
    
    res.json({
      success: true,
      message: 'Review rejected successfully',
      data: review
    });
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting review'
    });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
});

// Bulk actions
router.post('/bulk-action', async (req, res) => {
  try {
    const { action, ids } = req.body;
    
    if (!['approve', 'reject', 'delete'].includes(action) || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }
    
    let update;
    switch (action) {
      case 'approve':
        update = { status: 'approved', approvedAt: new Date(), approvedBy: req.user.id };
        break;
      case 'reject':
        update = { status: 'rejected', rejectedAt: new Date(), rejectedBy: req.user.id };
        break;
      case 'delete':
        await Review.deleteMany({ _id: { $in: ids } });
        return res.json({
          success: true,
          message: `${ids.length} reviews deleted successfully`
        });
    }
    
    await Review.updateMany(
      { _id: { $in: ids } },
      update
    );
    
    res.json({
      success: true,
      message: `${ids.length} reviews ${action}d successfully`
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk action'
    });
  }
});

module.exports = router;