# Insurance Claims Client – לקוח React

לקוח React + Vite בעיצוב נקי, RTL, עם מצב כהה אוטומטי. המסכים לפי תפקיד:

- **התחברות והרשמה ללקוח.** ה-JWT נשמר ב-`sessionStorage` ונשלח בכל בקשה.
- **לקוח:** התביעות שלי (סינון, הגשת טיוטה, עריכה, מחיקה, ביטול), תביעה חדשה (או טיוטה), הפרטים שלי.
- **שמאי:** תביעות פתוחות עם "קח לטיפול", התביעות שלי (אישור, דחייה, פרטי קשר), ההפניות שלי (הערות), לקוחות שלי.
- **מנהל:** כל התביעות, לקוחות (וביטוחיהם), סוגי ביטוח, עובדים (יצירה ומחיקה).
- **409:** כשעובד אחר לקח את התביעה קודם נפתח חלון בולט עם ההודעה והרשימה מתרעננת.

## הרצה

דרוש Node.js 20.19 ומעלה (או 22.12 ומעלה), והשרת (מאגר `InsuranceComServer`) רץ על `http://localhost:5080`.

```bash
npm install
npm run dev
```

הלקוח עולה ב-`http://localhost:5173` ו-Vite מעביר בקשות `/api` לשרת (ללא CORS). לשינוי כתובת השרת העתיקו `.env.example` ל-`.env`.

## הדגמת התחרות

פתחו שתי לשוניות (ה-Token נשמר לכל לשונית), התחברו כ-`appraiser1@example.com` וכ-`appraiser2@example.com` (סיסמה `Appraiser123!`), ולחצו "קח לטיפול" על אותה תביעת רכב. הראשון מצליח, והשני מקבל את חלון ה-409.

## פריסה

הלקוח נבנה לקבצים סטטיים (`npm run build` → `dist`) ונפרס כאתר סטטי נפרד (ראו `render.yaml`). בבנייה חובה להגדיר `VITE_API_URL` לכתובת השרת, ובשרת להגדיר `Cors__AllowedOrigins` לכתובת האתר הזה.

## Deploying to Render (free static site)

1. Deploy the API first (see the `InsuranceComServer` README) and note its URL.
2. Render Dashboard -> New -> Blueprint -> connect `InsuranceComClient` -> when prompted set `VITE_API_URL` to the API URL (for example `https://insurance-claims-api.onrender.com`, no trailing slash) -> Apply. Build: `npm ci && npm run build`, publish directory `dist`.
3. Add the site's URL to the API's `Cors__AllowedOrigins`.
4. The site redeploys on every push to `main`. `VITE_API_URL` is read at build time, so changing it requires a redeploy.

Troubleshooting: requests going to the static site itself (404) mean `VITE_API_URL` was empty at build time; CORS errors mean the API's `Cors__AllowedOrigins` does not match this site's origin.
