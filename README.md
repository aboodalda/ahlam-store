# أحلام ستور — دليل التشغيل السريع

## 1. إنشاء مشروع Firebase
1. روح على https://console.firebase.google.com وسوّي مشروع جديد.
2. من Build > Firestore Database فعّل قاعدة بيانات (وضع Production).
3. من Build > Authentication فعّل طريقة الدخول "Email/Password"، وسوّي مستخدم واحد (بريدك وكلمة مرور) هذا هو حساب المدير للوحة التحكم.
4. من Project settings > عام > Your apps سوّي تطبيق ويب (</>) وانسخ بيانات `firebaseConfig`.

## 2. تعبئة الإعدادات
افتح `js/firebase-config.js` وحط:
- بيانات `firebaseConfig` اللي نسختها من فايربيس.
- `WHATSAPP_NUMBER` = رقم واتساب المتجر بصيغة دولية بدون + وبدون صفر (مثال: رقم 0501234567 يصير 966501234567).

## 3. قواعد الأمان (Firestore Rules)
روح على Firestore Database > Rules وحط:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

هذا يخلي المنتجات تنعرض لأي زائر، بس التعديل والحذف فقط لحساب المدير المسجل دخول. والطلبات أي زائر يقدر يرسلها، بس قراءتها وتحديثها فقط للمدير.

## 4. رفع المتجر على GitHub Pages
1. ارفع كل الملفات لمجلد المستودع `aboodalda.github.io/ahlam-store/` (أو اسم مستودع منفصل حسب رغبتك).
2. الرابط النهائي للمتجر: `https://aboodalda.github.io/ahlam-store/`
3. رابط لوحة التحكم: `https://aboodalda.github.io/ahlam-store/admin/`
4. سجّل دخول بحساب المدير اللي سويته في خطوة 1.

## 5. إضافة المنتجات
من لوحة التحكم > "إضافة منتج":
- اختر صورة من الجوال — يتم ضغطها تلقائياً (حد أقصى 800px وجودة متكيفة) قبل ما تنحفظ كـ base64 داخل Firestore، فما يحتاج خطة Blaze المدفوعة.
- عبّي الاسم، الشركة، التصنيف، السعر، والمواصفات (زر "+ إضافة مواصفة" لكل سطر مثل الذاكرة، الشاشة، البطارية...).

## ملاحظات مهمة
- تأكد إن اسم الفولدر `admin` مب مفهرس في محركات البحث (اختياري: أضف `admin/` في ملف robots.txt).
- إذا صار كاش قديم بعد الرفع على GitHub Pages (نفس مشكلة صارت بمتجر ودام سابقاً)، أضف `?v=2` على روابط CSS/JS في index.html بعد كل تحديث كبير.
- حد Firestore للمستند الواحد 1MB، والصور مضغوطة تحت هذا الحد بأمان.
