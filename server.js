const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();
const port = 8888;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const dbConfig = {
  host: "localhost",
  user: "u82413",
  password: "2483755",
  database: "u82413",
};

function validateFullName(name) {
  if (!name || name.trim() === "") return "ФИО не может быть пустым";
  if (name.length > 150) return "ФИО не должно превышать 150 символов";
  if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/u.test(name)) {
    return "ФИО должно содержать только буквы, пробелы и дефисы";
  }
  return null;
}

function validatePhone(phone) {
  if (!phone) return "Телефон не может быть пустым";
  if (!/^[\d\s+()-]{5,20}$/.test(phone)) {
    return "Телефон может содержать только цифры, пробелы, +, -, (, ) (от 5 до 20 символов)";
  }
  return null;
}

function validateEmail(email) {
  if (!email) return "Email не может быть пустым";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email))
    return "Введите корректный email (например, name@domain.ru)";
  return null;
}

function validateBirthDate(dateStr) {
  if (!dateStr) return "Дата рождения не может быть пустой";
  const date = new Date(dateStr);
  if (isNaN(date.getTime()))
    return "Некорректная дата. Используйте формат ГГГГ-ММ-ДД";
  if (date > new Date()) return "Дата не может быть в будущем";
  return null;
}

function validateGender(gender) {
  const allowed = ["male", "female"];
  if (!gender || !allowed.includes(gender)) {
    return "Выберите пол: Мужской или Женский";
  }
  return null;
}

function validateLanguages(langs) {
  const allowed = [
    "Pascal",
    "C",
    "C++",
    "JavaScript",
    "PHP",
    "Python",
    "Java",
    "Haskel",
    "Clojure",
    "Prolog",
    "Scala",
    "Go",
  ];
  if (!langs || langs.length === 0) return "Выберите хотя бы один язык";
  const languages = Array.isArray(langs) ? langs : [langs];
  for (let lang of languages) {
    if (!allowed.includes(lang)) {
      return `Язык "${lang}" недопустим. Допустимые языки: ${allowed.join(", ")}`;
    }
  }
  return null;
}

function validateBiography(bio) {
  if (bio && bio.length > 5000)
    return "Биография не должна превышать 5000 символов";
  return null;
}

function validateContract(contract) {
  if (!contract || (contract !== "on" && contract !== "1")) {
    return "Необходимо отметить, что вы ознакомлены с контрактом";
  }
  return null;
}

