# Foco de lectura (extensión de Chrome)

Atenúa o desenfoca todo el texto de la página menos la zona alrededor del cursor.
Versión 0.1: solo modo cursor. El modo línea y el peaje con minijuego todavía no están.

## Instalar (modo desarrollador)

1. Abrí `chrome://extensions`.
2. Activá **Modo de desarrollador** (arriba a la derecha).
3. Tocá **Cargar descomprimida** y elegí esta carpeta (`extension/`).

Para actualizarla después de un `git pull`, tocá el botón de recargar de la extensión en
`chrome://extensions`. La extensión vuelve a cargarse sola en las pestañas abiertas; no hace
falta recargarlas. En archivos locales (`file://`) solo funciona si activás **Permitir acceso
a URLs de archivos** en los detalles de la extensión.

## Uso

- Hacé clic en el ícono de la extensión para activar el foco, elegir el efecto
  y ajustar el tamaño de la zona y la intensidad. Efectos:
  - **Resaltado** (por defecto): atenúa el resto del texto. Es el más liviano y, con
    intensidad alta, lo oculta casi por completo. Se puede elegir el color del atenuado:
    el fondo de la página (automático), blanco, sepia, gris, azul noche, negro u otro color.
  - **Desenfoque**: suave, pero el más pesado. Puede ir lento en equipos modestos.
- Atajo para prender y apagar: `Alt+Shift+F`. Se cambia en `chrome://extensions/shortcuts`.
- Mientras está activo, el ícono muestra "ON".

## Cómo funciona

`content.js` agrega una capa fija, sin eventos de puntero, dentro de un Shadow DOM.
La capa atenúa todo con un color semitransparente, o lo desenfoca (`backdrop-filter`), y una
máscara circular deja nítida la zona del cursor. No toca el texto ni el DOM del sitio, por eso
sirve en casi cualquier página.

En **Desenfoque**, cada vez que la máscara se mueve el navegador vuelve a desenfocar toda la
pantalla, y por eso es más pesado. Se probó cortar la capa en bloques para redibujar solo los
cercanos al cursor, pero en los bordes de los bloques el texto quedaba legible y se descartó.

## Límites conocidos

- No actúa en el visor de PDF integrado de Chrome ni en páginas internas como `chrome://`.
- El desenfoque también afecta a menús y banners del sitio, porque cubre toda la ventana.
- No se ve sobre video en pantalla completa.
- No cubre iframes: solo el documento principal.

## Archivos

| Archivo | Qué hace |
|---|---|
| `manifest.json` | Declaración de la extensión (Manifest V3). |
| `content.js` | La capa de enfoque que se inyecta en cada página. |
| `background.js` | Atajo de teclado, indicador "ON" en el ícono y carga en pestañas ya abiertas. |
| `popup.html`, `popup.css`, `popup.js` | Panel de ajustes. |
| `icons/` | Íconos de 16, 32, 48 y 128 px. |
