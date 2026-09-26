export async function POST(request) {

    try {

        const { problem, answer } = await request.json();

        if (!problem || !answer) {

            return Response.json(
                {
                    error: "Problem and answer are required."
                },
                { status: 400 }
            );

        }


        const prompt = `
You are ROOT, an AI learning diagnostic for introductory electrical engineering.

Your job is NOT simply to give the student the correct answer.

Your job is to identify the likely underlying concept or misconception that caused the student's mistake.

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

Analyze the problem carefully.

Determine:
1. Whether the student's answer is correct.
2. The correct answer.
3. The most likely underlying concept gap.
4. A short explanation of the misconception.
5. Which prerequisite concepts appear understood.
6. A short micro-lesson that repairs the missing concept.
7. One new diagnostic question testing the same concept.
8. Three answer choices for the diagnostic question.
9. Which answer choice is correct.

IMPORTANT:
- Do not invent information that is not present in the problem.
- Perform the mathematics yourself.
- If the student's answer is actually correct, say so.
- Keep explanations appropriate for a beginner engineering student.
- Choose the root concept from the supported topics whenever possible.
- Do not merely say "wrong calculation" if a deeper conceptual explanation is possible.
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

                                        },

                                        required: [
                                            "name",
                                            "status"
                                        ]
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

                            },

                            required: [
                                "is_correct",
                                "correct_answer",
                                "likely_concept",
                                "misconception",
                                "prerequisites",
                                "micro_lesson",
                                "diagnostic_question",
                                "diagnostic_options",
                                "correct_option"
                            ]
                        }
                    }
                })
            }
        );


        if (!response.ok) {

            const errorText = await response.text();

            console.error(errorText);

            return Response.json(
                {
                    error: "Gemini API request failed."
                },
                { status: 500 }
            );
        }


        const data = await response.json();

        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text;


        if (!text) {

            return Response.json(
                {
                    error: "No response received from Gemini."
                },
                { status: 500 }
            );

        }


        const diagnosis = JSON.parse(text);


        return Response.json(diagnosis);


    } catch (error) {

        console.error(error);

        return Response.json(
            {
                error: "Something went wrong while analyzing the problem."
            },
            { status: 500 }
        );

    }

}