const { Branch, User } = require("../../models/index");

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res
      .status(200)
      .json({ success: true, data: branches, msg: "All Branches Fetched" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllBranch = async (req, res) => {
  try {
    const branches = await Branch.find();

    const branchManagers = await User.find({ role: "admin" }).populate(
      "branch",
      "name code isActive"
    );

    const result = branches.map((branch) => {
      const manager = branchManagers.find(
        (manager) =>
          manager.branch &&
          manager.branch._id.toString() === branch._id.toString()
      );

      return {
        _id: branch._id,
        name: branch.name,
        code: branch.code,
        isActive: branch.isActive,
        manager: manager
          ? {
              _id: manager._id,
              name: manager.name,
              email: manager.email,
              lastLogin: manager.lastLogin,
            }
          : null,
      };
    });

    res
      .status(200)
      .json({ success: true, data: result, msg: "All Branches Fetched" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllBranchesWithManagers = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true });

    const branchManagers = await User.find({ role: "admin" }).populate(
      "branch",
      "name code isActive"
    );

    const result = branches.map((branch) => {
      const manager = branchManagers.find(
        (manager) =>
          manager.branch &&
          manager.branch._id.toString() === branch._id.toString()
      );

      return {
        _id: branch._id,
        name: branch.name,
        code: branch.code,
        isActive: branch.isActive,
        manager: manager
          ? {
              _id: manager._id,
              name: manager.name,
              email: manager.email,
              lastLogin: manager.lastLogin,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: result,
      msg: "All Branches with Managers Fetched Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      msg: "Failed to Fetch Branches with Managers",
    });
  }
};

exports.getBranchByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate("branch");

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    user.branch.user = {
      _id: user.id,
      name: user.name,
      email: user.email,
    };
    res.status(200).json({
      success: true,
      data: user.branch,
      msg: "Branch fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBranchAndManagerByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate("branch");

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    if (!user.branch) {
      return res
        .status(404)
        .json({ success: false, msg: "Branch not associated with this user" });
    }

    const branchManager = await User.findOne({
      branch: user.branch._id,
      role: "admin",
    });

    if (!branchManager) {
      return res
        .status(404)
        .json({ success: false, msg: "Branch manager not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user.branch.id,
        name: user.branch.name,
        code: user.branch.code,
        createdAt: user.branch.createdAt,
        isActive: user.branch.isActive,
        updatedAt: user.branch.updatedAt,
        manager: {
          _id: branchManager._id,
          name: branchManager.name,
          email: branchManager.email,
        },
      },
      msg: "Branch and manager fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const { name, code, isActive = true } = req.body;
    const branchCode = await Branch.findOne({code});
    if (branchCode) {
      return res
        .status(404)
        .json({ success: false, error: "Branch code used" });
    }
    const branch = new Branch({ name, code, isActive });
    await branch.save();
    res
      .status(200)
      .json({ success: true, data: branch, msg: "Branch Created" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, code, isActive } = req.body;

    const branch = await Branch.findById(id);
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, error: "Branch not found" });
    }
    const branchCode = await Branch.findOne({ code, _id: { $ne: id } });
    if (branchCode) {
      return res
        .status(404)
        .json({ success: false, error: "Branch code used" });
    }
    console.log(
      isActive == undefined || isActive == null ? branch.isActive : isActive
    );
    branch.name = name || branch.name;
    branch.code = code || branch.code;
    branch.isActive =
      isActive == undefined || isActive == null ? branch.isActive : isActive;

    await branch.save();

    res.status(200).json({
      success: true,
      data: branch,
      msg: "Branch updated successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const id = req.params.id;

    const branch = await Branch.findById(id);
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, error: "Branch not found" });
    }
    branch.isActive = false;

    await branch.save();

    res.status(200).json({
      success: true,
      data: branch,
      msg: "Branch deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
