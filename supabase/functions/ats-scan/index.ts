
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

    console.log('Received resume text length:', resumeText?.length || 0);
    console.log('Resume text preview:', resumeText?.substring(0, 300) || 'null');

    // Enhanced validation
    if (!resumeText || resumeText.length < 50) {
      await logError('Invalid Resume Text', `Resume text too short: ${resumeText?.length || 0} characters. Content preview: ${resumeText?.substring(0, 200) || 'null'}`);
      return new Response(JSON.stringify({ error: "We couldn't analyze this content. The extracted text is too short or empty. Please try a different file format." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Better text quality check
    const words = resumeText.split(/\s+/);
    const readableWords = words.filter(word => 
      word.length >= 3 && 
      /^[a-zA-Z0-9@.\-_()]+$/.test(word) && 
      !/^[A-Z]{4,}$/.test(word) // Filter out long all-caps gibberish
    );
    
    const readableWordRatio = readableWords.length / words.length;
    
    console.log(`Total words: ${words.length}, Readable words: ${readableWords.length}, Ratio: ${readableWordRatio.toFixed(2)}`);
    
    if (readableWords.length < 30 || readableWordRatio < 0.6) {
      await logError('Poor Text Quality', `Low quality text detected. Total words: ${words.length}, Readable: ${readableWords.length}, Ratio: ${readableWordRatio.toFixed(2)}. Content: ${resumeText.substring(0, 500)}`);
      return new Response(JSON.stringify({ error: "The extracted text appears to be corrupted or unreadable. Please try uploading a text-based PDF or Word document." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Text quality check passed. Analyzing with DeepSeek...');

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume evaluator. Analyze the resume text and provide detailed feedback.

Respond in this EXACT JSON format:

{
  "header": score_1_to_10,
  "body": score_1_to_10,
  "formatting": score_1_to_10,
  "contact": score_1_to_10,
  "structure": score_1_to_10,
  "good": ["specific positive points"],
  "bad": ["specific improvement suggestions"],
  "final": overall_score_1_to_10
}

Scoring criteria:
- Header (1-10): Name visibility, professional title, contact info placement
- Body (1-10): Content quality, relevant experience, achievements with metrics
- Formatting (1-10): Consistency, readability, ATS-friendly structure
- Contact (1-10): Complete contact details, professional email, LinkedIn
- Structure (1-10): Logical flow, proper sections, clear organization

Provide 3-5 specific points in "good" and "bad" arrays. Be constructive and actionable.`;

    const userPrompt = `Analyze this resume text for ATS compatibility:\n\n${resumeText}`;

    console.log('Sending request to DeepSeek API...');

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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorMessage = `DeepSeek API error: ${response.status} - ${response.statusText}`;
      await logError('DeepSeek API Error', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('DeepSeek API response received');
    
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
      throw new Error('Failed to parse AI analysis. Please try again.');
    }

    // Validate the response structure
    if (typeof analysisResult !== 'object' || analysisResult === null) {
      await logError('Invalid Response Structure', `Response is not an object: ${JSON.stringify(analysisResult)}`);
      throw new Error('Invalid analysis result structure.');
    }

    // Validate and sanitize required fields
    const requiredFields = ['header', 'body', 'formatting', 'contact', 'structure', 'good', 'bad', 'final'];
    const missingFields = requiredFields.filter(field => !(field in analysisResult));
    
    if (missingFields.length > 0) {
      await logError('Missing Response Fields', `Missing fields: ${missingFields.join(', ')}\nResponse: ${JSON.stringify(analysisResult)}`);
      
      // Fill in missing fields with defaults
      if (!analysisResult.header) analysisResult.header = 5;
      if (!analysisResult.body) analysisResult.body = 5;
      if (!analysisResult.formatting) analysisResult.formatting = 5;
      if (!analysisResult.contact) analysisResult.contact = 5;
      if (!analysisResult.structure) analysisResult.structure = 5;
      if (!Array.isArray(analysisResult.good)) analysisResult.good = ['Analysis completed'];
      if (!Array.isArray(analysisResult.bad)) analysisResult.bad = ['Please try uploading a clearer version'];
      if (!analysisResult.final) analysisResult.final = 5;
    }

    // Ensure scores are in valid range
    ['header', 'body', 'formatting', 'contact', 'structure', 'final'].forEach(field => {
      if (typeof analysisResult[field] !== 'number' || analysisResult[field] < 1 || analysisResult[field] > 10) {
        analysisResult[field] = Math.max(1, Math.min(10, parseInt(analysisResult[field]) || 5));
      }
    });

    console.log('Analysis successful:', analysisResult);
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ats-scan function:', error);
    
    // Log the error for analysis
    await logError('ATS Scan Function Error', `${error.message || 'Unknown error occurred'}\nStack: ${error.stack || 'No stack trace'}`);
    
    return new Response(
      JSON.stringify({ error: error.message || 'ATS analysis failed. Please try again with a different file.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
