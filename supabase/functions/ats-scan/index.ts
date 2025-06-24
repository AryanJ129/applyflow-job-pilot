
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobRole } = await req.json();

    console.log('Analyzing resume with DeepSeek...');

    const systemPrompt = `You are an ATS scoring assistant. Given a raw resume, return scores and feedback on the following categories (scale of 1 to 10):

1. Header - Contact information, name, professional title
2. Content - Overall content quality and relevance
3. Work Experience - Quality and detail of work experience descriptions
4. Keywords - Industry-relevant keywords and technical terms
5. Structure - Organization, formatting, and readability

Then provide:
- What You Did Well (positive aspects)
- What Needs Improvement (areas for enhancement)
- Final Score: average of the above 5 categories, rounded to 1 decimal

If the text doesn't appear to be a resume, respond with: {"error": "Please upload a resume!"}

Respond ONLY in this JSON format:
{
  "header": 7,
  "content": 5,
  "workExperience": 8,
  "keywords": 6,
  "structure": 9,
  "whatWentWell": ["Clear contact info", "Consistent bullet points", "Strong action verbs"],
  "improvements": ["Missing keywords", "Weak experience details", "No quantified achievements"],
  "finalScore": 7.0
}`;

    const userPrompt = `Analyze this resume${jobRole ? ` for the role: ${jobRole}` : ''}:\n\n${resumeText}`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('DeepSeek response:', aiResponse);

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid response format from AI');
    }

    // Check if it's an error response
    if (analysisResult.error) {
      return new Response(JSON.stringify({ error: analysisResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ats-scan function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Analysis failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
