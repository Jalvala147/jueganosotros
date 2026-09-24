# JuegaNosotros

PWA de minijuegos en grupo, pensada para iPhone y Android. Misma idea que playus, con una diferencia: **la siguiente ronda empieza cuando todos han jugado**, no cada 24 horas.

- 18 minijuegos con la **misma semilla** para todo el grupo
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

## Firebase (tú lo conectas)

Guía clic a clic: [FIREBASE.md](./FIREBASE.md).

Resumen: crea el proyecto, app web, activa Google (Apple si tienes Developer), crea Firestore, pega `firestore.rules` y copia la config a `.env.local` con `VITE_USE_LOCAL=false`. Luego `npm run build` y `npx firebase deploy`.

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
