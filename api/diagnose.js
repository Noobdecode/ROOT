export async function POST(request) {

    try {

        const { problem, answer } = await request.json();

        if (!problem || !answer) {
            return Response.json(
                { error: "Problem and answer are required." },
                { status: 400 }
            );
        }

        const prompt = `
You are ROOT, an AI learning diagnostic for introductory electrical engineering.

Analyze the student's problem and answer.

Your purpose is to identify the underlying concept or misconception
that may have caused the mistake, rather than simply giving the answer.

SUPPORTED TOPICS:
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

Determine:

1. Whether the student's answer is correct.
2. The correct answer.
3. The most likely underlying concept gap.
4. A concise explanation of the misconception.
5. Which prerequisite concepts appear understood.
6. A short micro-lesson.
7. One diagnostic question testing the same concept.
8. Three answer choices.
9. Which answer choice is correct.

Rules:
- Perform the mathematics yourself.
- If the answer is correct, say so.
- Do not invent information.
- Keep explanations appropriate for a beginner engineering student.
- Prefer one of the supported topics as the root concept.
- The diagnostic question should test understanding.
`;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
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

                        responseMimeType: "application/json",

                        responseSchema: {

                            type: "object",

                            properties: {

                                is_correct: {
                                    type: "boolean"
                                },

                                correct_answer: {
                                    type: "string"
                                },

                                likely_concept: {
                                    type: "string"
                                },

                                misconception: {
                                    type: "string"
                                },

                                prerequisites: {
                                    type: "array",

                                    items: {
                                        type: "object",

                                        properties: {

                                            name: {
                                                type: "string"
                                            },

                                            status: {
                                                type: "string"
                                            }

                                        }
                                    }
                                },

                                micro_lesson: {
                                    type: "string"
                                },

                                diagnostic_question: {
                                    type: "string"
                                },

                                diagnostic_options: {
                                    type: "array",

                                    items: {
                                        type: "string"
                                    }
                                },

                                correct_option: {
                                    type: "integer"
                                }
                            }
                        }
                    }
                })
            }
        );


        const responseText = await response.text();

        console.log("Gemini status:", response.status);
        console.log("Gemini response:", responseText);


        if (!response.ok) {

            return Response.json(
                {
                    error: `Gemini API error (${response.status}): ${responseText}`
                },
                { status: 500 }
            );

        }


        const data = JSON.parse(responseText);

        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text;


        if (!text) {

            return Response.json(
                {
                    error: "Gemini returned no usable response."
                },
                { status: 500 }
            );

        }


        const diagnosis = JSON.parse(text);

        return Response.json(diagnosis);


    } catch (error) {

        console.error("ROOT server error:", error);

        return Response.json(
            {
                error: error.message
            },
            { status: 500 }
        );

    }

}