const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");


const app = express();
const PORT = 4003;
const SECRET = "supersecretkey";
const MONGO_URI = "mongodb://172.20.44.25:27017/2pazdan";  // Podaj bazę 'dbase' do połączenia
const dbUser = "2pazdan";  // Użytkownik z uprawnieniami
const dbPassword = "pass2pazdan";  // Hasło użytkownika

app.use(express.json()); // Middleware do przetwarzania JSON
app.use(bodyParser.json()); // Możesz to zostawić dla starszych wersji Express

// Połączenie z MongoDB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: '2pazdan',  // Źródło autentykacji to baza '2pazdan'
    user: dbUser,           // Użytkownik, który ma dostęp
    pass: dbPassword        // Hasło użytkownika
}).then(() => {
    console.log("Połączono z MongoDB");
}).catch(err => {
    console.error("Błąd połączenia z MongoDB", err);
});

app.use(express.static(path.join(__dirname, "public")));

// Jeśli użytkownik otworzy stronę główną, przekieruj na index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Schemat użytkownika
const UserSchema = new mongoose.Schema({
    login: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model("User", UserSchema);

const AnimationSchema = new mongoose.Schema({
    userLogin: { type: String, required: true }, // Login użytkownika
    mass1: { type: Number, required: true },
    r1: { type: Number, required: true },
    speedX1: { type: Number, required: true },
    speedY1: { type: Number, required: true },
    mass2: { type: Number, required: true },
    r2: { type: Number, required: true },
    speedX2: { type: Number, required: true },
    speedY2: { type: Number, required: true },
    energyLoss: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Animation = mongoose.model("Animation", AnimationSchema);


const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: "Brak tokena, dostęp zabroniony!" });
    }

    jwt.verify(token.split(' ')[1], SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Nieprawidłowy token!" });
        }
        req.user = user;
        next();
    });
};


// Rejestracja użytkownika
app.post("/register", async (req, res) => {
    const { login, password } = req.body;

    const existingUser = await User.findOne({ login });
    if (existingUser) {
        return res.status(500).json({ message: "Użytkownik o tym loginie już istnieje!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ login, password: hashedPassword });

    try {
        await user.save();
        res.status(201).json({ message: "Rejestracja zakończona sukcesem!" });
        // document.getElementById("registerForm").style.display="none";
    } catch (error) {
        res.status(500).json({ message: "Błąd rejestracji", error });
    }
});

// Logowanie użytkownika
app.post("/login", async (req, res) => {
    const { login, password } = req.body;

    const user = await User.findOne({ login });
    if (!user) {
        return res.status(400).json({ message: "Nie znaleziono użytkownika" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Niepoprawne hasło" });
    }

    const token = jwt.sign({  login: user.login }, SECRET, { expiresIn: "1h" });
    res.json({ token });
});


app.post("/save-animation", authenticateToken, async (req, res) => {
    const { mass1, r1, speedX1, speedY1, mass2, r2, speedX2, speedY2, energyLoss } = req.body;
    const userLogin = req.user.login; // Pobieramy login z tokena zamiast z requesta

    try {
        const animation = new Animation({ userLogin, mass1, r1, speedX1, speedY1, mass2, r2, speedX2, speedY2, energyLoss });
        await animation.save();
        res.status(201).json({ message: "Parametry animacji zapisane!" });
    } catch (error) {
        res.status(500).json({ message: "Błąd zapisu do bazy", error });
    }
});


app.get("/animation-history/:userLogin", async (req, res) => {
    const { userLogin } = req.params;

    if (!userLogin) {
        return res.status(400).json({ message: "Brak użytkownika" });
    }

    try { 
        const animations = await Animation.find({ userLogin }).sort({ createdAt: -1 }); // Sortowanie od najnowszych
        res.status(200).json(animations);
    } catch (error) {
        res.status(500).json({ message: "Błąd pobierania historii animacji", error });
    }
});

app.get("/verify-token", authenticateToken, (req, res) => {
    res.json({ valid: true});
});




app.listen(PORT, () => console.log(`Serwer działa na http://pascal.fis.agh.edu.pl:${PORT}`));