import Bookmark from "../models/bookmark.model.js";

export const addBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contestId, index, name, rating, tags, url, sourceMessageId, channel, server } = req.body;

    if (contestId === undefined || contestId === null || !index) {
      return res.status(400).json({ message: "contestId and index are required" });
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { user: userId, contestId, index },
      {
        $setOnInsert: {
          name: name || "",
          rating: rating || 0,
          tags: tags || [],
          url: url || "",
          sourceMessageId: sourceMessageId || null,
          channel: channel || null,
          server: server || null,
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({ data: bookmark });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contestId, index } = req.params;

    await Bookmark.findOneAndDelete({ user: userId, contestId, index });

    return res.status(200).json({ message: "Removed from your list" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ data: bookmarks });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
