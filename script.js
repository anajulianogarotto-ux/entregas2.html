/* =========================================================
   LOGIBUILD
   Sistema de gestão de entregas
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const USERS = {
    funcionario: {
        password: "123",
        role: "employee",
        name: "Funcionário"
    },

    admin: {
        password: "123456",
        role: "admin",
        name: "Administrador"
    }
};


const STORAGE_KEY = "logibuild_deliveries";

const SESSION_KEY = "logibuild_session";


const START_HOUR = 7;
const START_MINUTE = 30;

const END_HOUR = 16;
const END_MINUTE = 30;

const SLOT_MINUTES = 30;


/* =========================================================
   ESTADO DA APLICAÇÃO
========================================================= */

let currentUser = null;

let currentWeekStart = getMonday(new Date());

let selectedDelivery = null;


/* =========================================================
   ELEMENTOS
========================================================= */

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const branchInput = document.getElementById("branch");

const loggedUser = document.getElementById("loggedUser");
const loggedRole = document.getElementById("loggedRole");

const logoutButton = document.getElementById("logoutButton");

const calendarGrid = document.getElementById("calendarGrid");

const weekTitle = document.getElementById("weekTitle");

const weekSubtitle = document.getElementById("weekSubtitle");

const previousWeek = document.getElementById("previousWeek");
const nextWeek = document.getElementById("nextWeek");

const todayButton = document.getElementById("todayButton");

const addDeliveryButton =
    document.getElementById("addDeliveryButton");

const deliveryModal =
    document.getElementById("deliveryModal");

const detailsModal =
    document.getElementById("detailsModal");

const closeModal =
    document.getElementById("closeModal");

const cancelModal =
    document.getElementById("cancelModal");

const closeDetails =
    document.getElementById("closeDetails");

const deliveryForm =
    document.getElementById("deliveryForm");

const deliveryId =
    document.getElementById("deliveryId");

const deliveryDate =
    document.getElementById("deliveryDate");

const departureTime =
    document.getElementById("departureTime");

const returnTime =
    document.getElementById("returnTime");

const vehicle =
    document.getElementById("vehicle");

const clients =
    document.getElementById("clients");

const material =
    document.getElementById("material");

const deliveryStatus =
    document.getElementById("deliveryStatus");

const formError =
    document.getElementById("formError");

const deliveryDetails =
    document.getElementById("deliveryDetails");

const detailsTitle =
    document.getElementById("detailsTitle");

const summaryDeliveries =
    document.getElementById("summaryDeliveries");

const summaryInRoute =
    document.getElementById("summaryInRoute");

const summaryCompleted =
    document.getElementById("summaryCompleted");

const summaryClients =
    document.getElementById("summaryClients");

const summaryList =
    document.getElementById("summaryList");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const sidebar =
    document.getElementById("sidebar");


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    populateTimeSelects();

    populateDateSelect();

    loadSession();

    setupEvents();

});


/* =========================================================
   EVENTOS
========================================================= */

function setupEvents() {

    loginForm.addEventListener(
        "submit",
        handleLogin
    );


    logoutButton.addEventListener(
        "click",
        logout
    );


    previousWeek.addEventListener(
        "click",
        () => changeWeek(-1)
    );


    nextWeek.addEventListener(
        "click",
        () => changeWeek(1)
    );


    todayButton.addEventListener(
        "click",
        goToCurrentWeek
    );


    addDeliveryButton.addEventListener(
        "click",
        () => openDeliveryModal()
    );


    closeModal.addEventListener(
        "click",
        closeDeliveryModal
    );


    cancelModal.addEventListener(
        "click",
        closeDeliveryModal
    );


    closeDetails.addEventListener(
        "click",
        closeDetailsModal
    );


    deliveryForm.addEventListener(
        "submit",
        saveDelivery
    );


    mobileMenuButton.addEventListener(
        "click",
        () => {
            sidebar.classList.toggle("open");
        }
    );


    document.querySelectorAll(".nav-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    switchSection(
                        button.dataset.section
                    );

                    sidebar.classList.remove("open");
                }
            );

        });


    document.querySelectorAll(".modal-overlay")
        .forEach(overlay => {

            overlay.addEventListener(
                "click",
                () => {

                    deliveryModal.classList.add("hidden");

                    detailsModal.classList.add("hidden");

                }
            );

        });

}


