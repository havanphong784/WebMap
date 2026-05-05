import { getUserProfile, upsertUser, listActiveUsers, updateLastSeen } from "../services/authService.js";

export const login = async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;
    const savedUser = await upsertUser({ uid, email, name, picture });
    res.status(200).json({ message: "Đăng nhập thành công", user: savedUser });
  } catch (error) {
    console.error("Lỗi khi lưu user:", error);
    res.status(500).json({ error: "Lỗi Server nội bộ" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await getUserProfile(uid);

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Lỗi khi lấy profile:", error);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

export const getActiveUsers = async (req, res) => {
  try {
    const users = await listActiveUsers(10);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách user active:", error);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

export const heartbeat = async (req, res) => {
  try {
    const { uid } = req.user;
    await updateLastSeen(uid);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Lỗi heartbeat:", error);
    res.status(500).json({ error: "Lỗi Server" });
  }
};
