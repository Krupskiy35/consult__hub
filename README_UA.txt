CONSULT HUB UNIFIED — структура для подальшої розробки

Services/services.html — сторінка послуг
Services/services.css — тільки стилі Services
Services/particles_services.js — анімація Services
Ukraine_Desk/ukraine-desk.html — сторінка Ukraine Desk
Ukraine_Desk/ukraine-desk.css — тільки стилі Ukraine Desk
Ukraine_Desk/particles_logo.js — анімація логотипа
css/style.css — загальні стилі
js/main.js і js/flow_inner.js — загальні скрипти
assets/ — спільні зображення і PDF

ВІДКРИТТЯ: запустіть локальний сервер з папки Consult_Hub_Unified:
python -m http.server 8000
http://localhost:8000/Services/services.html
http://localhost:8000/Ukraine_Desk/ukraine-desk.html

Головна index.html не включена, оскільки її не надавали. Посилання на неї запрацюють після додавання index.html до кореня.

У загальному style.css існують посилання на project.png і services.png, яких немає в архіві. Це не нова помилка перепакування.

Усі шляхи HTML, CSS і анімації скориговані відповідно до нової структури. Дизайн та правила стилів не змінювалися.
