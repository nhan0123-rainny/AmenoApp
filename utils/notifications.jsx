import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function scheduleTaskNotification(task) {
  if (!task?.reminder || !task?.title) return null;

  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') {
      console.warn("Notification permission not granted");
      return null;
    }
    const [hour, minute] = task.reminder.split(':').map(Number);
    const now = new Date();
    const target = new Date();

    target.setHours(hour, minute, 0, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    const seconds = Math.floor((target.getTime() - now.getTime()) / 1000);
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ameno App 🔔',
        body: `Bạn có công việc cần làm: ${task.title}`,
        sound: Platform.OS === 'android' ? 'default' : true,
      },
      trigger: {
        seconds,
        repeats: false,
      },
    });

    return notificationId;
  } catch (error) {
    console.error("❌ Lỗi đặt thông báo:", error);
    return null;
  }
}
export async function cancelNotification(notificationId) {
  if (!notificationId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn("⚠️ Không thể huỷ notification:", error);
  }
}
