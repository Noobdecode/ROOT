const screens = document.querySelectorAll(".screen");

let currentDiagnosis = null;
let originalProblem = "";
let originalAnswer = "";


function showScreen(id) {

    screens.forEach(screen => {
        screen.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ---------------------------
   NAVIGATION
---------------------------- */

document
    .getElementById("start-btn")
    .addEventListener("click", () => {

        showScreen("input-screen");

    });


document
    .getElementById("back-to-home")
    .addEventListener("click", () => {

        showScreen("landing-screen");

    });


/* ---------------------------
   DIAGNOSE WITH AI
---------------------------- */

document
    .getElementById("diagnose-btn")
    .addEventListener("click", async () => {

        const problem =
            document.getElementById("problem").value.trim();

        const answer =
            document.getElementById("answer").value.trim();

        const button =
            document.getElementById("diagnose-btn");


        if (!problem || !answer) {

            alert("Please enter both the question and your answer.");

            return;
        }


        originalProblem = problem;
        originalAnswer = answer;


        button.disabled = true;

        button.textContent = "Analyzing your mistake...";


        try {

            const response = await fetch("/api/diagnose", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    problem,
                    answer
                })

            });


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error || "Diagnosis failed."
                );

            }


            currentDiagnosis = data;

            updateDiagnosisScreen(data);

            updateRepairScreen(data);

            showScreen("diagnosis-screen");


        } catch (error) {

            console.error(error);

            alert(
                "ROOT could not analyze the problem.\n\n" +
                error.message
            );

        } finally {

            button.disabled = false;

            button.textContent =
                "Analyze my mistake →";

        }

    });


/* ---------------------------
   UPDATE DIAGNOSIS SCREEN
---------------------------- */

function updateDiagnosisScreen(data) {

    document.getElementById("user-answer").textContent =
        originalAnswer;


    const status =
        document.querySelector(".incorrect");


    if (data.is_correct) {

        status.textContent =
            "✓ Correct";

        status.style.color =
            "#a8ff60";

    } else {

        status.textContent =
            "✕ Incorrect";

        status.style.color =
            "#ff6262";

    }


    document.getElementById("root-concept").textContent =
        data.likely_concept;


    document.getElementById("root-description").textContent =
        data.misconception;


    const map =
        document.querySelector(".knowledge-map");


    map.innerHTML = "";


    data.prerequisites.forEach((concept, index) => {

        const conceptElement =
            document.createElement("div");

        conceptElement.className =
            "concept";


        const status =
            concept.status.toLowerCase();


        if (
            status.includes("master") ||
            status.includes("understood") ||
            status.includes("good")
        ) {

            conceptElement.classList.add("completed");

            conceptElement.innerHTML =
                `<span>✓</span>${concept.name}`;

        }

        else if (
            status.includes("review") ||
            status.includes("weak")
        ) {

            conceptElement.classList.add("warning");

            conceptElement.innerHTML =
                `<span>!</span>${concept.name}`;

        }

        else {

            conceptElement.classList.add("missing");

            conceptElement.innerHTML =
                `<span>?</span>${concept.name}`;

        }


        map.appendChild(conceptElement);


        if (index < data.prerequisites.length - 1) {

            const connection =
                document.createElement("div");

            connection.className =
                "connection";

            map.appendChild(connection);

        }

    });

}


/* ---------------------------
   REPAIR SCREEN
---------------------------- */

document
    .getElementById("repair-btn")
    .addEventListener("click", () => {

        if (!currentDiagnosis) {
            return;
        }

        showScreen("repair-screen");

    });


function updateRepairScreen(data) {

    const lessonCard =
        document.querySelector(".lesson-card");


    lessonCard.innerHTML = `

        <div class="card-label">
            MICRO-LESSON
        </div>

        <h2>
            ${escapeHTML(data.likely_concept)}
        </h2>

        <p>
            ${escapeHTML(data.micro_lesson)}
        </p>

    `;


    const quizCard =
        document.querySelector(".quiz-card");


    quizCard.innerHTML = `

        <div class="card-label">
            QUICK CHECK
        </div>

        <h3 id="quiz-question">
            ${escapeHTML(data.diagnostic_question)}
        </h3>

        <div class="quiz-options" id="quiz-options">
        </div>

        <div id="quiz-feedback"
             class="quiz-feedback">
        </div>

    `;


    const optionsContainer =
        document.getElementById("quiz-options");


    data.diagnostic_options.forEach(
        (option, index) => {

            const button =
                document.createElement("button");

            button.className =
                "quiz-option";

            button.textContent =
                option;


            button.addEventListener(
                "click",
                () => {

                    handleQuizAnswer(
                        index,
                        data.correct_option
                    );

                }
            );


            optionsContainer.appendChild(button);

        }
    );

}


/* ---------------------------
   QUIZ
---------------------------- */

function handleQuizAnswer(
    selected,
    correct
) {

    const feedback =
        document.getElementById("quiz-feedback");


    const options =
        document.querySelectorAll(".quiz-option");


    options.forEach(option => {

        option.disabled = true;

    });


    if (selected === correct) {

        feedback.textContent =
            "✓ Correct. The concept has been repaired.";

        feedback.style.color =
            "#a8ff60";


        setTimeout(() => {

            showScreen("success-screen");

        }, 1000);

    }

    else {

        feedback.textContent =
            "Not quite. Review the concept and try again.";

        feedback.style.color =
            "#ff6262";


        options.forEach(option => {

            option.disabled = false;

        });

    }

}


/* ---------------------------
   RETRY
---------------------------- */

document
    .getElementById("retry-btn")
    .addEventListener("click", () => {

        showScreen("input-screen");

    });


/* ---------------------------
   SECURITY / HTML ESCAPING
---------------------------- */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}