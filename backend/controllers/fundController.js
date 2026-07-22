const Fund = require("../models/Fund");
const { emitToMandal } = require("../utils/socket");

exports.createFundEntry = async (req, res) => {
  try {
    const { title, description, amount, paidTo, paymentMode, expenseDate, type } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "A fund title is required." });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid amount." });
    }

    const entryType = type === "income" ? "income" : "expense";

    const fund = await Fund.create({
      mandal: req.user.mandal,
      title: title.trim(),
      description: description?.trim() || "",
      amount: Number(amount),
      type: entryType,
      paidTo: paidTo?.trim() || "",
      paymentMode: paymentMode || "cash",
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      recordedBy: req.user._id,
    });

    const totalAgg = await Fund.aggregate([
      { $match: { mandal: req.user.mandal } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const totalIncome = totalAgg[0]?.totalIncome || 0;
    const totalExpense = totalAgg[0]?.totalExpense || 0;
    const balance = Math.max(totalIncome - totalExpense, 0);

    emitToMandal(req.user.mandal.toString(), "fund_updated", {
      fund,
      totalIncome,
      totalExpense,
      balance,
    });

    res.status(201).json({
      success: true,
      message: entryType === "income" ? "Fund entry created successfully." : "Expense recorded successfully.",
      fund,
      totalIncome,
      totalExpense,
      balance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFunds = async (req, res) => {
  try {
    const funds = await Fund.find({ mandal: req.user.mandal }).sort({ expenseDate: -1, createdAt: -1 });
    const totalAgg = await Fund.aggregate([
      { $match: { mandal: req.user.mandal } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const totalIncome = totalAgg[0]?.totalIncome || 0;
    const totalExpense = totalAgg[0]?.totalExpense || 0;
    const balance = Math.max(totalIncome - totalExpense, 0);

    res.json({
      success: true,
      count: funds.length,
      totalIncome,
      totalExpense,
      balance,
      funds,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteFundEntry = async (req, res) => {
  try {
    const fund = await Fund.findById(req.params.id);
    if (!fund) {
      return res.status(404).json({ success: false, message: "Fund entry not found." });
    }
    if (fund.mandal.toString() !== req.user.mandal.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to remove this fund entry." });
    }

    await fund.deleteOne();

    const totalAgg = await Fund.aggregate([
      { $match: { mandal: req.user.mandal } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const totalIncome = totalAgg[0]?.totalIncome || 0;
    const totalExpense = totalAgg[0]?.totalExpense || 0;
    const balance = Math.max(totalIncome - totalExpense, 0);

    emitToMandal(req.user.mandal.toString(), "fund_updated", {
      fundId: req.params.id,
      totalIncome,
      totalExpense,
      balance,
    });

    res.json({ success: true, message: "Entry removed.", totalIncome, totalExpense, balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
