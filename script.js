const screens = document.querySelectorAll(".screen");

let currentDiagnosis = null;
let originalProblem = "";
let originalAnswer = "";


// ===============================
// SCREEN NAVIGATION
// ===============================

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


// ===============================
// LANDING PAGE
// ===============================

document.getElementById("start-btn").addEventListener("click", () => {
    showScreen("input-screen");
});

document.getElementById("back-to-home").addEventListener("click", () => {
    showScreen("landing-screen");
});


// ===============================
// AI DIAGNOSIS
// ===============================

document.getElementById("diagnose-btn").addEventListener("click", async () => {

    const problem =
        document.getElementById("problem").value.trim();

    const answer =
        document.getElementById("answer").value.trim();

    const button =
        document.getElementById("diagnose-btn");


    // Make sure both fields are filled

    if (!problem || !answer) {

        alert(
            "Please enter both the question and your answer."
        );

        return;
    }


    // Save the original submission

    originalProblem = problem;
    originalAnswer = answer;


    // Loading state

    button.disabled = true;
    button.textContent = "Analyzing your mistake...";


    try {

        console.log("Sending problem to ROOT AI...");


        const response = await fetch(
            "/api/diagnose",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    problem: problem,
                    answer: answer
                })
            }
        );


        const data = await response.json();


        console.log("ROOT AI response:", data);


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Diagnosis failed."
            );
        }


        // Store diagnosis

        currentDiagnosis = data;


        // Update the interface

        updateDiagnosisScreen(data);

        updateRepairScreen(data);


        // Go to diagnosis

        showScreen("diagnosis-screen");


    } catch (error) {

        console.error(
            "ROOT diagnosis error:",
            error
        );


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


// ===============================
// UPDATE DIAGNOSIS SCREEN
// ===============================

function updateDiagnosisScreen(data) {

    // Student answer

    document.getElementById(
        "user-answer"
    ).textContent = originalAnswer;


    // Correct / incorrect status

    const status =
        document.querySelector(".incorrect");


    if (data.is_correct) {

        status.textContent = "✓ Correct";

        status.style.color = "#a8ff60";

    } else {

        status.textContent = "✕ Incorrect";

        status.style.color = "#ff6262";
    }


    // Root concept

    document.getElementById(
        "root-concept"
    ).textContent =
        data.likely_concept;


    // Explanation

    document.getElementById(
        "root-description"
    ).textContent =
        data.misconception;


    // ===========================
    // KNOWLEDGE MAP
    // ===========================

    const map =
        document.querySelector(".knowledge-map");


    // Remove old hard-coded concepts

    map.innerHTML = "";


    if (
        data.prerequisites &&
        Array.isArray(data.prerequisites)
    ) {

        data.prerequisites.forEach(
            (concept, index) => {

                const conceptElement =
                    document.createElement("div");


                conceptElement.className =
                    "concept";


                const conceptStatus =
                    String(
                        concept.status || ""
                    ).toLowerCase();


                // Mastered

                if (
                    conceptStatus.includes("master") ||
                    conceptStatus.includes("understood") ||
                    conceptStatus.includes("good")
                ) {

                    conceptElement.classList.add(
                        "completed"
                    );

                    conceptElement.innerHTML =
                        `<span>✓</span>${escapeHTML(
                            concept.name
                        )}`;

                }


                // Weak / needs review

                else if (
                    conceptStatus.includes("review") ||
                    conceptStatus.includes("weak")
                ) {

                    conceptElement.classList.add(
                        "warning"
                    );

                    conceptElement.innerHTML =
                        `<span>!</span>${escapeHTML(
                            concept.name
                        )}`;

                }


                // Missing

                else {

                    conceptElement.classList.add(
                        "missing"
                    );

                    conceptElement.innerHTML =
                        `<span>?</span>${escapeHTML(
                            concept.name
                        )}`;
                }


                map.appendChild(
                    conceptElement
                );


                // Connection between concepts

                if (
                    index <
                    data.prerequisites.length - 1
                ) {

                    const connection =
                        document.createElement("div");

                    connection.className =
                        "connection";

                    map.appendChild(
                        connection
                    );
                }

            }
        );
    }
}


// ===============================
// REPAIR BUTTON
// ===============================

document.getElementById("repair-btn")
    .addEventListener("click", () => {

        if (!currentDiagnosis) {
            return;
        }

        showScreen("repair-screen");

    });


// ===============================
// UPDATE REPAIR SCREEN
// ===============================

function updateRepairScreen(data) {

    // MICRO LESSON

    const lessonCard =
        document.querySelector(".lesson-card");


    lessonCard.innerHTML = `

        <div class="card-label">
            MICRO-LESSON
        </div>

        <h2>
            ${escapeHTML(
                data.likely_concept
            )}
        </h2>

        <p>
            ${escapeHTML(
                data.micro_lesson
            )}
        </p>

    `;


    // ===========================
    // QUICK CHECK
    // ===========================

    const quizCard =
        document.querySelector(".quiz-card");


    quizCard.innerHTML = `

        <div class="card-label">
            QUICK CHECK
        </div>

        <h3 id="quiz-question">
            ${escapeHTML(
                data.diagnostic_question
            )}
        </h3>

        <div
            class="quiz-options"
            id="quiz-options">
        </div>

        <div
            id="quiz-feedback"
            class="quiz-feedback">
        </div>

    `;


    // Create answer buttons

    const optionsContainer =
        document.getElementById(
            "quiz-options"
        );


    if (
        data.diagnostic_options &&
        Array.isArray(data.diagnostic_options)
    ) {

        data.diagnostic_options.forEach(
            (option, index) => {

                const button =
                    document.createElement(
                        "button"
                    );


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


                optionsContainer.appendChild(
                    button
                );

            }
        );
    }
}


// ===============================
// QUIZ ANSWER
// ===============================

function handleQuizAnswer(
    selected,
    correct
) {

    const feedback =
        document.getElementById(
            "quiz-feedback"
        );


    const options =
        document.querySelectorAll(
            ".quiz-option"
        );


    // Disable buttons temporarily

    options.forEach(
        option => {
            option.disabled = true;
        }
    );


    if (selected === correct) {

        feedback.textContent =
            "✓ Correct. The concept has been repaired.";

        feedback.style.color =
            "#a8ff60";


        setTimeout(() => {

            showScreen(
                "success-screen"
            );

        }, 1000);


    } else {

        feedback.textContent =
            "Not quite. Review the concept and try again.";

        feedback.style.color =
            "#ff6262";


        options.forEach(
            option => {
                option.disabled = false;
            }
        );
    }
}


// ===============================
// RETRY ORIGINAL PROBLEM
// ===============================

document.getElementById("retry-btn")
    .addEventListener("click", () => {

        showScreen("input-screen");

    });


// ===============================
// HTML SAFETY
// ===============================

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}