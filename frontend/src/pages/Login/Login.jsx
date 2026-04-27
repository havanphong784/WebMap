import {signInWithPopup} from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {auth, googleProvider} from "../../config/firebase";
import {syncUserWithBackend} from "../../api/auth.api.js";
import {useContext} from "react";
import {AuthContext} from "../../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();

  const user = useContext(AuthContext);

  if (user) {
    navigate("/");
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Đăng nhập thành công!", result.user.displayName);
      const backendData = await syncUserWithBackend(result.user);
      navigate("/");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error.message);
      alert("Đăng nhập thất bại: " + error.message);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-10 rounded-2xl shadow-xl flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2">🗺️ GeoPhoto</h1>
        <p className="text-gray-400 mb-8">Khám phá thế giới qua những bức ảnh</p>

        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-6 h-6"
          />
          Tiếp tục với Google
        </button>
      </div>
    </div>
  );
}
