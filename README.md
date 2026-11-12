<a href="https://github.com/Gentleman-Programming/gentle-ai">
  <img width="220" src="https://raw.githubusercontent.com/Gentleman-Programming/gentle-ai/main/docs/assets/brand/built-with-gentle-ai.png" alt="Built with Gentle-AI" />
</a>

# text-fitting

**¿Te ha pasado que apruebas una pantalla con un nombre corto, y en producción
llega el nombre largo y se rompe todo?**

A todos nos ha pasado. El diseñador acomoda «Nigiri» en el recuadro, todo queda
perfecto, y al día siguiente el mismo recuadro recibe «Nigiri de Atún con Queso
Crema y Ajonjolí (2 piezas)». Misma caja, con un montón de letras más y se rompe.

Y entonces pasa una de tres cosas, y las tres son malas:

- El texto **se sale** del recuadro y pisa lo que tiene al lado.
- El texto **se corta** y aparece «Nigiri de Atún con…». El cliente no sabe qué
  está comprando.
- El texto **empuja** el botón de comprar fuera de la pantalla. No es un error
  visible: es una venta perdida.

Lo peor es que nadie lo reporta como error. El cliente simplemente no entiende y cierra la
página.

**Pues text-fitting existe exactamente para eso.** Le dice a tu agente que cada
texto se ajuste solo a la caja que le toca: si el nombre es corto, la letra crece
y llena el espacio; si es largo, encoge lo justo hasta caber. Nunca se sale.
Nunca se corta sin avisar. Y nunca se hace tan chico que nadie pueda leerlo.

---

## Míralo funcionando antes de instalar nada

