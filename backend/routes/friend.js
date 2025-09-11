const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../models/index');
const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const { myId, code } = req.body;

    const me = await User.findById(myId);
    const friend = await User.findOne({ friendCode: code });

    if (!me || !friend) return res.status(404).json({ message: "User not found" });
    if (friend._id.equals(myId)) return res.status(400).json({ message: "Cannot add yourself" });

    if (me.friends.includes(friend._id))
      return res.status(400).json({ message: "Already friends" });

    if (!friend.friendRequests.includes(myId)) {
      friend.friendRequests.push(myId);
      await friend.save();
    }

    res.json({ message: "Friend request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "SERVER ERROR" });
  }
});

router.get('/pendingRequest/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const me = await User.findById(userId)
      .select("friendRequests")
      .populate("friendRequests", "username email friendCode");

    if (!me) return res.status(404).json({ message: "User not found" });

    const arr = (me.friendRequests || []).map((friend) => ({
      id: friend._id,
      username: friend.username,
      email: friend.email,
      friendCode: friend.friendCode
    }));

    res.status(200).json(arr);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "SERVER ERROR" });
  }
});

router.post('/accept', async (req, res) => {
  try {
    const { meid, requesterid } = req.body;

    const me = await User.findById(meid);
    const requester = await User.findById(requesterid);
   

    if (!me || !requester)
      return res.status(404).json({ message: "User not found" });

    if (!me.friends.includes(requesterid)) {
      me.friends.push(requesterid);
    }
    if (!requester.friends.includes(meid)) {
      requester.friends.push(meid);
    }

    me.friendRequests.pull(requesterid);
    await me.save();
    await requester.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "SERVER ERROR" });
  }
});

router.post('/reject', async (req, res) => {
  try {
    const { meid, requesterid } = req.body;

    const me = await User.findById(meid);
    if (!me) return res.status(404).json({ message: "User not found" });

    me.friendRequests.pull(requesterid);
    await me.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "SERVER ERROR" });
  }
});

module.exports = router;
