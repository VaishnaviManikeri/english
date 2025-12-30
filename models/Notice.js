// backend/models/Notice.js
import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'] 
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'] 
  },
  category: { 
    type: String, 
    default: "General",
    enum: ["Admission", "Event", "Meeting", "Academic", "General", "Exam", "Holiday"]
  },
  fileUrl: { 
    type: String 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Create index for better query performance
noticeSchema.index({ date: -1 });
noticeSchema.index({ category: 1 });

export default mongoose.model("Notice", noticeSchema);