/* =========================================================
   LOGIN
========================================================= */

function handleLogin(event) {

    event.preventDefault();

    const username =
        usernameInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;

    const branch =
        branchInput.value;


    loginError.classList.remove("show");

    loginError.textContent = "";


    if (branch !== "1") {

        showLoginError(
            "Apenas a Filial 1 está disponível."
        );

        return;
    }


    const user = USERS[username];


    if (!user || user.password !== password) {

        showLoginError(
            "Login ou senha incorretos."
        );

        return;
    }


    currentUser = {
        username,
        role: user.role,
        name: user.name,
        branch: 1
    };


    sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(currentUser)
    );


    showApplication();

}


function showLoginError(message) {

    loginError.textContent = message;

    loginError.classList.add("show");

}


function loadSession() {

    const savedSession =
        sessionStorage.getItem(SESSION_KEY);


    if (!savedSession) {

        showLogin();

        return;
    }


    try {

        currentUser =
            JSON.parse(savedSession);

        showApplication();

    } catch {

        sessionStorage.removeItem(
            SESSION_KEY
        );

        showLogin();

    }

}


/* =========================================================
   MOSTRAR SISTEMA
========================================================= */

function showApplication() {

    loginPage.classList.add("hidden");

    appPage.classList.remove("hidden");


    loggedUser.textContent =
        currentUser.name;

    loggedRole.textContent =
        currentUser.role === "admin"
            ? "Administrador"
            : "Funcionário";


    applyPermissions();

    renderCalendar();

    updateSummary();

}


function showLogin() {

    loginPage.classList.remove("hidden");

    appPage.classList.add("hidden");

}


function logout() {

    sessionStorage.removeItem(
        SESSION_KEY
    );

    currentUser = null;

    loginForm.reset();

    showLogin();

}


/* =========================================================
   PERMISSÕES
========================================================= */

function applyPermissions() {

    const adminElements =
        document.querySelectorAll(".admin-only");


    adminElements.forEach(element => {

        if (currentUser.role === "admin") {

            element.classList.remove("hidden");

        } else {

            element.classList.add("hidden");

        }

    });

}


/* =========================================================
   CALENDÁRIO
========================================================= */

function renderCalendar() {

    const days = getWeekDays(
        currentWeekStart
    );


    updateWeekTitle(days);


    calendarGrid.innerHTML = "";


    /* Cabeçalho da coluna de horário */

    const timeHeader =
        document.createElement("div");

    timeHeader.className =
        "calendar-header time-header";

    timeHeader.textContent =
        "HORÁRIO";

    calendarGrid.appendChild(
        timeHeader
    );


    /* Cabeçalho dos dias */

    days.forEach(day => {

        const header =
            document.createElement("div");

        header.className =
            "calendar-header";


        if (isToday(day)) {

            header.classList.add("today");

        }


        header.innerHTML = `
            <span class="day-name">
                ${getDayName(day)}
            </span>

            <span class="day-number">
                ${String(day.getDate()).padStart(2, "0")}
            </span>
        `;


        calendarGrid.appendChild(header);

    });


    /* Coluna de horários */

    const timeColumn =
        document.createElement("div");

    timeColumn.className =
        "time-column";


    const times =
        generateTimeSlots();


    times.forEach(time => {

        const label =
            document.createElement("div");

        label.className =
            "time-label";

        label.textContent =
            time;

        timeColumn.appendChild(label);

    });


    calendarGrid.appendChild(
        timeColumn
    );


    /* Colunas dos dias */

    days.forEach(day => {

        const column =
            document.createElement("div");

        column.className =
            "calendar-column";


        const dayDate =
            formatDateISO(day);


        const deliveries =
            getDeliveries().filter(
                delivery =>
                    delivery.date === dayDate
            );


        deliveries.forEach(
            delivery => {

                const card =
                    createDeliveryCard(
                        delivery
                    );

                column.appendChild(card);

            }
        );


        calendarGrid.appendChild(
            column
        );

    });


    drawCurrentTimeLine();

}