function renderForm(data = {}, errors = {}) {
  const fullName = data.full_name || "";
  const phone = data.phone || "";
  const email = data.email || "";
  const birthDate = data.birth_date || "";
  const gender = data.gender || "";
  const biography = data.biography || "";
  const contract =
    data.contract === "on" || data.contract === "1" || data.contract === true;

  let selectedLangs = data.languages || [];
  if (!Array.isArray(selectedLangs)) selectedLangs = [selectedLangs];

  const allLangs = [
    "Pascal",
    "C",
    "C++",
    "JavaScript",
    "PHP",
    "Python",
    "Java",
    "Haskel",
    "Clojure",
    "Prolog",
    "Scala",
    "Go",
  ];

  const labNotice =
    '<div style="background: #ffd700; padding: 10px; text-align: center; font-weight: bold; border-radius: 5px; margin-bottom: 20px;">Лабораторная работа №4 (работа с cookies)</div>';

  let html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Анкета (lab4)</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .error-message { color: red; font-size: 0.9em; margin-top: 5px; }
        .error-input { border: 2px solid red !important; background-color: #ffe6e6; }
        .lab-notice { background: #ffd700; padding: 10px; text-align: center; font-weight: bold; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="form-card">
        ${labNotice}
        <h1>Анкета</h1>`;

  if (Object.keys(errors).length > 0) {
    html += '<div class="error-list"><ul>';
    for (let field in errors) {
      html += `<li>${errors[field]}</li>`;
    }
    html += "</ul></div>";
  }

  html += `<form method="POST" action="/">
            <label for="full_name">ФИО:</label>
            <input type="text" id="full_name" name="full_name" value="${fullName}" class="${errors.full_name ? "error-input" : ""}" required>
            ${errors.full_name ? `<div class="error-message">${errors.full_name}</div>` : ""}

            <label for="phone">Телефон:</label>
            <input type="tel" id="phone" name="phone" value="${phone}" class="${errors.phone ? "error-input" : ""}" required>
            ${errors.phone ? `<div class="error-message">${errors.phone}</div>` : ""}

            <label for="email">E-mail:</label>
            <input type="email" id="email" name="email" value="${email}" class="${errors.email ? "error-input" : ""}" required>
            ${errors.email ? `<div class="error-message">${errors.email}</div>` : ""}

            <label for="birth_date">Дата рождения:</label>
            <input type="date" id="birth_date" name="birth_date" value="${birthDate}" class="${errors.birth_date ? "error-input" : ""}" required>
            ${errors.birth_date ? `<div class="error-message">${errors.birth_date}</div>` : ""}

            <label>Пол:</label>
            <div class="radio-group">
                <label><input type="radio" name="gender" value="male" ${gender === "male" ? "checked" : ""} required> Мужской</label>
                <label><input type="radio" name="gender" value="female" ${gender === "female" ? "checked" : ""} required> Женский</label>
            </div>
            ${errors.gender ? `<div class="error-message">${errors.gender}</div>` : ""}

            <label>Любимые языки программирования:</label>
            <div class="checkbox-group">`;

  allLangs.forEach((lang) => {
    const checked = selectedLangs.includes(lang) ? "checked" : "";
    html += `<label><input type="checkbox" name="languages[]" value="${lang}" ${checked}> ${lang}</label>`;
  });

  html += `</div>
            ${errors.languages ? `<div class="error-message">${errors.languages}</div>` : ""}

            <label for="biography">Биография:</label>
            <textarea id="biography" name="biography" rows="5" class="${errors.biography ? "error-input" : ""}">${biography}</textarea>
            ${errors.biography ? `<div class="error-message">${errors.biography}</div>` : ""}

            <div class="contract">
                <input type="checkbox" id="contract" name="contract" value="1" ${contract ? "checked" : ""} required>
                <label for="contract">С контрактом ознакомлен(а)</label>
            </div>
            ${errors.contract ? `<div class="error-message">${errors.contract}</div>` : ""}

            <button type="submit">Сохранить</button>
        </form>
    </div>
</body>
</html>`;
  return html;
}

app.get("/", (req, res) => {
  let data = {};
  let errors = {};

  if (req.cookies.formData) {
    try {
      data = JSON.parse(req.cookies.formData);
    } catch (e) {}
  }

  if (req.cookies.formErrors) {
    try {
      errors = JSON.parse(req.cookies.formErrors);
      res.clearCookie("formErrors");
    } catch (e) {}
  }

  res.send(renderForm(data, errors));
});

app.post("/", async (req, res) => {
  const data = req.body;
  const errors = {};

  const nameErr = validateFullName(data.full_name);
  if (nameErr) errors.full_name = nameErr;
  const phoneErr = validatePhone(data.phone);
  if (phoneErr) errors.phone = phoneErr;
  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;
  const birthErr = validateBirthDate(data.birth_date);
  if (birthErr) errors.birth_date = birthErr;
  const genderErr = validateGender(data.gender);
  if (genderErr) errors.gender = genderErr;
  const langErr = validateLanguages(data.languages);
  if (langErr) errors.languages = langErr;
  const bioErr = validateBiography(data.biography);
  if (bioErr) errors.biography = bioErr;
  const contractErr = validateContract(data.contract);
  if (contractErr) errors.contract = contractErr;

  if (Object.keys(errors).length > 0) {
    // Сохраняем введённые данные и ошибки в куки (на 1 час)
    res.cookie("formData", JSON.stringify(data), { maxAge: 3600000 });
    res.cookie("formErrors", JSON.stringify(errors), { maxAge: 3600000 });
    return res.redirect("/");
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO submissions (full_name, phone, email, birth_date, gender, biography, contract_accepted)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.full_name,
        data.phone,
        data.email,
        data.birth_date,
        data.gender,
        data.biography || null,
        data.contract ? 1 : 0,
      ],
    );

    const languages = Array.isArray(data.languages)
      ? data.languages
      : [data.languages];
    for (let lang of languages) {
      await connection.execute(
        "INSERT INTO submission_languages (submission_id, language) VALUES (?, ?)",
        [result.insertId, lang],
      );
    }

    await connection.commit();

    res.cookie("formData", JSON.stringify(data), {
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    res.clearCookie("formErrors");
    res.redirect("/");
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    errors.database = "Ошибка базы данных, попробуйте позже.";
    res.cookie("formData", JSON.stringify(data), { maxAge: 3600000 });
    res.cookie("formErrors", JSON.stringify(errors), { maxAge: 3600000 });
    res.redirect("/");
  } finally {
    if (connection) await connection.end();
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
