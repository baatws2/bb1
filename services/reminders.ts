import { Platform } from 'react-native';

type ProductLite = {
  id: string;
  name: string;
  expiry_date: string; // ISO date string (yyyy-mm-dd)
};

const DEFAULT_DAYS_BEFORE = [7, 1, 0]; // 7 أيام، يوم واحد، ويوم الانتهاء

function toLocalDate(date: Date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

export async function scheduleExpiryReminders(product: ProductLite, daysBefore: number[] = DEFAULT_DAYS_BEFORE) {
  if (Platform.OS === 'web') return;

  let Notifications: any;
  try {
    Notifications = await import('expo-notifications');
  } catch (e) {
    console.warn('expo-notifications غير مثبتة، لن يتم جدولة تنبيهات محلية');
    return;
  }

  // طلب صلاحيات
  const { status } = await Notifications.requestPermissionsAsync?.();
  if (status !== 'granted') {
    console.warn('لم يتم منح صلاحيات الإشعارات');
    return;
  }

  const now = new Date();
  const [y, m, d] = product.expiry_date.split('-').map((n) => parseInt(n, 10));
  const expiry = new Date(y, (m - 1), d, 9, 0, 0); // 9 صباحًا افتراضيًا

  for (const days of daysBefore) {
    const triggerDate = new Date(expiry);
    triggerDate.setDate(expiry.getDate() - days);
    if (triggerDate.getTime() <= now.getTime()) continue; // تجاهل ماضٍ

    await Notifications.scheduleNotificationAsync?.({
      content: {
        title: days === 0 ? 'انتهت صلاحية منتج' : 'تنبيه صلاحية منتج',
        body: days === 0
          ? `${product.name}: انتهت الصلاحية اليوم`
          : `${product.name}: متبقي ${days} يوم` ,
        data: { productId: product.id },
      },
      trigger: toLocalDate(triggerDate),
    });
  }
}

export async function cancelAllRemindersForProduct(_productId: string) {
  if (Platform.OS === 'web') return;
  let Notifications: any;
  try {
    Notifications = await import('expo-notifications');
  } catch {
    return;
  }
  // في هذا الإصدار البسيط لا نخزن معرفات التنبيهات؛ يمكن تحسين ذلك لاحقًا بحفظ IDs في AsyncStorage
  // كحل وسط، يمكن مسح جميع التنبيهات المجدولة (قد يكون شاملاً أكثر من اللازم)
  await Notifications.cancelAllScheduledNotificationsAsync?.();
}