/* =========================================================
   TÍTULO DA SEMANA
========================================================= */

function updateWeekTitle(days) {

    const first = days[0];
    const last = days[5];


    const firstText =
        formatShortDate(first);

    const lastText =
        formatShortDate(last);


    weekTitle.textContent =
        `${firstText} — ${lastText}`;


    weekSubtitle.textContent =
        "Segunda a sábado • 07:30 às 16:30";

}


/* =========================================================
   CRIAR CARD DE ENTREGA
========================================================= */

function createDeliveryCard(delivery) {

    const card =
        document.createElement("div");


    card.className =
        "delivery-card";


    card.classList.add(
        `status-${delivery.status}`
    );


    const top =
        timeToMinutes(
            delivery.departure
        );


    const bottom =
        timeToMinutes(
            delivery.return
        );


    const calendarStart =
        START_HOUR * 60 + START_MINUTE;


    const topOffset =
        top - calendarStart;


    const duration =
        bottom - top;


    const pixelsPerMinute =
        60 / 60;


    card.style.top =
        `${topOffset * pixelsPerMinute}px`;


    card.style.height =
        `${Math.max(
            duration * pixelsPerMinute,
            48
        )}px`;


    const clientList =
        delivery.clients
            .split(",")
            .map(client => client.trim())
            .filter(Boolean);


    const clientText =
        clientList.length > 1
            ? `${clientList[0]} +${clientList.length - 1}`
            : clientList[0];


    card.innerHTML = `

        <div class="delivery-time">
            ${delivery.departure} → ${delivery.return}
        </div>

        <div class="delivery-client">
            ${escapeHTML(clientText || "Cliente")}
        </div>

        <div class="delivery-vehicle">
            🚚 ${escapeHTML(delivery.vehicle)}
        </div>

        ${
            delivery.material
                ? `
                    <div class="delivery-material">
                        ${escapeHTML(
                            delivery.material
                        )}
                    </div>
                `
                : ""
        }

        ${
            currentUser.role === "admin"
                ? `
                    <div class="delivery-actions">

                        <button
                            class="delivery-action"
                            data-action="edit"
                            title="Editar"
                        >
                            ✎
                        </button>

                        <button
                            class="delivery-action delete"
                            data-action="delete"
                            title="Excluir"
                        >
                            ×
                        </button>

                    </div>
                `
                : ""
        }
    `;


    card.addEventListener(
        "click",
        event => {

            const action =
                event.target.dataset.action;


            if (action === "edit") {

                event.stopPropagation();

                openDeliveryModal(
                    delivery.id
                );

                return;
            }


            if (action === "delete") {

                event.stopPropagation();

                deleteDelivery(
                    delivery.id
                );

                return;
            }


            openDetailsModal(
                delivery
            );

        }
    );


    return card;

}


/* =========================================================
   LINHA DO HORÁRIO ATUAL
========================================================= */

function drawCurrentTimeLine() {

    document
        .querySelectorAll(
            ".current-time-line"
        )
        .forEach(line => line.remove());


    const now =
        new Date();


    const dayIndex =
        getDayIndexMondaySaturday(now);


    if (dayIndex < 0 || dayIndex > 5) {

        return;

    }


    if (
        !isSameWeek(
            now,
            currentWeekStart
        )
    ) {

        return;

    }


    const minutes =
        now.getHours() * 60 +
        now.getMinutes();


    const start =
        START_HOUR * 60 +
        START_MINUTE;


    const end =
        END_HOUR * 60 +
        END_MINUTE;


    if (
        minutes < start ||
        minutes > end
    ) {

        return;

    }


    const offset =
        minutes - start;


    const line =
        document.createElement("div");


    line.className =
        "current-time-line";


    line.style.top =
        `${offset}px`;


    const columns =
        document.querySelectorAll(
            ".calendar-column"
        );


    if (columns[dayIndex]) {

        columns[dayIndex]
            .appendChild(line);

    }

}


/* =========================================================
   SEMANA
========================================================= */

function changeWeek(amount) {

    currentWeekStart =
        new Date(
            currentWeekStart
        );


    currentWeekStart.setDate(
        currentWeekStart.getDate()
        + amount * 7
    );


    renderCalendar();

}


