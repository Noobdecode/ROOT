const screens = document.querySelectorAll(".screen");


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
   DIAGNOSE
---------------------------- */

document
    .getElementById("diagnose-btn")
    .addEventListener("click", () => {

        const problem =
            document.getElementById("problem").value.trim();

        const answer =
            document.getElementById("answer").value.trim();


        if (!problem || !answer) {

            alert("Please enter both the question and your answer.");

            return;
        }


        document.getElementById("user-answer").textContent =
            answer;


        showScreen("diagnosis-screen");

    });


/* ---------------------------
   REPAIR CONCEPT
---------------------------- */

document
    .getElementById("repair-btn")
    .addEventListener("click", () => {

        showScreen("repair-screen");

    });


/* ---------------------------
   QUIZ
---------------------------- */

const quizOptions =
    document.querySelectorAll(".quiz-option");


quizOptions.forEach(option => {

    option.addEventListener("click", () => {

        const feedback =
            document.getElementById("quiz-feedback");


        if (option.dataset.answer === "correct") {

            feedback.textContent =
                "✓ Correct. The concept has been repaired.";

            feedback.style.color =
                "#a8ff60";


            setTimeout(() => {

                showScreen("success-screen");

            }, 900);

        }

        else {

            feedback.textContent =
                "Not quite. Remember: I = V / R.";

            feedback.style.color =
                "#ff6262";

        }

    });

});


/* ---------------------------
   RETRY
---------------------------- */

document
    .getElementById("retry-btn")
    .addEventListener("click", () => {

        showScreen("input-screen");

    });