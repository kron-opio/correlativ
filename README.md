# CORRELATIV — Setup

## 1. Crear el proyecto Firebase

1. Ir a https://console.firebase.google.com → **Crear proyecto**
2. En **Firestore Database** → Crear base de datos → modo **Producción**
3. En **Reglas de Firestore**: pegar el contenido de `firestore.rules` y publicar
4. En **Configuración del proyecto** → **Tu app** (ícono `</>`) → Registrar app web
5. Copiar el objeto `firebaseConfig` y pegarlo en `js/firebase-config.js`

## 2. Cargar los datos (una sola vez)

```bash
# Instalar dependencias del script
npm install

# Ir a Firebase Console → Configuración → Cuentas de servicio
# → Generar nueva clave privada → guardar como serviceAccountKey.json
# (en la raíz del proyecto — NUNCA subir a git)

node admin-seed.js
```

## 3. Agregar estudiantes

Editar el array `STUDENTS` en `admin-seed.js`:

```js
const STUDENTS = [
  { name: 'Nombre Apellido', careerId: 'curaduria-2015' },
];
```

Correr `node admin-seed.js` → el script imprime la URL única de cada estudiante.
Mandarle esa URL al estudiante (WhatsApp, mail, etc.).

## 4. Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

En GitHub → Settings → Pages → Source: **main / (root)** → Save.
La app queda en: `https://TU_USUARIO.github.io/TU_REPO`

Actualizar `BASE_URL` en `admin-seed.js` con esa URL.

## Agregar una carrera nueva

Agregar un objeto nuevo en `admin-seed.js` con la misma estructura que `CURADURIA_2015`,
con un `id` de documento diferente (ej: `curaduria-2020`), y llamarlo en `seed()`.

## Seguridad

- `serviceAccountKey.json` está en `.gitignore` y **nunca** se sube a git
- La API key de Firebase en `firebase-config.js` es pública por diseño (no es un secreto)
- Las Firestore Security Rules impiden que alguien modifique datos de otra persona o cree estudiantes
- Tu email de Google solo existe en la consola de Firebase, nunca en el código