function goToCurrentWeek() {

    currentWeekStart =
        getMonday(
            new Date()
        );


    renderCalendar();

}


/* =========================================================
   MODAL DE ENTREGA
========================================================= */

function openDeliveryModal(id = null) {

    if (currentUser.role !== "admin") {

        alert(
            "Somente administradores podem programar entregas."
        );

        return;
    }


    clearFormError();

    deliveryForm.reset();

    deliveryId.value = "";


    populateDateSelect();


    if (id) {

        const delivery =
            getDeliveries()
                .find(
                    item =>
                        item.id === id
                );


        if (!delivery) return;


        document.getElementById(
            "modalTitle"
        ).textContent =
            "Editar entrega";


        deliveryId.value =
            delivery.id;

        deliveryDate.value =
            delivery.date;

        departureTime.value =
            delivery.departure;

        returnTime.value =
            delivery.return;

        vehicle.value =
            delivery.vehicle;

        clients.value =
            delivery.clients;

        material.value =
            delivery.material || "";

        deliveryStatus.value =
            delivery.status;

    } else {

        document.getElementById(
            "modalTitle"
        ).textContent =
            "Nova entrega";


        const today =
            new Date();


        const dayIndex =
            getDayIndexMondaySaturday(
                today
            );


        if (
            dayIndex >= 0 &&
            dayIndex <= 5
        ) {

            deliveryDate.value =
                formatDateISO(today);

        }

    }


    deliveryModal.classList.remove(
        "hidden"
    );

}


function closeDeliveryModal() {

    deliveryModal.classList.add(
        "hidden"
    );

}


/* =========================================================
   SALVAR ENTREGA
========================================================= */

function saveDelivery(event) {

    event.preventDefault();


    if (currentUser.role !== "admin") {

        return;

    }


    clearFormError();


    const id =
        deliveryId.value ||
        createId();


    const date =
        deliveryDate.value;

    const departure =
        departureTime.value;

    const returnTimeValue =
        returnTime.value;

    const vehicleValue =
        vehicle.value.trim();

    const clientsValue =
        clients.value.trim();

    const materialValue =
        material.value.trim();

    const status =
        deliveryStatus.value;


    if (!date ||
        !departure ||
        !returnTimeValue ||
        !vehicleValue ||
        !clientsValue
    ) {

        showFormError(
            "Preencha todos os campos obrigatórios."
        );

        return;

    }


    if (
        timeToMinutes(returnTimeValue)
        <=
        timeToMinutes(departure)
    ) {

        showFormError(
            "O horário de retorno deve ser depois da saída."
        );

        return;

    }


    if (
        timeToMinutes(departure)
        <
        START_HOUR * 60 +
        START_MINUTE
        ||
        timeToMinutes(departure)
        >
        END_HOUR * 60 +
        END_MINUTE
    ) {

        showFormError(
            "A saída deve estar entre 07:30 e 16:30."
        );

        return;

    }


    if (
        timeToMinutes(returnTimeValue)
        >
        END_HOUR * 60 +
        END_MINUTE
    ) {

        showFormError(
            "O retorno deve ser até 16:30."
        );

        return;

    }


    const deliveries =
        getDeliveries();


    const existingIndex =
        deliveries.findIndex(
            item =>
                item.id === id
        );


    const delivery = {

        id,

        date,

        departure,

        return: returnTimeValue,

        vehicle: vehicleValue,

        clients: clientsValue,

        material: materialValue,

        status,

        createdAt:
            existingIndex >= 0
                ? deliveries[existingIndex].createdAt
                : new Date().toISOString()

    };


    if (existingIndex >= 0) {

        deliveries[existingIndex] =
            delivery;

    } else {

        deliveries.push(
            delivery
        );

    }


    saveDeliveries(
        deliveries
    );


    closeDeliveryModal();


    renderCalendar();

    updateSummary();

}


/* =========================================================
   EXCLUIR ENTREGA
========================================================= */

