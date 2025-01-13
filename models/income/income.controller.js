const mongoose = require("mongoose");
const { Income, User, Branch } = require("../../config/db.modal");
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

exports.addIncome = async (req, res) => {
  try {
    const { userId, year, month, amount, comments } = req.body;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Please provide year.",
      });
    }

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Please provide month.",
      });
    }

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Please provide amount.",
      });
    }

    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount)) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid number.",
      });
    }

    if (numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0.",
      });
    }

    const roundedAmount = Math.round(numericAmount * 100) / 100;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const existingIncome = await Income.findOne({ userId, year, month });
    if (existingIncome) {
      return res.status(400).json({
        success: false,
        message: `Income for ${month}/${year} already exists.`,
      });
    }

    const income = await Income.create({
      userId,
      year,
      month,
      amount: roundedAmount,
      comments,
    });

    res
      .status(200)
      .json({ success: true, message: "Income added successfully", income });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate income entry for the same month and year.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error adding income",
      error: error.message,
    });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const { incomeId } = req.params;
    const { amount, comments, year, month } = req.body;

    const income = await Income.findByIdAndUpdate(
      incomeId,
      { amount, comments, year, month, submissionDate: new Date() },
      { new: true }
    );

    if (!income) {
      return res
        .status(404)
        .json({ success: false, message: "Income not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Income updated successfully", income });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating income",
      error: error.message,
    });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findById({_id : id});
    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Income not found",
      });
    }

    await Income.findByIdAndDelete({_id: id});

    res
      .status(200)
      .json({ success: true, message: "Income Deleted successfully", income });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating income",
      error: error.message,
    });
  }
};

exports.getAllIncome = async (req, res) => {
  try {
    const { year, month, branch } = req.query;
    const query = {};

    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "branches",
          localField: "user.branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: "$branch",
      },
    ];

    if (branch) {
      pipeline.push({
        $match: {
          "branch._id": new mongoose.Types.ObjectId(branch),
        },
      });
    }

    if (Object.keys(query).length > 0) {
      pipeline.unshift({ $match: query });
    }

    pipeline.push({
      $project: {
        year: 1,
        month: 1,
        amount: 1,
        comments: 1,
        submissionDate: 1,
        userName: "$user.name",
        userEmail: "$user.email",
        branchName: "$branch.name",
        branchCode: "$branch.code",
        createdAt: 1,
        updatedAt: 1,
      },
    });

    const incomeRecords = await Income.aggregate(pipeline);

    const totalAmount = incomeRecords.reduce(
      (sum, record) => sum + record.amount,
      0
    );

    res.status(200).json({
      success: true,
      count: incomeRecords.length,
      totalAmount,
      data: incomeRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching income records",
      error: error.message,
    });
  }
};

exports.getIncomeByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { year, month } = req.query;

    // Validate branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: {
          "user.branch": new mongoose.Types.ObjectId(branchId),
        },
      },
    ];

    if (year) {
      pipeline.push({
        $match: {
          year: parseInt(year),
        },
      });
    }

    if (month) {
      pipeline.push({
        $match: {
          month: parseInt(month),
        },
      });
    }

    pipeline.push({
      $group: {
        _id: {
          year: "$year",
          month: "$month",
        },
        totalAmount: { $sum: "$amount" },
        recordCount: { $sum: 1 },
        records: {
          $push: {
            amount: "$amount",
            userName: "$user.name",
            submissionDate: "$submissionDate",
            comments: "$comments",
          },
        },
      },
    });

    pipeline.push({
      $sort: {
        "_id.year": -1,
        "_id.month": -1,
      },
    });

    const branchIncome = await Income.aggregate(pipeline);

    const totalAmount = branchIncome.reduce(
      (sum, group) => sum + group.totalAmount,
      0
    );

    res.status(200).json({
      success: true,
      branchName: branch.name,
      branchCode: branch.code,
      totalAmount,
      monthlyRecords: branchIncome,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching branch income records",
      error: error.message,
    });
  }
};

exports.getIncomeByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;

    const user = await User.findById(userId).populate("branch");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const query = { userId: new mongoose.Types.ObjectId(userId) };

    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const pipeline = [
      {
        $match: query,
      },
      {
        $sort: {
          year: -1,
          month: -1,
        },
      },
    ];

    if (!month) {
      pipeline.push(
        {
          $group: {
            _id: {
              year: "$year",
              month: "$month",
            },
            totalAmount: { $sum: "$amount" },
            records: {
              $push: {
                _id: "$_id",
                amount: "$amount",
                submissionDate: "$submissionDate",
                comments: "$comments",
                createdAt: "$createdAt",
                updatedAt: "$updatedAt",
              },
            },
          },
        },
        {
          $sort: {
            "_id.year": -1,
            "_id.month": -1,
          },
        }
      );
    }

    const incomeRecords = await Income.aggregate(pipeline);

    const stats = {
      totalRecords: 0,
      totalAmount: 0,
      averageAmount: 0,
      highestAmount: 0,
      lowestAmount: Infinity,
    };

    if (month) {
      stats.totalRecords = incomeRecords.length;
      stats.totalAmount = incomeRecords.reduce(
        (sum, record) => sum + record.amount,
        0
      );
      stats.averageAmount = stats.totalAmount / stats.totalRecords;
      stats.highestAmount = Math.max(
        ...incomeRecords.map((record) => record.amount)
      );
      stats.lowestAmount = Math.min(
        ...incomeRecords.map((record) => record.amount)
      );
    } else {
      stats.totalRecords = incomeRecords.reduce(
        (sum, group) => sum + group.records.length,
        0
      );
      stats.totalAmount = incomeRecords.reduce(
        (sum, group) => sum + group.totalAmount,
        0
      );
      stats.averageAmount = stats.totalAmount / stats.totalRecords;
      incomeRecords.forEach((group) => {
        const maxInGroup = Math.max(...group.records.map((r) => r.amount));
        const minInGroup = Math.min(...group.records.map((r) => r.amount));
        stats.highestAmount = Math.max(stats.highestAmount, maxInGroup);
        stats.lowestAmount = Math.min(stats.lowestAmount, minInGroup);
      });
    }

    if (stats.lowestAmount === Infinity) {
      stats.lowestAmount = 0;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch
          ? {
              id: user.branch._id,
              name: user.branch.name,
              code: user.branch.code,
            }
          : null,
      },
      stats,
      data: incomeRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user income records",
      error: error.message,
    });
  }
};

exports.getMyIncome = async (req, res) => {
  try {
    const userId = req.user._id;

    req.params.userId = userId;
    return await exports.getIncomeByUser(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching your income records",
      error: error.message,
    });
  }
};
