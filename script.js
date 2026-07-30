let questionsData = [];
function escapeAttr(str) {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(escapeRegExp(query), "gi");
    return text.replace(regex, (match) => `<mark class="search-highlight">${match}</mark>`);
}
function applyHighlight(item, query) {
    const targets = item.querySelectorAll("[data-original]");
    targets.forEach((el) => {
        const original = el.getAttribute("data-original");
        el.innerHTML = highlightText(original, query);
    });
}
function renderQuestions(questions) {
    const qaList = document.getElementById("qaList");
    qaList.innerHTML = "";
    questions.forEach((item, i) => {
        const details = document.createElement("details");
        details.className = "qa-item";
        const summary = document.createElement("summary");
        summary.className = "qa-summary";
        summary.innerHTML = ` <span class="qa-index">${String(i + 1).padStart(2, "0")}</span> <span class="qa-summary-text" data-original="${escapeAttr(item.question)}">${item.question}</span> `;
        const contentDiv = document.createElement("div");
        contentDiv.className = "qa-content";
        if (item.type === "matching") {
            const matchingList = document.createElement("div");
            matchingList.className = "matching-list";
            item.pairs.forEach((pair) => {
                const row = document.createElement("div");
                row.className = "matching-row";
                row.innerHTML = ` <div class="match-left" data-original="${escapeAttr(pair.left)}">${pair.left}</div> <div class="match-divider">&rarr;</div> <div class="match-right" data-original="${escapeAttr(pair.right)}">${pair.right}</div> `;
                matchingList.appendChild(row);
            });
            contentDiv.appendChild(matchingList);
        } else {
            const optionsList = document.createElement("div");
            optionsList.className = "options-list";
            item.options.forEach((opt) => {
                const optionDiv = document.createElement("div");
                optionDiv.className = `option ${opt.isCorrect ? "correct" : ""}`;
                optionDiv.innerHTML = ` <div class="mark"></div> <div class="option-text" data-original="${escapeAttr(opt.text)}">${opt.text}</div> `;
                optionsList.appendChild(optionDiv);
            });
            contentDiv.appendChild(optionsList);
        }
        details.appendChild(summary);
        details.appendChild(contentDiv);
        qaList.appendChild(details);
    });
    updateCounter(questions.length, questions.length);
}
function updateCounter(visible, total) {
    const counterText = document.getElementById("counterText");
    const searchStatus = document.getElementById("searchStatus");
    counterText.textContent = `Всего вопросов: ${total}`;
    searchStatus.textContent = visible === total ? "" : `показано ${visible} из ${total}`;
}
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function initSearch() {
    const searchInput = document.getElementById("searchInput");
    const clearBtn = document.getElementById("searchClearBtn");
    const noResults = document.getElementById("noResults");
    function runFilter() {
        const rawQuery = searchInput.value.trim();
        const query = rawQuery.toLowerCase();
        const qaItems = document.querySelectorAll(".qa-item");
        let visibleCount = 0;
        clearBtn.classList.toggle("visible", query.length > 0);
        qaItems.forEach((item) => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.classList.remove("hidden");
                visibleCount++;
                if (query.length >= 3) {
                    item.setAttribute("open", "");
                } else {
                    item.removeAttribute("open");
                }
            } else {
                item.classList.add("hidden");
                item.removeAttribute("open");
            }
            applyHighlight(item, rawQuery);
        });
        updateCounter(visibleCount, questionsData.length);
        if (visibleCount > 0 || query.length === 0) {
            noResults.classList.add("hidden");
        } else {
            noResults.classList.remove("hidden");
        }
    }
    const debouncedFilter = debounce(runFilter, 150);
    searchInput.addEventListener("input", debouncedFilter);
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        runFilter();
        searchInput.focus();
    });
}
document.addEventListener("DOMContentLoaded", () => {
    fetch("questions.json")
        .then((response) => response.json())
        .then((data) => {
            questionsData = data;
            renderQuestions(questionsData);
            initSearch();
        })
        .catch((error) => {
            console.error("Ошибка загрузки JSON:", error);
            document.getElementById("counterText").textContent = "Ошибка загрузки базы данных.";
        });
    initModal();
});
function initModal() {
    const overlay = document.getElementById("modalOverlay");
    const openBtn = document.getElementById("openModalBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    openBtn.addEventListener("click", () => overlay.classList.add("active"));
    closeBtn.addEventListener("click", () => overlay.classList.remove("active"));
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("active");
    });
}