function deleteDelivery(id) {

    if (currentUser.role !== "admin") {

        return;

    }


    const delivery =
        getDeliveries()
            .find(
                item =>
                    item.id === id
            );


    if (!delivery) return;


    const confirmation =
        confirm(
            `Excluir a entrega de ${delivery.clients}?`
        );


    if (!confirmation) {

        return;

    }


    const deliveries =
        getDeliveries()
            .filter(
                item =>
                    item.id !== id
            );


    saveDeliveries(
        deliveries
    );


    renderCalendar();

    updateSummary();

}


/* =========================================================
   DETALHES DA ENTREGA
========================================================= */

function openDetailsModal(delivery) {

    selectedDelivery =
        delivery;


    detailsTitle.textContent =
        "Detalhes da entrega";


    const statusLabels = {

        scheduled: "Programada",

        returning: "Em rota",

        completed: "Concluída"

    };


    const status =
        statusLabels[
            delivery.status
        ] || "Programada";


    const date =
        parseISODate(
            delivery.date
        );


    deliveryDetails.innerHTML = `

        <div class="details-content">

            <div class="detail-main">

                <div class="detail-client">
                    ${escapeHTML(
                        delivery.clients
                    )}
                </div>

                <div class="detail-time">
                    ${formatLongDate(date)}
                    •
                    ${delivery.departure}
                    → ${delivery.return}
                </div>

            </div>


            <div class="detail-grid">

                <div class="detail-box">
                    <span>Veículo</span>
                    <strong>
                        ${escapeHTML(
                            delivery.vehicle
                        )}
                    </strong>
                </div>


                <div class="detail-box">
                    <span>Status</span>
                    <strong>
                        ${status}
                    </strong>
                </div>


                <div class="detail-box">
                    <span>Material</span>
                    <strong>
                        ${
                            escapeHTML(
                                delivery.material ||
                                "Não informado"
                            )
                        }
                    </strong>
                </div>


                <div class="detail-box">
                    <span>Filial</span>
                    <strong>
                        Filial 1
                    </strong>
                </div>

            </div>


            ${
                currentUser.role === "admin"
                    ? `
                        <div class="detail-admin-actions">

                            <button
                                class="btn-secondary"
                                onclick="editSelectedDelivery()"
                            >
                                Editar
                            </button>

                            <button
                                class="btn-danger"
                                onclick="deleteSelectedDelivery()"
                            >
                                Excluir
                            </button>

                        </div>
                    `
                    : ""
            }

        </div>

    `;


    detailsModal.classList.remove(
        "hidden"
    );

}


function closeDetailsModal() {

    detailsModal.classList.add(
        "hidden"
    );

    selectedDelivery = null;

}


function editSelectedDelivery() {

    if (!selectedDelivery) return;


    closeDetailsModal();


    openDeliveryModal(
        selectedDelivery.id
    );

}


function deleteSelectedDelivery() {

    if (!selectedDelivery) return;


    const id =
        selectedDelivery.id;


    closeDetailsModal();


    deleteDelivery(id);

}


/* =========================================================
   RESUMO
========================================================= */

function updateSummary() {

    const deliveries =
        getDeliveries();


    summaryDeliveries.textContent =
        deliveries.length;


    summaryInRoute.textContent =
        deliveries.filter(
            item =>
                item.status === "returning"
        ).length;


    summaryCompleted.textContent =
        deliveries.filter(
            item =>
                item.status === "completed"
        ).length;


    const clientSet =
        new Set();


    deliveries.forEach(
        delivery => {

            delivery.clients
                .split(",")
                .map(
                    client =>
                        client.trim()
                )
                .filter(Boolean)
                .forEach(
                    client =>
                        clientSet.add(
                            client.toLowerCase()
                        )
                );

        }
    );


    summaryClients.textContent =
        clientSet.size;


    renderSummaryList(
        deliveries
    );

}


