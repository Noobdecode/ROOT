const MODEL = "gemini-3.5-flash-lite";

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));


async function callGemini(prompt) {

    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
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
                        responseMimeType: "application/json"
                    }

                })
            }
        );


        const responseText = await response.text();


        if (response.ok) {
            return JSON.parse(responseText);
        }


        console.error(
            `Gemini attempt ${attempt} failed:`,
            response.status,
            responseText
        );


        // Retry temporary server/rate-limit errors.
        if (
            response.status === 429 ||
            response.status === 500 ||
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504
        ) {

            if (attempt < maxAttempts) {

                const delay =
                    Math.min(
                        1000 * Math.pow(2, attempt - 1),
                        8000
                    );

                await sleep(delay);

                continue;
            }
        }


        throw new Error(
            `Gemini API error (${response.status}): ${responseText}`
        );
    }
}


export async function POST(request) {

    try {

        const { problem, answer } =
            await request.json();


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
- Include 3 diagnostic answer choices.
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


        return Response.json(diagnosis);


    } catch (error) {

        console.error(
            "ROOT server error:",
            error
        );


        return Response.json(
            {
                error: error.message
            },
            {
                status: 500
            }
        );

    }
}