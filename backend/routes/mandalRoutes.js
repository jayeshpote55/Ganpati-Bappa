const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createMandal,
  getMandals,
  getMandal,
  updateMandal,
  getMandalDetails,
  addAarti,
  deleteAarti,
} = require("../controllers/mandalController");

router.post("/", protect, authorize("admin", "committee"), createMandal);
router.get("/", getMandals);
router.get("/:id", getMandal);
router.get("/:id/details", getMandalDetails);
router.post("/:id/aartis", protect, authorize("admin", "committee"), addAarti);
router.delete("/:id/aartis/:aartiId", protect, authorize("admin", "committee"), deleteAarti);
router.put("/:id", protect, authorize("admin", "committee"), updateMandal);

module.exports = router;