function renderSummaryList(
    deliveries
) {

    summaryList.innerHTML = "";


    const sorted =
        [...deliveries]
            .sort(
                (a, b) =>
                    (
                        `${a.date} ${a.departure}`
                    ).localeCompare(
                        `${b.date} ${b.departure}`
                    )
            )
            .slice(0, 12);


    if (!sorted.length) {

        summaryList.innerHTML = `
            <div class="empty-state">
                Nenhuma entrega cadastrada.
            </div>
        `;

        return;

    }


    const statusLabels = {

        scheduled: "Programada",

        returning: "Em rota",

        completed: "Concluída"

    };


    sorted.forEach(
        delivery => {

            const date =
                parseISODate(
                    delivery.date
                );


            const item =
                document.createElement("div");


            item.className =
                "summary-item";


            item.innerHTML = `

                <div class="summary-item-date">
                    ${formatShortDate(date)}
                </div>

                <div class="summary-item-client">
                    ${escapeHTML(
                        delivery.clients
                    )}
                </div>

                <div class="summary-item-time">
                    ${delivery.departure}
                    →
                    ${delivery.return}
                </div>

                <span class="status-badge ${delivery.status}">
                    ${
                        statusLabels[
                            delivery.status
                        ]
                    }
                </span>

            `;


            item.addEventListener(
                "click",
                () =>
                    openDetailsModal(
                        delivery
                    )
            );


            item.style.cursor =
                "pointer";


            summaryList.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   SEÇÕES
========================================================= */

function switchSection(
    sectionId
) {

    document
        .querySelectorAll(
            ".content-section"
        )
        .forEach(
            section =>
                section.classList.add(
                    "hidden"
                )
        );


    const selected =
        document.getElementById(
            sectionId
        );


    if (selected) {

        selected.classList.remove(
            "hidden"
        );

    }


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                    sectionId
                );

            }
        );


    if (
        sectionId ===
        "summarySection"
    ) {

        updateSummary();

    }

}


/* =========================================================
   SELECT DE HORÁRIOS
========================================================= */

function populateTimeSelects() {

    const slots =
        generateTimeSlots();


    departureTime.innerHTML =
        `<option value="">
            Selecione
        </option>`;


    returnTime.innerHTML =
        `<option value="">
            Selecione
        </option>`;


    slots.forEach(
        time => {

            const option1 =
                document.createElement(
                    "option"
                );

            option1.value = time;

            option1.textContent = time;


            const option2 =
                option1.cloneNode(true);


            departureTime.appendChild(
                option1
            );

            returnTime.appendChild(
                option2
            );

        }
    );

}


function populateDateSelect() {

    deliveryDate.innerHTML = "";


    const days =
        getWeekDays(
            currentWeekStart
        );


    days.forEach(
        day => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                formatDateISO(day);


            option.textContent =
                `${getDayName(day)} — ${formatShortDate(day)}`;


            deliveryDate.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   UTILITÁRIOS DE DATA
========================================================= */

function getMonday(date) {

    const result =
        new Date(date);


    result.setHours(
        0,
        0,
        0,
        0
    );


    const day =
        result.getDay();


    const diff =
        day === 0
            ? -6
            : 1 - day;


    result.setDate(
        result.getDate() + diff
    );


    return result;

}


function getWeekDays(
    monday
) {

    const days = [];


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const day =
            new Date(monday);


        day.setDate(
            monday.getDate() + i
        );


        days.push(day);

    }


    return days;

}


function getDayName(date) {

    const names = [

        "Domingo",

        "Segunda",

        "Terça",

        "Quarta",

        "Quinta",

        "Sexta",

        "Sábado"

    ];


    return names[
        date.getDay()
    ];

}


function getDayIndexMondaySaturday(
    date
) {

    const day =
        date.getDay();


    if (day === 0) return -1;


    return day - 1;

}


function formatDateISO(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function parseISODate(value) {

    const [
        year,
        month,
        day
    ] =
        value.split("-")
            .map(Number);


    return new Date(
        year,
        month - 1,
        day
    );

}


function formatShortDate(date) {

    return `${String(
        date.getDate()
    ).padStart(2, "0")}/${
        String(
            date.getMonth() + 1
        ).padStart(2, "0")
    }`;

}


function formatLongDate(date) {

    return `${getDayName(date)}, ${
        String(
            date.getDate()
        ).padStart(2, "0")
    }/${
        String(
            date.getMonth() + 1
        ).padStart(2, "0")
    }/${
        date.getFullYear()
    }`;

}


function isToday(date) {

    const today =
        new Date();


    return (
        date.getFullYear() ===
            today.getFullYear() &&

        date.getMonth() ===
            today.getMonth() &&

        date.getDate() ===
            today.getDate()
    );

}


function isSameWeek(
    date,
    monday
) {

    const current =
        getMonday(date);


    return (
        formatDateISO(current) ===
        formatDateISO(monday)
    );

}


/* =========================================================
   HORÁRIOS
========================================================= */

function generateTimeSlots() {

    const slots = [];


    let minutes =
        START_HOUR * 60 +
        START_MINUTE;


    const end =
        END_HOUR * 60 +
        END_MINUTE;


    while (
        minutes <= end
    ) {

        const hour =
            Math.floor(
                minutes / 60
            );


        const minute =
            minutes % 60;


        slots.push(
            `${String(hour).padStart(2, "0")}:${
                String(minute).padStart(2, "0")
            }`
        );


        minutes += SLOT_MINUTES;

    }


    return slots;

}


function timeToMinutes(
    time
) {

    const [
        hours,
        minutes
    ] =
        time.split(":")
            .map(Number);


    return (
        hours * 60 +
        minutes
    );

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getDeliveries() {

    const stored =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!stored) {

        return [];

    }


    try {

        return JSON.parse(
            stored
        );

    } catch {

        return [];

    }

}


function saveDeliveries(
    deliveries
) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            deliveries
        )
    );

}


