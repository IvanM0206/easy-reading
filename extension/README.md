# Foco de lectura (extensión de Chrome)

Desenfoca o atenúa todo el texto de la página menos la zona alrededor del cursor.
Versión 0.1: solo modo cursor. El modo línea y el peaje con minijuego todavía no están.

## Instalar (modo desarrollador)

1. Abrí `chrome://extensions`.
2. Activá **Modo de desarrollador** (arriba a la derecha).
3. Tocá **Cargar descomprimida** y elegí esta carpeta (`extension/`).
4. Si ya tenías pestañas abiertas, recargalas una vez.

## Uso

- Hacé clic en el ícono de la extensión para activar el foco, elegir el efecto
  y ajustar el tamaño de la zona y la intensidad. Efectos:
  - **Desenfoque**: suave, pero el más pesado. Puede ir lento en equipos modestos.
  - **Rápido** (experimental): desenfoque por bloques. Es más liviano, pero pueden verse
    líneas semilegibles en los bordes de los bloques.
  - **Resaltado**: solo atenúa. Es el más liviano.
- Atajo para prender y apagar: `Alt+Shift+F`. Se cambia en `chrome://extensions/shortcuts`.
- Mientras está activo, el ícono muestra "ON".

## Cómo funciona

`content.js` agrega una capa fija, sin eventos de puntero, dentro de un Shadow DOM.
La capa desenfoca (`backdrop-filter`) o atenúa todo, y una máscara circular deja nítida
la zona del cursor. No toca el texto ni el DOM del sitio, por eso sirve en casi cualquier página.

En **Desenfoque**, cada vez que la máscara se mueve el navegador vuelve a desenfocar toda la
pantalla. **Rápido** corta la capa en bloques de 160 px: al mover el cursor solo cambian los
bloques cercanos, y el navegador redibuja solo esa zona. Una "lente" del tamaño de esos bloques
recupera el borde circular y un atenuado suave baja el contraste del resto.

El costo es visual: cada bloque solo desenfoca lo que tiene detrás, así que en sus bordes el
texto queda menos desenfocado. Recortar bloques más grandes con `clip-path` no lo corrige,
porque el navegador también recorta lo que el bloque toma de fondo.

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
| `background.js` | Atajo de teclado e indicador "ON" en el ícono. |
| `popup.html`, `popup.css`, `popup.js` | Panel de ajustes. |
| `icons/` | Íconos de 16, 32, 48 y 128 px. |