**[👉 Abrir el catálogo de los 20 escenarios](https://lokeraar.github.io/text-fitting/catalogo.html)**

Esa página es la prueba, no una promesa. Tiene veinte casos armados —el bueno y
el malo, uno al lado del otro— y **se mide a sí misma**: cada escenario se
revisa solo y te dice **PASA**, **FALLA** o **A OJO** (este último pide que lo
mires tú, porque la decisión es de diseño, no de aritmética).

Puedes escribir en los campos, cambiar los anchos y ver en vivo cómo responde la
letra. Si algo de lo que este README promete no ocurre en esa página, entonces es
mentira, y el enlace está ahí para que lo compruebes.

Los veinte escenarios cubren:

| # | Escenario | Qué demuestra |
|---|---|---|
| 01 | Párrafo largo, sin tope de líneas | Cuándo **no** se mide: el texto debe fluir |
| 02 | Título de página con techo y piso | Los dos límites, en una sola regla |
| 03 | Título corto que debe partirse parejo | Repartir los renglones, no apiñarlos |
| 04 | Tarjeta con cupo de 2 renglones, elegido por ti | El cupo es una **decisión**, no una medida |
| 05 | El renglón de gracia: uno más, y solo uno | Se concede **uno**, nunca dos |
| 06 | Celda con varias piezas, un solo tamaño | La jerarquía va por color y peso, no por tamaño |
| 07 | Tres rótulos que comparten un renglón | La misma línea, el mismo tamaño |
| 08 | Campo que bloquea al llenarse | La capacidad se mide, no se inventa |
| 09 | El texto cambia después de estar pintado | Se vuelve a medir, no se congela |
| 10 | Una sola estrategia: los renglones manda | Encoger primero, crecer después |
| 11 | La misma tarjeta en dos anchos | La letra responde a su contenedor |
| 12 | Frase corta que no se parte | **Roba un renglón entero** |
| 13 | Un hijo con tamaño propio | Se desproporciona: 22 % más grande |
| 14 | `line-clamp` en el padre | No hace nada; en el hijo sí, y es lo correcto |
| 15 | Mirar solo el alto | El texto se sube encima de la columna vecina |
| 16 | Centrar texto que no cabe | Centrar no es lo mismo que caber |
| 17 | Ancho copiado de un aparato | El ancho se mide donde vive, no donde se diseñó |
| 18 | Zoom al 500 % | El texto debe seguir creciendo, no desbordar |
| 19 | Contenido que no se puede recortar | Bloquear, nunca recortar en silencio |
| 20 | Alcance real | Toda interfaz con texto en una caja, y sus límites |


## Qué te llevas

- **La letra crece cuando sobra sitio.** Un título corto ocupa sus líneas con la
  letra al tamaño máximo; uno largo encoge lo justo. El bloque nunca cambia de
  alto y nunca se sale.
- **Hay un piso que no se cruza: 8 puntos.** Cuando el texto no cabe ni ahí, se
  le concede **un renglón más, y solo uno**. Si tampoco cabe, recién entonces se
  permite cortar, y siempre avisando.
- **Una misma línea, un solo tamaño.** Tres rótulos que comparten renglón salen
  idénticos. Sin esa regla, cada uno se ajusta a su ancho y la línea parece un
  error de maquetación.
- **Nada de letra de seis píxeles.** Si no cabe, se gana una línea. No se encoge
  hasta ser ilegible.

## Los dos caminos

La elección se hace una vez por elemento, y es una sola pregunta:

> **¿Puedes estimar cuántas filas debe ocupar este texto?**

| Si respondes… | Se usa | Porque |
|---|---|---|
| «No, que fluya» | CSS fluido (`clamp()` con `rem`) | Crece y encoge con la pantalla, sin una línea de JavaScript |
| «Sí, exactamente 2» | Auto-ajuste medido | Ninguna hoja de estilos sabe cuántas letras hay dentro; hay que medirlo |

Y algo igual de importante: **también dice cuándo no usarse.** Un párrafo de diez
líneas no se auto-ajusta; ahí manda la tipografía fluida. Una skill que solo sabe
decir «sí» no sirve de mucho.

---

## Instalación

La skill es una carpeta con un `SKILL.md`, el formato que Pi descubre solo.
Cópiala donde Pi mira.

### Pi

```bash
git clone https://github.com/Lokeraar/text-fitting.git
mkdir -p ~/.pi/agent/skills
cp -a text-fitting ~/.pi/agent/skills/text-fitting
```

### Pi, en la ubicación estándar compartida

Pi también lee `~/.agents/skills/`, el estándar de Agent Skills, que sirve para
cualquier cliente que lo respete:

```bash
mkdir -p ~/.agents/skills
cp -a text-fitting ~/.agents/skills/text-fitting
```

### Gentle Shell

Gentle Shell usa su propia casa y **no** lee la de Pi:

```bash
mkdir -p ~/.gentle-shell/agent/skills
cp -a text-fitting ~/.gentle-shell/agent/skills/text-fitting
```

Después de copiarla, abre una sesión nueva o usa `/reload` para que aparezca en
el índice.

### Solo para un proyecto

Dentro de un repositorio, en `.agents/skills/`:

```bash
mkdir -p .agents/skills
cp -a text-fitting .agents/skills/text-fitting
```

Pi descubre esa carpeta desde donde estás hacia arriba, y se detiene en la raíz
del repositorio.

> **Un aviso honesto:** una skill son instrucciones que un agente lee y ejecuta.
> Revisa cualquier skill antes de dársela, sobre todo si viene de un tercero.
> Esta la puedes leer entera en `SKILL.md`.

## Cómo se usa

No hay que invocarla a mano: se activa cuando la tarea encaja. Para forzarla:

```
/skill:text-fitting
```

O pídelo en lenguaje llano:

> «Este título debe ocupar exactamente dos líneas, con cualquier longitud de texto.»

Si le dices cuántos renglones son, no pregunta nada más. Si solo dices «aplica
text-fitting», te va a preguntar **dónde** aplicarlo y **cuántos renglones/filas** debe
ocupar. Son las dos únicas decisiones que no puede adivinar.

## Qué contiene

```
text-fitting/
├── SKILL.md                      Las reglas (8 duras + puertas de decisión)
├── catalogo.html                 Los 20 escenarios, para abrir en el navegador
└── assets/
    ├── examples.md               Antes y después, con las cuentas
    ├── FitField.astro            Campo de texto de ejemplo, funcionando
    ├── preview.html              Página para verlo en vivo
    └── verify/                   Verificador automático en un navegador real
```

### El catálogo de escenarios

Abre **[catalogo.html](https://lokeraar.github.io/text-fitting/catalogo.html)**
en cualquier navegador. También funciona sin conexión: descárgalo y ábrelo desde
tu disco, no pide nada a la red.

Cada escenario trae su veredicto automático y, cuando la decisión es de diseño,
te lo dice en vez de fingir que sabe.

### El verificador

Comprueba en un navegador de verdad que el comportamiento documentado ocurre. No
hay que hacer clic a mano ni confiar en la memoria.

```bash
cd assets/verify
npm install        # una vez; solo instala puppeteer-core
node verify.js
```

Sale `0` si todo pasa, `1` si algo falla, `2` si no pudo arrancar.

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

## ¿Y si mi proyecto no es Astro?

Funciona en **cualquier interfaz web**: Astro, React, Vue, Svelte o HTML suelto,
más CSS global y Tailwind. Las reglas de medición son aritmética del navegador y
no dependen de ningún framework. Lo único atado a un framework son los *ejemplos*
de container queries y de escala de tamaños, que se traducen uno a uno.

Queda fuera, a propósito: hojas de estilo de impresión, pantallas de kiosco con
densidad fija, texto dentro de SVG o canvas, y cualquier caso donde el diseño
exija una unidad física.

## De dónde salen las reglas

De errores reales, con sus números medidos. No son consejos de manual: son cosas
que fallaron y se midieron.

- **La unidad de medida se pintaba un 22 % más grande que el nombre que la
  acompañaba**, porque llevaba su propio tamaño con un piso fijo y dejaba de
  encoger cuando el nombre seguía bajando. Costaba un renglón entero y no se veía
  en el código.
- **Prohibir que una frase corta se parta roba un renglón completo.** Con unos
  105 px de columna caben 19 caracteres; un nombre de 13 deja 6 libres, pero una
  frase de 18 que no puede partir empieza el renglón siguiente y deja el anterior
  casi vacío. El desperdicio no lo causaba el texto largo.
- **`line-clamp` en el padre de un bloque no hace nada.** Cuenta las cajas de
  línea del elemento al que se aplica, y un hijo en bloque no genera cajas para
  su padre: el tope existía en el CSS y no en el motor.
- **Un campo cortaba el texto en 75 caracteres cuando cabían 140.** Medía con una
  muestra de letras anchas y aplicaba ese número a cualquier texto. El último
  renglón quedaba lleno al 9 % y parecía que el campo no aprovechaba el espacio.

Los números están en `SKILL.md`, no como anécdota sino como prueba de que cada
regla salió de un caso que falló.

## Licencia

Apache-2.0. Ver el frontmatter de `SKILL.md`.
