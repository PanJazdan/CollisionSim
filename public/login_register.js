
// Zmienna do przechowywania stanu logowania
let isLoggedIn = false;
let historyShown = false;
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginButton = document.getElementById("logging");
const registerButton = document.getElementById("register");
const logoutButton = document.getElementById("logout");
const loginError = document.getElementById("loginError");
const registerError = document.getElementById("registerError");

document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");

    if (token) {
        fetch("http://pascal.fis.agh.edu.pl:4003/verify-token", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                isLoggedIn = true;
                document.getElementById("afterLogin").style.display = "inline-block";
                document.getElementById("log_reg_btn").style.display = "none";
                document.getElementById("info").textContent = "Zalogowano"
            } else {
                localStorage.removeItem("token");
                localStorage.removeItem("userLogin");
            }
        })
        .catch(error => {
            console.error("Błąd weryfikacji tokena:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("userLogin");
        });
    }
});



// Przełączanie formularzy po kliknięciu przycisków
loginButton.addEventListener("click", () => {
    historyShown = false;
    loginForm.style.display = "block";
    registerForm.style.display = "none";
});

registerButton.addEventListener("click", () => {
    historyShown = false;
    registerForm.style.display = "block";
    loginForm.style.display = "none";
});

// Funkcja logowania
document.getElementById("loginFormData").addEventListener("submit", function(event) {
    event.preventDefault();
    const login = document.getElementById("login_log").value;
    const password = document.getElementById("password_log").value;

    // Prosta walidacja
    if (login === "" || password === "") {
        loginError.textContent = "Proszę wypełnić wszystkie pola!";
        return;
    }

    // Wyślij dane do backendu
    fetch('http://pascal.fis.agh.edu.pl:4003/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login: login, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            // Zalogowano pomyślnie
            isLoggedIn = true;
            document.getElementById("info").textContent = "Zalogowano pomyślnie!";
            // Możesz zapisać token w localStorage
            loginForm.style.display = "none";
            loginError.textContent = ""; 
            localStorage.setItem("userLogin", login);
            localStorage.setItem('token', data.token);
            document.getElementById("afterLogin").style.display = "inline-block";
            document.getElementById("log_reg_btn").style.display = "none";
            document.getElementById("login_log").value = "";
            document.getElementById("password_log").value = "";
        } else {
            loginError.textContent = "Niepoprawny login lub hasło!";
        }
    })
    .catch(error => {
        loginError.textContent = "Błąd logowania, spróbuj ponownie!";
        console.error("Błąd logowania:", error);
    });
});


// Funkcja rejestracji
document.getElementById("registerFormData").addEventListener("submit", function(event) {
    event.preventDefault();


    const login = document.getElementById("login_reg").value;
    const password = document.getElementById("password_reg").value;

    // Prosta walidacja
    if (login === "" || password === "") {
        registerError.textContent = "Proszę wypełnić wszystkie pola!";
        return;
    }

    // Wysyłanie danych do serwera
    fetch("http://pascal.fis.agh.edu.pl:4003/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Rejestracja zakończona sukcesem!") {
            document.getElementById("info").textContent = data.message;
            registerForm.style.display = "none";
            document.getElementById("login_reg").value = "";
            document.getElementById("password_reg").value = ""; 
            document.getElementById("user_reg").value = ""; // Ukrywamy formularz tylko w przypadku sukcesu
        } else {
            registerError.textContent = data.message; // Wyświetlenie błędu pod formularzem
        }
    })
    .catch(error => {
        console.error("Błąd rejestracji:", error);
        registerError.textContent = "Wystąpił błąd, spróbuj ponownie!";
    });
});



document.getElementById("startSimulation").addEventListener("click", function () {
    const userLogin = localStorage.getItem("userLogin"); // Pobierz login użytkownika (trzeba go wcześniej zapisać przy logowaniu)
    historyShown = false;
    if (!userLogin) {
        // alert("Musisz się zalogować, aby zapisać dane!");
        return;
    }

    const animationData = {
        userLogin: userLogin,
        mass1: document.getElementById("mass1").value,
        r1: document.getElementById("r1").value,
        speedX1: document.getElementById("speedX1").value,
        speedY1: document.getElementById("speedY1").value,
        mass2: document.getElementById("mass2").value,
        r2: document.getElementById("r2").value,
        speedX2: document.getElementById("speedX2").value,
        speedY2: document.getElementById("speedY2").value,
        energyLoss: document.getElementById("energy_loss").value
    };

    fetch("http://pascal.fis.agh.edu.pl:4003/save-animation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(animationData)
    })
    
    .then(response => response.json())
    .then(data => {
        // alert(data.message);
        document.getElementById("info").textContent = data.message;
    })
    .catch(error => {
        console.error("Błąd zapisu animacji:", error);
    });
});


document.getElementById("showHistory").addEventListener("click", function () {
    const userLogin = localStorage.getItem("userLogin");
    if(historyShown){
        historyShown = false;
    }else{
        historyShown = true;
    }

    if (!userLogin) {
        alert("Musisz się zalogować, aby zobaczyć historię!");
        return;
    }

    fetch(`http://pascal.fis.agh.edu.pl:4003/animation-history/${userLogin}`)
        .then(response => response.json())
        .then(data => {
            const infoElement = document.getElementById("info");

            if (data.length === 0) {
                infoElement.textContent = "Brak zapisanych animacji.";
                return;
            }

            // Tworzenie tabeli
            let tableHTML = `
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            <th>Masa 1</th>
                            <th>Promień 1</th>
                            <th>Prędkość X1</th>
                            <th>Prędkość Y1</th>
                            <th>Masa 2</th>
                            <th>Promień 2</th>
                            <th>Prędkość X2</th>
                            <th>Prędkość Y2</th>
                            <th>Utrata energii (%)</th>
                            <th>Data zapisu</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            // Dodaj wiersze do tabeli na podstawie danych
            data.forEach(anim => {
                tableHTML += `
                    <tr>
                        <td>${anim.mass1}</td>
                        <td>${anim.r1}</td>
                        <td>${anim.speedX1}</td>
                        <td>${anim.speedY1}</td>
                        <td>${anim.mass2}</td>
                        <td>${anim.r2}</td>
                        <td>${anim.speedX2}</td>
                        <td>${anim.speedY2}</td>
                        <td>${anim.energyLoss}</td>
                        <td>${new Date(anim.createdAt).toLocaleString()}</td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            // Wyświetlenie tabeli w elemencie #info
            if(historyShown){
                infoElement.innerHTML = tableHTML;
            }
            else{
                infoElement.innerHTML = "";
            }
        })
        .catch(error => {
            console.error("Błąd pobierania historii:", error);
            document.getElementById("info").textContent = "Wystąpił błąd.";
        });
});





// Funkcja wylogowania
logoutButton.addEventListener("click", function() {
    isLoggedIn = false;
    localStorage.removeItem("userLogin");
    localStorage.removeItem("token");
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    document.getElementById("afterLogin").style.display = "none";
    document.getElementById("log_reg_btn").style.display = "block";
    document.getElementById("info").textContent = "Wylogowano pomyślnie!";
});
