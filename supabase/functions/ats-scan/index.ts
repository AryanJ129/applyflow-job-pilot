
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
        error: error.substring(0, 1000)
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
    const { resumeText } = await req.json();

    // Validate resume content
    if (!resumeText || resumeText.length < 50) {
      await logError('Invalid Resume Text', `Resume text too short: ${resumeText?.length || 0} characters. Content preview: ${resumeText?.substring(0, 200) || 'null'}`);
      return new Response(JSON.stringify({ error: "We couldn't scan this file. Try uploading a text-based PDF or .docx" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if the text looks like garbled/encoded content
    const readableWordCount = resumeText.split(/\s+/).filter(word => 
      word.length >= 3 && /^[a-zA-Z0-9@.\-_()]+$/.test(word) && !/^[A-Z]{3,}$/.test(word)
    ).length;
    
    if (readableWordCount < 20) {
      await logError('Garbled Resume Text', `Resume appears to contain garbled text. Readable words: ${readableWordCount}. Content: ${resumeText.substring(0, 300)}`);
      return new Response(JSON.stringify({ error: "We couldn't scan this file. Try uploading a text-based PDF or .docx" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing resume with DeepSeek...');
    console.log('Resume text length:', resumeText.length);
    console.log('Readable words found:', readableWordCount);

    const systemPrompt = `You are an ATS resume evaluator. Given a resume's raw text, respond in this exact JSON format:

{
  "header": 1-10,
  "body": 1-10,
  "formatting": 1-10,
  "contact": 1-10,
  "structure": 1-10,
  "good": ["What the user did well"],
  "bad": ["What needs improvement"],
  "final": final score out of 10
}

Evaluate these specific aspects:
- Header: Contact information, name, professional title clarity
- Body: Content quality, relevant experience, achievements
- Formatting: Structure, readability, ATS compatibility
- Contact: Complete contact details, professional email
- Structure: Logical flow, proper sections, clear organization

Provide specific, actionable feedback in the "good" and "bad" arrays.`;

    const userPrompt = `Analyze this resume:\n\n${resumeText}`;

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
      throw new Error('ATS scan failed. Please try again later.');
    }

    // Validate the response structure
    if (typeof analysisResult !== 'object' || analysisResult === null) {
      await logError('Invalid Response Structure', `Response is not an object: ${JSON.stringify(analysisResult)}`);
      throw new Error('ATS scan failed. Please try again later.');
    }

    // Validate required fields
    const requiredFields = ['header', 'body', 'formatting', 'contact', 'structure', 'good', 'bad', 'final'];
    const missingFields = requiredFields.filter(field => !(field in analysisResult));
    
    if (missingFields.length > 0) {
      await logError('Missing Response Fields', `Missing fields: ${missingFields.join(', ')}\nResponse: ${JSON.stringify(analysisResult)}`);
      throw new Error('ATS scan failed. Please try again later.');
    }

    console.log('Analysis successful:', analysisResult);
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ats-scan function:', error);
    
    // Log the error for analysis
    await logError('ATS Scan Function Error', `${error.message || 'Unknown error occurred'}\nStack: ${error.stack || 'No stack trace'}`);
    
    return new Response(
      JSON.stringify({ error: error.message || 'ATS scan failed. Please try again later.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
