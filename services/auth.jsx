import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Alert } from 'react-native';
import { app, db } from "./firebaseConfig";

const auth = getAuth(app);

export const AuthService = {
  login: async (email, password, router) => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Đăng nhập thành công UID:", userCredential.user.uid);
      router.replace('/home'); 
    } catch (error) {
      let message = "Email hoặc mật khẩu không chính xác";
      if (error.code === 'auth/user-not-found') message = "Tài khoản không tồn tại";
      if (error.code === 'auth/wrong-password') message = "Mật khẩu không đúng";
      Alert.alert("Thất bại", message);
    }
  },

  register: async (data, router) => {
    const { email, name, password, confirmPassword } = data;
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
        Alert.alert("Lỗi", "Vui lòng không để trống bất kỳ trường nào");
        return;
    }
    if (password.length < 6) {
        Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
        return;
    }
    if (password !== confirmPassword) {
        Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        avatarUrl: "", 
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Thành công", "Tài khoản của bạn đã được tạo", [
        { text: "Đăng nhập ngay", onPress: () => router.back() }
      ]);
    } catch (error) {
      let message = "Không thể đăng ký tài khoản";
      if (error.code === 'auth/email-already-in-use') message = "Email này đã được sử dụng";
      Alert.alert("Lỗi", message);
    }
  },

  logout: async (router) => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  },

  getCurrentUser: () => {
    return auth.currentUser;
  }
};