document.addEventListener("DOMContentLoaded", () => {
    cargarUsuarios();
});

const formulario = document.getElementById("formularioUsuario");
const cuerpoTabla = document.getElementById("tablaUsuarios");
const contadorUsuarios = document.getElementById("contadorUsuarios");

let graficoDominios = null;
let graficoEdades = null;

formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("idUsuario").value;
    const nombre = document.getElementById("nombreUsuario").value.trim();
    const correo = document.getElementById("correoUsuario").value.trim();
    const edad = parseInt(document.getElementById("edadUsuario").value);

    if (!nombre || !correo || !edad) return alert("Por favor completa todos los campos.");

    if (id) {
        await actualizarUsuario(id, { nombre, correo, edad });
    } else {
        await crearUsuario({ nombre, correo, edad });
    }

    formulario.reset();
    document.getElementById("idUsuario").value = "";

    // Restaurar botón
    const boton = document.getElementById("botonEnviar");
    boton.textContent = "Crear Usuario";
    boton.classList.remove("btn-warning");
    boton.classList.add("btn-success");

    cargarUsuarios();
});

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function obtenerUsuarios() {
    await esperar(200);
    return JSON.parse(localStorage.getItem("usuarios")) || [];
}

//Create
async function crearUsuario(usuario) {
    const usuarios = await obtenerUsuarios();
    usuario.id = Date.now();
    usuarios.push(usuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

async function actualizarUsuario(id, nuevosDatos) {
    const usuarios = await obtenerUsuarios();
    const actualizados = usuarios.map((u) => (u.id == id ? { ...u, ...nuevosDatos } : u));
    localStorage.setItem("usuarios", JSON.stringify(actualizados));
}

//Delete
async function eliminarUsuario(id) {
    const usuarios = await obtenerUsuarios();
    const filtrados = usuarios.filter((u) => u.id != id);
    localStorage.setItem("usuarios", JSON.stringify(filtrados));
    cargarUsuarios();
}

//Update
async function editarUsuario(id) {
    const usuarios = await obtenerUsuarios();
    const usuario = usuarios.find((u) => u.id == id);
    if (usuario) {
        document.getElementById("idUsuario").value = usuario.id;
        document.getElementById("nombreUsuario").value = usuario.nombre;
        document.getElementById("correoUsuario").value = usuario.correo;
        document.getElementById("edadUsuario").value = usuario.edad;

        const boton = document.getElementById("botonEnviar");
        boton.textContent = "Actualizar Usuario";
        boton.classList.remove("btn-success");
        boton.classList.add("btn-warning");

        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

//Funcion asincrona para cargar los datos
async function cargarUsuarios() {
    const usuarios = await obtenerUsuarios();
    cuerpoTabla.innerHTML = "";
    contadorUsuarios.textContent = usuarios.length;

    usuarios.forEach((usuario) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.correo}</td>
            <td>${usuario.edad}</td>
            <td>
                <button class="btn btn-warning btn-sm me-2" onclick="editarUsuario(${usuario.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${usuario.id})">🗑️</button>
            </td>
        `;
        cuerpoTabla.appendChild(fila);
    });

    mostrarGraficoDominios(usuarios);
    mostrarGraficoEdades(usuarios);
}

//Dashboard para Correos
function mostrarGraficoDominios(usuarios) {
    const ctx = document.getElementById("graficoDominios").getContext("2d");

    const conteoDominios = usuarios.reduce((acc, u) => {
        const dominio = u.correo.split("@")[1] || "desconocido";
        acc[dominio] = (acc[dominio] || 0) + 1;
        return acc;
    }, {});

    if (graficoDominios) graficoDominios.destroy();

    graficoDominios = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(conteoDominios),
            datasets: [
                {
                    data: Object.values(conteoDominios),
                    backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1"],
                },
            ],
        },
        options: { plugins: { legend: { position: "bottom" } } },
    });
}

//Dashboard para edades
function mostrarGraficoEdades(usuarios) {
    const ctx = document.getElementById("graficoEdades").getContext("2d");

    const rangos = {
        "Menores de 18": 0,
        "18-25": 0,
        "26-35": 0,
        "36-50": 0,
        "Mayores de 50": 0,
    };

    usuarios.forEach((u) => {
        const e = parseInt(u.edad);
        if (e < 18) rangos["Menores de 18"]++;
        else if (e <= 25) rangos["18-25"]++;
        else if (e <= 35) rangos["26-35"]++;
        else if (e <= 50) rangos["36-50"]++;
        else rangos["Mayores de 50"]++;
    });

    if (graficoEdades) graficoEdades.destroy();

    graficoEdades = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(rangos),
            datasets: [
                {
                    label: "Usuarios por rango de edad",
                    data: Object.values(rangos),
                    backgroundColor: "#0d6efd",
                },
            ],
        },
        options: {
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } },
        },
    });
}

// Eliminar todos los usuarios
const botonEliminarTodo = document.getElementById("botonEliminarTodo");

botonEliminarTodo.addEventListener("click", async () => {
    const confirmar = confirm("⚠️ ¿Seguro que quieres eliminar todos los usuarios? Esta acción no se puede deshacer.");

    if (confirmar) {
        localStorage.removeItem("usuarios");
        await cargarUsuarios();

        alert("✅ Todos los usuarios fueron eliminados correctamente.");
    }
});
