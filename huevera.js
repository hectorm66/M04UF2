let anchoLienzo = 800;
let altoLienzo = 450;

let configuracion = {
  width: anchoLienzo,
  height: altoLienzo,
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: {
    preload: cargarRecursos,
    create: iniciarEscena,
    update: actualizarEscena,
  },
};

let juego = new Phaser.Game(configuracion);

let textoContador;
let tiempoRestante = 60;
let listaHuevos = [];
let puntaje = 0;
let coloresHuevos = [0xffffff, 0x8b4513, 0xffd700];
let musicaPrincipal,
  efectoTomar,
  efectoBien,
  efectoMal,
  musicaFinal;

const TIEMPO_BIEN = 5;
const PUNTOS_BLANCOS = 10;
const PUNTOS_MARRONES = 25;
const PUNTOS_DORADOS = 50;
const TIEMPO_MAL = -5;
const PUNTOS_MAL = -5;

let juegoTerminado = false;

function cargarRecursos() {
  this.load.image("huevera", "/imgs/huevera.png");
  this.load.image("huevo", "/imgs/huevo.png");
  this.load.image("fondo", "/imgs/fondo.jpg");
  this.load.image("fondoHueveras", "/imgs/fondo_hueveras.jpg");

  this.load.audio("musicaFondo", "/sonidos/musica_fondo.mp3");
  this.load.audio("sonidoAgarrar", "/sonidos/click.wav");
  this.load.audio("sonidoCorrecto", "/sonidos/sonido_dejarHuevo.mp3");
  this.load.audio("sonidoIncorrecto", "/sonidos/error.mp3");
  this.load.audio("musicaGameOver", "/sonidos/gameover.mp3");
}

function iniciarEscena() {
  this.add.image(anchoLienzo / 2, altoLienzo / 2, "fondo").setDisplaySize(anchoLienzo, altoLienzo);

  let columnaHueveras = this.add.image(150, altoLienzo / 2, "fondoHueveras");
  columnaHueveras.setDisplaySize(300, altoLienzo);

  let contenedores = [];
  for (let i = 0; i < 3; i++) {
    contenedores.push(
      this.add.image(150, 100 + i * 120, "huevera").setScale(0.5).setTint(coloresHuevos[i])
    );
  }

  musicaPrincipal = this.sound.add("musicaFondo", { loop: true, volume: 0.5 });
  efectoTomar = this.sound.add("sonidoAgarrar");
  efectoBien = this.sound.add("sonidoCorrecto");
  efectoMal = this.sound.add("sonidoIncorrecto");
  musicaFinal = this.sound.add("musicaGameOver", { volume: 0.5 });

  musicaPrincipal.play();

  this.input.on("drag", (puntero, objeto, x, y) => {
    objeto.x = x;
    objeto.y = y;
  });

  this.input.on("dragend", (puntero, objeto) => {
    if (!objeto.texture || objeto.texture.key !== "huevo") return;

    let acierto = false;
    let puntosGanados = PUNTOS_MAL;
    let cambioTiempo = TIEMPO_MAL;

    contenedores.forEach((contenedor) => {
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          contenedor.getBounds(),
          objeto.getBounds()
        ) && contenedor.tintTopLeft === objeto.tintTopLeft
      ) {
        acierto = true;
        cambioTiempo = TIEMPO_BIEN;
        if (objeto.tintTopLeft === 0xffd700) {
          puntosGanados = PUNTOS_DORADOS;
        } else if (objeto.tintTopLeft === 0x8b4513) {
          puntosGanados = PUNTOS_MARRONES;
        } else {
          puntosGanados = PUNTOS_BLANCOS;
        }
        efectoBien.play();
      }
    });

    if (!acierto) efectoMal.play();

    tiempoRestante += cambioTiempo;
    puntaje += puntosGanados;

    listaHuevos.splice(listaHuevos.indexOf(objeto), 1);
    objeto.destroy();

    textoContador.setText(`Tiempo: ${tiempoRestante}  Puntos: ${puntaje}`);
    if (tiempoRestante <= 0) terminarJuego.call(this);
  });

  const generarHuevo = () => {
    if (juegoTerminado) return;

    let xAleatorio = Phaser.Math.Between(350, 750);
    let dado = Phaser.Math.Between(1, 10);
    let colorSeleccionado;
    if (dado === 10) {
      colorSeleccionado = 0xffd700;
    } else if (dado >= 6) {
      colorSeleccionado = 0x8b4513;
    } else {
      colorSeleccionado = 0xffffff;
    }

    let nuevoHuevo = this.physics.add.image(xAleatorio, 100, "huevo");
    nuevoHuevo.setScale(1);
    nuevoHuevo.setTint(colorSeleccionado);
    nuevoHuevo.setVelocityY(100);
    nuevoHuevo.setInteractive();

    nuevoHuevo.on("pointerdown", () => {
      efectoTomar.play();
      nuevoHuevo.setVelocityY(0);
    });

    this.input.setDraggable(nuevoHuevo);
    listaHuevos.push(nuevoHuevo);
  };

  this.time.addEvent({ delay: 2000, callback: generarHuevo, loop: true });

  // Texto arriba derecha, más llamativo
  textoContador = this.add.text(anchoLienzo - 20, 20, `Tiempo: ${tiempoRestante}  Puntos: ${puntaje}`, {
    fontSize: "32px",
    fontStyle: "bold",
    fontFamily: "Arial",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
    shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 2, fill: true },
  });
  textoContador.setOrigin(1, 0); // Origen arriba derecha

  setInterval(() => {
    if (juegoTerminado) return;
    tiempoRestante--;
    textoContador.setText(`Tiempo: ${tiempoRestante}  Puntos: ${puntaje}`);
    if (tiempoRestante <= 0) terminarJuego.call(this);
  }, 1000);
}

function actualizarEscena() {
  if (tiempoRestante > 0 && tiempoRestante <= 10) {
    musicaPrincipal.rate = 1.25;
  } else {
    musicaPrincipal.rate = 1;
  }
}

function terminarJuego() {
  if (juegoTerminado) return;
  juegoTerminado = true;

  musicaPrincipal.stop();
  musicaFinal.play();

  textoContador.setText(`¡Game Over!\nPuntuación: ${puntaje}`);
  textoContador.setOrigin(0.5);
  textoContador.setPosition(anchoLienzo / 2, altoLienzo / 2);
  textoContador.setFontSize(48);
  textoContador.setColor("#ff0000");
  textoContador.setStroke("#000000", 6);
  textoContador.setShadow(3, 3, "#000000", 5, true, true);

  listaHuevos.forEach((huevo) => huevo.setInteractive(false));
  juego.scene.remove("hueveras");
}

