
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for error logging
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function logError(name: string, error: string) {
  try {
    await supabase
      .from('error_logs')
      .insert({
        name,
        error: error.substring(0, 1000) // Limit error message length
      });
  } catch (logErr) {
    console.error('Failed to log error:', logErr);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobRole } = await req.json();

    if (!resumeText || resumeText.length < 50) {
      await logError('Invalid Resume Text', `Resume text too short: ${resumeText?.length || 0} characters`);
      return new Response(JSON.stringify({ error: "Please upload a valid resume with readable content!" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing resume with DeepSeek...');
    console.log('Resume text preview:', resumeText.substring(0, 500) + '...');

    const systemPrompt = `You are an ATS scoring assistant. Given a raw resume text, return scores and feedback on the following categories (scale of 1 to 10):

1. Header - Contact information, name, professional title
2. Content - Overall content quality and relevance
3. Work Experience - Quality and detail of work experience descriptions
4. Keywords - Industry-relevant keywords and technical terms
5. Structure - Organization, formatting, and readability

Then provide:
- What You Did Well (positive aspects)
- What Needs Improvement (areas for enhancement)
- Final Score: average of the above 5 categories, rounded to 1 decimal

IMPORTANT: Only analyze actual resume content. If the text doesn't contain typical resume elements (name, experience, skills, education), respond with: {"error": "Please upload a resume!"}

Respond ONLY in this JSON format (no markdown formatting):
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
      const errorMessage = `DeepSeek API error: ${response.status} - ${response.statusText}`;
      await logError('DeepSeek API Error', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      await logError('Invalid DeepSeek Response', `Unexpected response structure: ${JSON.stringify(data)}`);
      throw new Error('Invalid response structure from DeepSeek API');
    }

    const aiResponse = data.choices[0].message.content;
    console.log('DeepSeek response:', aiResponse);

    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      await logError('JSON Parse Error', `Failed to parse AI response: ${parseError.message}\nOriginal response: ${aiResponse}\nCleaned response: ${cleanedResponse}`);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response structure
    if (typeof analysisResult !== 'object' || analysisResult === null) {
      await logError('Invalid Response Structure', `Response is not an object: ${JSON.stringify(analysisResult)}`);
      throw new Error('Invalid response structure from AI');
    }

    // Check if it's an error response
    if (analysisResult.error) {
      await logError('AI Analysis Error', `DeepSeek returned error: ${analysisResult.error}\nResume text length: ${resumeText.length}\nResume preview: ${resumeText.substring(0, 200)}`);
      return new Response(JSON.stringify({ error: analysisResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    const requiredFields = ['header', 'content', 'workExperience', 'keywords', 'structure', 'whatWentWell', 'improvements', 'finalScore'];
    const missingFields = requiredFields.filter(field => !(field in analysisResult));
    
    if (missingFields.length > 0) {
      await logError('Missing Response Fields', `Missing fields: ${missingFields.join(', ')}\nResponse: ${JSON.stringify(analysisResult)}`);
      throw new Error('Incomplete response from AI');
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ats-scan function:', error);
    
    // Log the error for analysis
    await logError('ATS Scan Function Error', error.message || 'Unknown error occurred');
    
    return new Response(
      JSON.stringify({ error: error.message || 'Analysis failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
