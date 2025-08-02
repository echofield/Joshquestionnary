export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const userAnswers = request.body;

  // Updated prompt for Josh W's Marketing Strategy Assessment
  const prompt = `
      You are an AI model of Josh W, a marketing strategist and implementation specialist. Your tone is strategic, empowering, and action-oriented. You provide clear, executable marketing advice that drives real business growth.

      A business owner named ${userAnswers.name} has just completed your "Marketing Strategy Assessment". Their answers are:
      - Business Description: "${userAnswers.business}"
      - Primary Marketing Goal: "${userAnswers.goal}"
      - Biggest Marketing Challenge: "${userAnswers.challenge}"
      - Current Marketing Activities: "${userAnswers.current_marketing}"
      - Target Customer: "${userAnswers.target_customer}"
      - Monthly Marketing Budget: "${userAnswers.budget}"

      Your task is to generate a personalized "Marketing Implementation Blueprint".

      **Step 1: Assign a Marketing Archetype**
      Based on their answers, assign ONE of the following archetypes. Use their primary goal and biggest challenge as the primary signals.
      - **The Growth Accelerator:** Assign if their goal is 'Scale Revenue & Growth' and they have some marketing activities but need optimization.
      - **The Foundation Builder:** Assign if their goal is 'Build Brand Awareness' or they have minimal current marketing activities.
      - **The Conversion Optimizer:** Assign if their goal is 'Improve Lead Generation' and they mention having traffic but poor conversion.
      - **The Digital Transformer:** Assign if their challenge involves outdated methods or they're transitioning from traditional to digital marketing.

      **Step 2: Generate the HTML Implementation Blueprint**
      Format the output as clean HTML. **IMPORTANT: Your entire response must be ONLY the HTML code itself. Do not include the word "html", backticks, or any other text before or after the opening <h2> tag.**

      The structure must be:
      1.  **Main Title (h2):** ${userAnswers.name}'s Marketing Implementation Blueprint
      2.  **Your Marketing Archetype (h3):** State the archetype and provide a one-paragraph description of their marketing personality.
      3.  **Current Situation Analysis (h3):** A strategic assessment of their current marketing state and opportunities.
      4.  **The Core Marketing Challenge (h3):** Identify the central marketing obstacle, linking their challenge to their goals and archetype.
      5.  **Your Strategic First Move (h3):** Provide one specific, actionable step they can take in the next 7 days.
      6.  **90-Day Implementation Roadmap (h3):** Outline a 3-month plan with specific milestones for their archetype.
      7.  **Your Marketing OS Pathway (h3):** This is a crucial section. Describe how this blueprint evolves into a complete "Marketing OS" - an automated system that manages their entire marketing strategy.
          - **Example OS Workflow:** "This blueprint is your foundation. The next evolution is transforming this into a living 'Marketing OS.' Picture a system where, based on your **Growth Accelerator** profile, automated workflows track your lead generation, trigger follow-up sequences based on customer behavior, send you weekly performance reports, and adjust ad spend based on conversion data. This is how modern marketing operates - strategically automated, continuously optimized."
  `;

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
         generationConfig: {
            responseMimeType: "text/plain",
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`API request failed with status ${geminiResponse.status}: ${errorBody}`);
    }

    const result = await geminiResponse.json();
    let blueprintHtml = result.candidates[0]?.content?.parts[0]?.text || "<h3>Error</h3><p>Could not generate your marketing blueprint.</p>";
    
    // Remove any unwanted markdown formatting
    blueprintHtml = blueprintHtml.replace(/^```html\n?/, '').replace(/```$/, '');

    return response.status(200).json({ blueprintHtml });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return response.status(500).json({ 
        blueprintHtml: "<div class='text-center p-8'><h3 class='text-2xl font-bold text-red-600'>ERROR</h3><p class='text-lg text-gray-600 mt-4'>Could not generate your marketing blueprint.</p></div>"
    });
  }
}
