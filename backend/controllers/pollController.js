const Poll = require("../models/Poll");
const { emitToMandal } = require("../utils/socket");

exports.getPolls = async (req, res) => {
  try {
    const polls = await Poll.find({ mandal: req.user.mandal }).sort({ createdAt: -1 }).populate("createdBy", "name avatar");
    res.json({ success: true, count: polls.length, polls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPoll = async (req, res) => {
  try {
    const { question, options, endDate, multipleChoice } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: "Provide a question and at least two options." });
    }

    const poll = await Poll.create({
      mandal: req.user.mandal,
      question,
      options: options.map((label) => ({ label: label.trim(), votes: 0 })),
      endDate,
      multipleChoice: Boolean(multipleChoice),
      createdBy: req.user._id,
    });

    emitToMandal(req.user.mandal.toString(), "new_poll", poll);
    res.status(201).json({ success: true, message: "Poll created", poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });
    if (poll.status === "closed") return res.status(400).json({ success: false, message: "Poll is closed." });
    if (typeof optionIndex !== "number" || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ success: false, message: "Select a valid option." });
    }

    const existingVoteIndex = poll.voters.findIndex((vote) => vote.user.toString() === req.user._id.toString());
    if (existingVoteIndex > -1 && !poll.multipleChoice) {
      return res.status(400).json({ success: false, message: "You have already voted." });
    }

    if (existingVoteIndex > -1) {
      const previousChoice = poll.voters[existingVoteIndex].optionIndex;
      if (previousChoice === optionIndex) {
        return res.status(400).json({ success: false, message: "You already selected this option." });
      }
      poll.options[previousChoice].votes = Math.max(0, poll.options[previousChoice].votes - 1);
      poll.voters[existingVoteIndex].optionIndex = optionIndex;
    } else {
      poll.voters.push({ user: req.user._id, optionIndex });
    }

    poll.options[optionIndex].votes += 1;
    await poll.save();

    emitToMandal(req.user.mandal.toString(), "poll_updated", poll);
    res.json({ success: true, poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.closePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { status: "closed" }, { new: true });
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });
    emitToMandal(req.user.mandal.toString(), "poll_closed", poll);
    res.json({ success: true, message: "Poll closed", poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

    await Poll.findByIdAndDelete(req.params.id);
    emitToMandal(req.user.mandal.toString(), "poll_deleted", { id: req.params.id });
    res.json({ success: true, message: "Poll deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
