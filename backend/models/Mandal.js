const mongoose = require("mongoose");

const mandalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    establishedYear: { type: Number },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },
    logo: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    aartiTimings: {
      morning: { type: String, default: "07:00 AM" },
      afternoon: { type: String, default: "12:30 PM" },
      evening: { type: String, default: "07:30 PM" },
      night: { type: String, default: "10:00 PM" },
    },
    aartiCollection: [
      {
        title: String,
        lyrics: String,
        audioUrl: String,
        pdfUrl: String,
      },
    ],
    locationInfo: {
      address: { type: String, default: "" },
      parking: { type: String, default: "" },
      nearbyHospitals: { type: String, default: "" },
      googleMapEmbed: { type: String, default: "" },
    },
    liveStreamUrl: { type: String, default: "" },
    history: {
      foundedYear: { type: Number },
      founderMembers: [{ type: String }],
      awards: [{ type: String }],
      story: { type: String, default: "" },
    },
    sponsors: [
      {
        name: String,
        banner: String,
        phone: String,
        address: String,
        website: String,
        note: String,
      },
    ],
    emergencyContacts: [
      {
        label: String,
        phone: String,
      },
    ],
    visiterNotes: { type: String, default: "" },
    visarjanDate: { type: Date },
    sthapanaDate: { type: Date },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    upiId: { type: String, default: "" },
    donationGoal: { type: Number, default: 0 },
    committeeMembers: [
      {
        name: String,
        designation: String,
        phone: String,
        photo: String,
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mandal", mandalSchema);
