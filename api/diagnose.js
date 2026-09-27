const MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite"
];


const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));


async function callGemini(prompt) {

    let lastError = null;


    for (const MODEL of MODELS) {

        console.log("Trying Gemini model:", MODEL);


        for (let attempt = 1; attempt <= 3; attempt++) {

            try {

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key":
                                process.env.GEMINI_API_KEY
                        },

                        body: JSON.stringify({

                            contents: [
                                {
                                    parts: [
                                        {
                                            text: prompt
                                        }
                                    ]
                                }
                            ],

                            generationConfig: {
                                responseMimeType:
                                    "application/json"
                            }

                        })
                    }
                );


                const responseText =
                    await response.text();


                // SUCCESS

                if (response.ok) {

                    console.log(
                        "Gemini succeeded with:",
                        MODEL
                    );

                    return JSON.parse(
                        responseText
                    );
                }


                console.error(
                    `Gemini ${MODEL} attempt ${attempt} failed:`,
                    response.status,
                    responseText
                );


                lastError =
                    new Error(
                        `Gemini ${MODEL} returned ${response.status}`
                    );


                // Retry temporary errors

                if (
                    response.status === 429 ||
                    response.status === 500 ||
                    response.status === 502 ||
                    response.status === 503 ||
                    response.status === 504
                ) {

                    if (attempt < 3) {

                        await sleep(
                            1000 *
                            Math.pow(
                                2,
                                attempt - 1
                            )
                        );

                        continue;
                    }


                    // All retries for this model failed.
                    // Move to the next model.

                    break;
                }


                // Non-temporary error:
                // don't keep retrying it.

                throw new Error(
                    `Gemini API error (${response.status}): ${responseText}`
                );

            } catch (error) {

                lastError = error;

                console.error(
                    "Gemini request error:",
                    error
                );


                if (attempt < 3) {

                    await sleep(
                        1000 *
                        Math.pow(
                            2,
                            attempt - 1
                        )
                    );

                }

            }

        }

    }


    throw lastError ||
        new Error(
            "All Gemini models failed."
        );
}


export async function POST(request) {

    try {

        const {
            problem,
            answer
        } = await request.json();


        if (!problem || !answer) {

            return Response.json(
                {
                    error:
                        "Problem and answer are required."
                },
                {
                    status: 400
                }
            );
        }


        const prompt = `
You are ROOT, an AI learning diagnostic for
introductory electrical engineering.

Your job is to identify the underlying concept
behind a student's mistake.

SUPPORTED CONCEPTS:

- Basic Algebra
- Voltage
- Current
- Resistance
- Ohm's Law
- Series Circuits
- Parallel Circuits
- Kirchhoff's Current Law
- Kirchhoff's Voltage Law
- Electrical Power
- Basic Circuit Analysis

STUDENT PROBLEM:
${problem}

STUDENT ANSWER:
${answer}

Analyze the student's answer carefully.

Return ONLY valid JSON with this exact structure:

{
  "is_correct": true,
  "correct_answer": "string",
  "likely_concept": "string",
  "misconception": "string",
  "prerequisites": [
    {
      "name": "string",
      "status": "mastered"
    }
  ],
  "micro_lesson": "string",
  "diagnostic_question": "string",
  "diagnostic_options": [
    "string",
    "string",
    "string"
  ],
  "correct_option": 0
}

Rules:

- Perform the mathematics yourself.
- If the student's answer is correct, say so.
- Identify the underlying concept rather than only saying
  "calculation mistake."
- Keep explanations suitable for a beginner engineering student.
- Do not invent information.
- Prefer concepts from the supported concept list.
- Include exactly 3 diagnostic answer choices.
- correct_option must be 0, 1, or 2.
- Keep the micro-lesson concise.
- The diagnostic question should test understanding
  of the identified concept.
`;


        const data =
            await callGemini(prompt);


        const text =
            data.candidates?.[0]
                ?.content?.parts?.[0]?.text;


        if (!text) {

            throw new Error(
                "Gemini returned no usable response."
            );
        }


        const diagnosis =
            JSON.parse(text);


        return Response.json(
            diagnosis
        );


    } catch (error) {

        console.error(
            "ROOT server error:",
            error
        );


        return Response.json(
            {
                error:
                    error.message
            },
            {
                status: 500
            }
        );

    }
}