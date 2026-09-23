# JuegaNosotros

PWA de minijuegos en grupo, pensada para iPhone y Android. Misma idea que playus, con una diferencia: **la siguiente ronda empieza cuando todos han jugado**, no cada 24 horas.

- 20 minijuegos con la **misma semilla** para todo el grupo
- Grupos por **código** (puedes estar en varios)
- Login con **Google** y **Sign in with Apple** (Firebase Auth)
- Temporada estilo F1, **Elo**, forma de las últimas 5 y **rachas**
- 1 práctica + 2 intentos oficiales
- Las puntuaciones ajenas se ocultan hasta que tú hayas jugado
- Instalable como app (Añadir a pantalla de inicio)

## Arrancar en local

```bash
npm install
npm run dev
```

Sin proyecto Firebase, la app entra en **modo local**: los datos viven en este navegador. Abre dos pestañas, entra con apodos distintos y únete al mismo código.

```bash
npm test
npm run build
```

## Conectar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com).
2. Activa **Authentication** → Google y Apple.
3. Activa **Firestore** en modo producción y pega las reglas de `firestore.rules`.
4. Añade una app web y copia la config a `.env.local`:

```
VITE_USE_LOCAL=false
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

5. En Google Cloud, añade tu dominio a los orígenes autorizados del cliente OAuth.
6. Para Apple: cuenta de Apple Developer, Service ID, return URL de Firebase Auth.

Despliegue:

```bash
npm run build
npx firebase deploy
```

## Cómo se puntúa

| Puesto | Pts |
|--------|-----|
| 1º | 25 |
| 2º | 18 |
| 3º | 15 |
| 4º | 12 |
| 5º | 10 |
| … | … |
| Jugar | +2 |

Más bonus por racha de presencia (cada 5), racha de victorias (3/5/7/10), clutch (ganar en el último intento) y récord personal.

Desempate de temporada: puntos → victorias → forma (últimas 5) → media.

Elo empieza en 1000 y se actualiza como torneo por pares. La corona usa puntos de temporada, no Elo.

Si alguien no juega y se cierra la ronda, queda último, no suma y se le rompe la racha.

## Minijuegos

Toque verde, Reacción, Para la barra, Topos, Simon, Aleteo, Serpiente, Torre, Cruza, Color switch, Cuchillos, Dardos, Penaltis, Piano tiles, 2048, Memoria, Cálculo rápido, Palabra, Agua de colores, Carriles.
