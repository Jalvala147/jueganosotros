# Lo que tienes que hacer tú en Firebase

La app ya está lista. Sin tu proyecto, corre en **modo local** (este navegador). Para Google, Apple y que todos jueguen desde su móvil, conecta Firebase.

## 1. Crear el proyecto
1. Entra en https://console.firebase.google.com
2. **Añadir proyecto** → nombre `jueganosotros` (o el que quieras)
3. Desactiva Google Analytics si no lo quieres

## 2. App web
1. En el proyecto: icono `</>` **Añadir app** → Web
2. Nombre: `JuegaNosotros`
3. Copia estos 6 valores a un archivo `.env.local` en la raíz del repo:

```
VITE_USE_LOCAL=false
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 3. Authentication
1. **Build → Authentication → Get started**
2. **Sign-in method → Google** → activar → guardar  
   - Añade tu correo como usuario de asistencia
3. **Sign-in method → Apple** → activar  
   - Hace falta cuenta de **Apple Developer** (99 USD/año)
   - Service ID, Team ID, Key ID y clave `.p8`
   - Return URL que te da Firebase (tipo `https://TU-PROYECTO.firebaseapp.com/__/auth/handler`)
4. **Settings → Authorized domains**: añade `localhost` (ya viene) y el dominio donde la publiques (`jueganosotros.web.app` o el tuyo)

Si aún no tienes Apple Developer, deja Apple apagado: Google basta para Android y para iPhone en Safari.

## 4. Firestore
1. **Build → Firestore Database → Create database**
2. Modo **producción**, ubicación `eur3` (o la más cercana)
3. Pestaña **Rules** → pega el contenido de `firestore.rules` de este repo → **Publish**

## 5. Publicar la PWA
```bash
npm run build
npx firebase login
npx firebase init hosting   # public: dist, SPA: yes
npx firebase deploy
```

O sube `dist/` a Vercel / Netlify y pon el mismo dominio en Authorized domains.

## 6. En el iPhone / Android
Safari o Chrome → **Compartir → Añadir a pantalla de inicio**. Se abre como app.

Cuando `.env.local` esté relleno y `VITE_USE_LOCAL=false`, los botones de Google y Apple se activan solos.