/* =========================================================
   ID
========================================================= */

function createId() {

    return (
        Date.now().toString(36)
        +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );

}


/* =========================================================
   ERROS DO FORMULÁRIO
========================================================= */

function showFormError(
    message
) {

    formError.textContent =
        message;

    formError.classList.add(
        "show"
    );

}


function clearFormError() {

    formError.textContent = "";

    formError.classList.remove(
        "show"
    );

}


/* =========================================================
   SEGURANÇA BÁSICA DE TEXTO
========================================================= */

function escapeHTML(
    value
) {

    if (value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   DADOS DE EXEMPLO
   São criados somente na primeira execução.
========================================================= */

function createDemoData() {

    const existing =
        getDeliveries();


    if (existing.length > 0) {

        return;

    }


    const monday =
        getMonday(
            new Date()
        );


    const demo = [];


    const addDemo = (
        dayOffset,
        departure,
        returnTimeValue,
        client,
        vehicleName,
        material,
        status
    ) => {

        const date =
            new Date(monday);


        date.setDate(
            monday.getDate() +
            dayOffset
        );


        demo.push({

            id: createId(),

            date:
                formatDateISO(date),

            departure,

            return:
                returnTimeValue,

            vehicle:
                vehicleName,

            clients:
                client,

            material,

            status,

            createdAt:
                new Date().toISOString()

        });

    };


    addDemo(
        0,
        "08:00",
        "10:00",
        "Construtora Silva",
        "Caminhão 01",
        "Cimento e areia",
        "scheduled"
    );


    addDemo(
        0,
        "10:30",
        "13:00",
        "João Materiais",
        "Caminhão 02",
        "Tijolos",
        "scheduled"
    );


    addDemo(
        1,
        "09:00",
        "11:30",
        "ConstruLar",
        "Caminhão 01",
        "Blocos",
        "returning"
    );


    addDemo(
        2,
        "13:00",
        "15:30",
        "Maria Construções",
        "Caminhão 03",
        "Telhas",
        "scheduled"
    );


    addDemo(
        3,
        "07:30",
        "09:30",
        "Obra Central",
        "Caminhão 01",
        "Argamassa",
        "completed"
    );


    addDemo(
        4,
        "14:00",
        "16:00",
        "Construtora Paraná",
        "Caminhão 02",
        "Areia e pedra",
        "scheduled"
    );


    saveDeliveries(
        demo
    );

}


/* =========================================================
   EXECUTAR DADOS DE EXEMPLO
========================================================= */

createDemoData();


/* =========================================================
   ATUALIZAÇÃO DA LINHA DO HORÁRIO
========================================================= */

setInterval(
    () => {

        if (
            currentUser &&
            !appPage.classList.contains(
                "hidden"
            )
        ) {

            drawCurrentTimeLine();

        }

    },
    60000
);
