import Announcement from "../models/announcementModel.js";

export const getAnnouncements = async (req, res) => {
  res.json(await Announcement.find().sort({ createdAt: -1 }));
};

export const createAnnouncement = async (req, res) => {
  const newAnnouncement = new Announcement(req.body);
  await newAnnouncement.save();
  res.json(newAnnouncement);
};

export const updateAnnouncement = async (req, res) => {
  const updated = await Announcement.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};

export const deleteAnnouncement = async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: "Announcement deleted" });
};
