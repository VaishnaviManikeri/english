// routes/adminReviewRoutes.js
import express from "express";
import Review from "../models/Review.js";
import authenticate from "../middleware/authenticate.js"; // Your auth middleware

const router = express.Router();

// Admin middleware (protect all routes)
router.use(authenticate);

// Get all reviews (including pending)
router.get("/", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find(query)
      .sort("-createdAt")
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
    console.error("Error fetching admin reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews"
    });
  }
});

// Approve review
router.patch("/:id/approve", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }
    
    review.status = "approved";
    review.approvedAt = new Date();
    review.approvedBy = req.user.id;
    
    await review.save();
    
    res.json({
      success: true,
      message: "Review approved successfully",
      data: review
    });
  } catch (error) {
    console.error("Error approving review:", error);
    res.status(500).json({
      success: false,
      message: "Error approving review"
    });
  }
});

// Reject review
router.patch("/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }
    
    review.status = "rejected";
    review.rejectedAt = new Date();
    review.rejectedBy = req.user.id;
    review.rejectionReason = reason;
    
    await review.save();
    
    res.json({
      success: true,
      message: "Review rejected successfully",
      data: review
    });
  } catch (error) {
    console.error("Error rejecting review:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting review"
    });
  }
});

// Delete review
router.delete("/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }
    
    res.json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting review"
    });
  }
});

// Get review statistics for admin
router.get("/stats/summary", async (req, res) => {
  try {
    const summary = await Review.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      }
    ]);
    
    // Format the summary
    const formattedSummary = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };
    
    summary.forEach(item => {
      formattedSummary[item._id] = item.count;
      formattedSummary.total += item.count;
    });
    
    // Get recent activity
    const recentReviews = await Review.find()
      .sort("-createdAt")
      .limit(5)
      .select("name role rating status title createdAt");
    
    res.json({
      success: true,
      data: {
        summary: formattedSummary,
        recentReviews
      }
    });
  } catch (error) {
    console.error("Error fetching review summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching review summary"
    });
  }
});

export default router;