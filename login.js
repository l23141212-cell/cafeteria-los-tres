const loginForm = document.getElementById("loginForm");
const formMessage = document.getElementById("formMessage");
const passwordInput = document.getElementById("password");
const showRegisterButton = document.getElementById("showRegister");
const submitButton = loginForm.querySelector('button[type="submit"]');
const nameField = document.getElementById("nameField");
const fullNameInput = document.getElementById("fullName");
const loginIntro = document.getElementById("loginIntro");
const registerCopy = document.getElementById("registerCopy");

let registerMode = false;

document.getElementById("togglePassword").addEventListener("click", () => {
  const show = passwordInput.type === "password";
  passwordInput.type = show ? "text" : "password";
  document.getElementById("togglePassword").textContent = show ? "Ocultar" : "Ver";
});

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("cafeteriaLosTresIngUsers") || "[]");
  } catch {
    return [];
  }
}

function setMessage(message, success = false) {
  formMessage.textContent = message;
  formMessage.style.color = success ? "#39734a" : "";
}

function setMode(isRegister) {
  registerMode = isRegister;
  setMessage("");
  nameField.hidden = !isRegister;
  fullNameInput.required = isRegister;
  loginIntro.textContent = isRegister
    ? "Crea tu cuenta para realizar y consultar tus pedidos."
    : "Ingresa tus datos para entrar a CAFETERIA LOS TRES ING.";
  document.querySelector(".login-card h2").textContent = isRegister ? "Crear cuenta" : "Iniciar sesión";
  submitButton.innerHTML = isRegister
    ? 'Crear cuenta <span>→</span>'
    : 'Entrar a la cafetería <span>→</span>';
  registerCopy.innerHTML = isRegister
    ? '¿Ya tienes cuenta? <button type="button" id="showRegister">Iniciar sesión</button>'
    : '¿Aún no tienes cuenta? <button type="button" id="showRegister">Crear cuenta</button>';
  document.getElementById("showRegister").addEventListener("click", () => setMode(!registerMode));
}

showRegisterButton.addEventListener("click", () => setMode(true));

loginForm.addEventListener("submit", event => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = passwordInput.value;
  const users = getUsers();

  if (!email || !password) {
    setMessage("Completa tu correo y contraseña.");
    return;
  }

  if (registerMode) {
    const fullName = fullNameInput.value.trim();
    if (!fullName) {
      setMessage("Escribe tu nombre completo.");
      return;
    }
    if (password.length < 4) {
      setMessage("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    if (users.some(user => user.email === email)) {
      setMessage("Ya existe una cuenta con ese correo. Inicia sesión.");
      return;
    }
    users.push({ fullName, email, password });
    localStorage.setItem("cafeteriaLosTresIngUsers", JSON.stringify(users));
    localStorage.setItem("cafeteriaLosTresIngSession", JSON.stringify({ fullName, email }));
    setMessage("¡Cuenta creada! Entrando a la cafetería...", true);
    setTimeout(() => window.location.href = "home.html", 650);
    return;
  }

  const user = users.find(item => item.email === email && item.password === password);
  if (!user) {
    setMessage("Correo o contraseña incorrectos. Si no tienes cuenta, selecciona Crear cuenta.");
    return;
  }

  localStorage.setItem("cafeteriaLosTresIngSession", JSON.stringify({
    fullName: user.fullName,
    email: user.email
  }));
  setMessage("¡Bienvenido! Entrando a la cafetería...", true);
  setTimeout(() => window.location.href = "home.html", 500);
});

document.getElementById("forgotLink").addEventListener("click", event => {
  event.preventDefault();
  setMessage("Si olvidaste tu contraseña, en esta demostración puedes crear otra cuenta con un correo diferente.");
});

// If a customer is already signed in, take them to the menu.
if (localStorage.getItem("cafeteriaLosTresIngSession")) {
  window.location.href = "home.html";
}
