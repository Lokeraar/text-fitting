# text-fitting

Una skill para **Pi** y **Gentle Shell** que evita el problema más silencioso de
cualquier interfaz con texto: la letra que no cabe en su caja.

El caso típico no es un error de diseño. El diseñador aprueba la pantalla con un
nombre corto —«Nigiri»— y en producción llega «Nigiri de Atún con Queso Crema y
Ajonjolí (2 piezas)». El mismo recuadro, el doble de letras. El texto se sale, se
corta con puntos suspensivos o empuja el botón de al lado fuera de la pantalla. Y
nadie lo reporta como error: el cliente simplemente no compra ese plato.

Esta skill enseña a que cada texto se ajuste solo a la caja que le toca.

---

## Qué hace

Dos caminos, y la elección se hace una vez por elemento:

| Si el texto… | Se usa | Porque |
|---|---|---|
| Fluye libre, sin tope de líneas (un párrafo) | CSS fluido (`clamp()` con `rem`) | Crece y encoge con la pantalla, sin una línea de JavaScript |
| Tiene un cupo declarado («este título ocupa exactamente 2 líneas») | Auto-ajuste medido | Ninguna hoja de estilos sabe cuántas letras hay dentro; hay que medirlo |

La pregunta que decide es una sola: **¿puedes decir en voz alta cuántos renglones
debe ocupar?** Si sí, se mide. Si no, se deja fluir.

Y una cosa que la distingue: **también dice cuándo no usarse**. Un párrafo de diez
líneas no se auto-ajusta; ahí manda la tipografía fluida.

## Qué garantiza

- **La letra crece cuando sobra sitio.** Un título corto ocupa sus líneas con la
  letra al tamaño máximo permitido; uno largo encoge lo justo. El bloque nunca
  cambia de alto y nunca se sale.
- **Existe un piso que no se cruza** (8 puntos). Cuando el texto no cabe ni ahí,
  se le concede **un renglón más, y solo uno**. Si tampoco, recién entonces se
  permite cortar.
- **Una misma línea, un solo tamaño.** Tres rótulos que comparten renglón salen
  idénticos. Sin esa regla, cada uno se ajusta a su ancho y la línea parece un
  error de maquetación.
- **Nada de letra de seis píxeles.** Si no cabe, se gana una línea; no se
  encoge hasta ser ilegible.

## Instalación

La skill es un directorio con un `SKILL.md`, el formato portable que Pi descubre
de forma recursiva. Basta copiarla donde Pi mira.

### Pi

```bash
git clone https://github.com/Lokeraar/text-fitting.git
mkdir -p ~/.pi/agent/skills
cp -a text-fitting ~/.pi/agent/skills/text-fitting
```

### Pi, en la ubicación estándar compartida

Pi también lee `~/.agents/skills/`, que es el estándar de Agent Skills y sirve
para cualquier cliente que lo respete:

```bash
mkdir -p ~/.agents/skills
cp -a text-fitting ~/.agents/skills/text-fitting
```

### Gentle Shell

Gentle Shell usa su propio home y **no** lee el de Pi. La ruta es:

```bash
mkdir -p ~/.gentle-shell/agent/skills
cp -a text-fitting ~/.gentle-shell/agent/skills/text-fitting
```

Después de copiarla, abre una sesión nueva o usa `/reload` para que aparezca en
el índice de skills.

### Solo para un proyecto

Dentro de un repositorio, en `.agents/skills/`:

```bash
mkdir -p .agents/skills
cp -a text-fitting .agents/skills/text-fitting
```

Pi descubre esa carpeta desde el directorio de trabajo hacia arriba, deteniéndose
en la raíz del repositorio.

> **Un aviso honesto:** una skill son instrucciones que un agente lee y ejecuta.
> Revisa cualquier skill antes de dársela, sobre todo si viene de un tercero.

## Cómo se usa

No hay que invocarla a mano: se activa cuando la tarea encaja. Para forzarla,
en Pi:

```
/skill:text-fitting
```

O pídelo en lenguaje llano:

> «Este título debe ocupar exactamente dos líneas, con cualquier longitud de texto.»

## Qué contiene

```
text-fitting/
├── SKILL.md                      Las reglas (8 duras + puertas de decisión)
└── assets/
    ├── examples.md               Catálogo de antes y después, con las cuentas
    ├── FitField.astro            Campo de texto de ejemplo, funcionando
    ├── preview.html              Página que puedes abrir para verlo en vivo
    └── verify/                   Verificador automático en un navegador real
```

### El verificador

Comprueba en un navegador de verdad que el comportamiento documentado ocurre.
No hay que hacer clic a mano ni confiar en la memoria.

```bash
cd assets/verify
npm install        # una vez; solo instala puppeteer-core
node verify.js
```

Sale `0` si todo pasa, `1` si algo falla, `2` si el verificador no pudo arrancar.

**El navegador se busca solo.** Prueba las ubicaciones habituales de Linux, macOS
y Windows (Chrome, Chromium y Edge, incluida la instalación por usuario). Si el
tuyo está en otro sitio:

```bash
node verify.js /ruta/a/tu/chrome
# o
CHROME_PATH=/ruta/a/tu/chrome node verify.js
```

Está en **un solo archivo a propósito**: antes estaba repartido en varios scripts
y se colaron comprobaciones inválidas sin que nadie lo notara. Un archivo único no
tiene costuras donde una prueba pueda desaparecer.

## Alcance

Funciona en **cualquier interfaz web**: Astro, React, Vue, Svelte o HTML suelto,
más CSS global y Tailwind. Las reglas de medición son aritmética del navegador y
no dependen de ningún framework; lo único atado a un framework son los *ejemplos*
de container queries y de escala de tamaños, que se traducen uno a uno.

Queda fuera, a propósito: hojas de estilo de impresión, pantallas de kiosco con
densidad fija, texto dentro de SVG o canvas, y cualquier caso donde el diseño
exija una unidad física.

## De dónde salen las reglas

De errores reales, con sus números medidos. Algunos ejemplos:

- **La unidad de medida se pintaba un 22 % más grande que el nombre que
  acompañaba**, porque llevaba su propio tamaño con un piso fijo y dejaba de
  encoger cuando el nombre seguía bajando. Costaba un renglón entero y no se veía
  en el código.
- **Prohibir que una frase corta se parta roba un renglón completo.** Con ~105 px
  de columna caben 19 caracteres; un nombre de 13 deja 6 libres, pero una frase
  de 18 que no puede partir empieza el renglón siguiente y deja el anterior casi
  vacío. El desperdicio no lo causaba el texto largo.
- **`line-clamp` en el padre de un bloque no hace nada.** Cuenta las cajas de
  línea del elemento al que se aplica, y un hijo en bloque no genera cajas para
  su padre: el tope existía en el CSS y no en el motor.

Los números están en `SKILL.md`, no como anécdota sino como prueba de que cada
regla salió de un caso que falló.

## Licencia

Apache-2.0. Ver el frontmatter de `SKILL.md`.
