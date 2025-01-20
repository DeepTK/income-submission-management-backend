const { default: mongoose } = require("mongoose");
const { Branch, User, Income } = require("../../models/index");

exports.getDashboardData = async (req, res) => {
  try {
    const user = req.user;
    const dashboardData = {};

    if (user.role === "user") {
      const incomeRecords = await Income.find({ userId: user._id });
      dashboardData.userInfo = {
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
      };
      dashboardData.incomeSummary = incomeRecords;
    } else if (user.role === "admin") {
      const totalUsersInBranch = await User.countDocuments({
        branch: user.branch,
        role: "user",
      });

      const usersOfBranch = await User.find({
        branch: user.branch,
        role: "user",
      });

      const incomeRecords = await Promise.all(
        usersOfBranch.map((user) =>
          Income.find({ branch: user.branch, userId: user._id })
        )
      );
      const incomeSummary = incomeRecords.every((record) => record.length === 0)
        ? null
        : incomeRecords;
      dashboardData.incomeSummary = incomeSummary;
      dashboardData.users = usersOfBranch;
      dashboardData.totalUsers = totalUsersInBranch;
      const branch = await Branch.find({ _id: user.branch });
      dashboardData.branchInfo = branch[0] ? branch[0] : null;
    } else if (user.role === "superadmin") {
      const totalUsers = await User.countDocuments({ role: "user" });
      const totalAdmins = await User.countDocuments({ role: "admin" });
      const totalSuperadmins = await User.countDocuments({
        role: "superadmin",
      });
      const totalBranches = await Branch.countDocuments();
      dashboardData.userInfo = {
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
      };
      dashboardData.totalUsers = totalUsers;
      dashboardData.totalSuperadmins = totalSuperadmins;
      dashboardData.totalAdmins = totalAdmins;
      dashboardData.totalBranches = totalBranches;
    }

    res.status(200).json({
      success: true,
      data: dashboardData,
      msg: "Dashboard data fetched successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.missingIncome = async (req, res) => {
  try {
    const currentDate = new Date();
    const year = parseInt(req.body?.year) || currentDate.getFullYear();
    const month = parseInt(req.body?.month) || currentDate.getMonth() + 1;
    const branchId = req.body?.branchId;

    if (month < 1 || month > 12) {
      return res.status(400).json({
        error: "Invalid month",
        message: "Month must be between 1 and 12",
      });
    }

    if (year < 2000 || year > currentDate.getFullYear() + 1) {
      return res.status(400).json({
        error: "Invalid year",
        message: `Year must be between 2000 and ${
          currentDate.getFullYear() + 1
        }`,
      });
    }

    if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({
        error: "Invalid branchId",
        message: "Please provide a valid branch ID",
      });
    }

    const baseMatch = {
      role: "user",
      isActive: true,
    };

    if (branchId) {
      baseMatch.branch = new mongoose.Types.ObjectId(branchId);
    }

    const usersData = await User.aggregate([
      {
        $match: baseMatch,
      },
      {
        $lookup: {
          from: "incomes",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$year", year] },
                    { $eq: ["$month", month] },
                  ],
                },
              },
            },
          ],
          as: "currentMonthIncome",
        },
      },
      {
        $lookup: {
          from: "incomes",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    {
                      $or: [
                        { $lt: ["$year", year] },
                        {
                          $and: [
                            { $eq: ["$year", year] },
                            { $lt: ["$month", month] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "previousIncome",
        },
      },
      {
        $match: {
          currentMonthIncome: { $size: 0 },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          branch: 1,
          lastLogin: 1,
          hasSubmittedBefore: {
            $cond: [{ $gt: [{ $size: "$previousIncome" }, 0] }, true, false],
          },
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);
    await User.populate(usersData, {
      path: "branch",
      select: "name code",
    });
    const neverSubmitted = [];
    const missingCurrentMonth = [];

    usersData.forEach((user) => {
      const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        lastLogin: user.lastLogin,
      };

      if (!user.hasSubmittedBefore) {
        neverSubmitted.push(userData);
      } else {
        missingCurrentMonth.push(userData);
      }
    });

    const response = {
      timestamp: new Date(),
      filter: {
        year,
        month,
        branch: branchId
          ? {
              _id: branchId,
              ...usersData[0]?.branch,
            }
          : null,
      },
      summary: {
        totalUsers: usersData.length,
        neverSubmittedCount: neverSubmitted.length,
        missingSelectedMonthCount: missingCurrentMonth.length,
      },
      neverSubmitted: {
        count: neverSubmitted.length,
        users: neverSubmitted,
      },
      missingSelectedMonth: {
        count: missingCurrentMonth.length,
        users: missingCurrentMonth,
      },
    };
    res.status(200).json({
      success: true,
      data: response,
      msg: "Dashboard data fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching users with missing income:", error);
    res.status(500).json({
      success: false,
      eror: error,
    });
  }
};

exports.checkIncome = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const incomeData = await Income.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      year: currentYear,
      month: currentMonth,
    });

    return res.status(200).json({ success: true, incomeExists: !!incomeData });
  } catch (error) {
    console.error("Error fetching users with missing income:", error);
    res.status(500).json({
      success: false,
      eror: error,
    });
  }
};
