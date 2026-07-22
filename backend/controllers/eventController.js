const Event = require("../models/Event");
const { emitToMandal } = require("../utils/socket");

exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, mandal: req.user.mandal, createdBy: req.user._id });
    emitToMandal(req.user.mandal.toString(), "new_event", event);
    res.status(201).json({ success: true, message: "Event created", event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ mandal: req.user.mandal }).sort({ date: 1 });
    res.json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    emitToMandal(event.mandal.toString(), "event_updated", event);
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    emitToMandal(event.mandal.toString(), "event_deleted", { id: event._id });
    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Toggle RSVP for logged-in member
exports.toggleRSVP = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const idx = event.rsvps.findIndex((u) => u.toString() === req.user._id.toString());
    if (idx > -1) {
      event.rsvps.splice(idx, 1);
    } else {
      event.rsvps.push(req.user._id);
    }
    await event.save();

    emitToMandal(event.mandal.toString(), "event_rsvp_updated", {
      eventId: event._id,
      rsvpCount: event.rsvps.length,
    });

    res.json({ success: true, rsvpCount: event.rsvps.length, joined: idx === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
