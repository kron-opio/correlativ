/**
 * CORRELATIV — Firebase Config
 *
 * INSTRUCCIONES:
 *   1. Andá a https://console.firebase.google.com
 *   2. Creá un proyecto nuevo (el nombre que quieras, ej: "correlativ")
 *   3. Agregá una app web (ícono </> en la página de inicio del proyecto)
 *   4. Copiá los valores del objeto firebaseConfig que te muestra y reemplazalos acá abajo
 *
 * NOTA: La API key de Firebase es PÚBLICA por diseño (no es un secreto).
 * La seguridad se maneja con las Firestore Security Rules, no con esta clave.
 */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyC96LIVJZNFn209U8zW5E3vi51Fzgw4OOY",
  authDomain:        "correlativ.firebaseapp.com",
  projectId:         "correlativ",
  storageBucket:     "correlativ.firebasestorage.app",
  messagingSenderId: "384243587422",
  appId:             "1:384243587422:web:4c70ac215101ba00af97cf"
};

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
