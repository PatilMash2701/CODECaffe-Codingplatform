const axios = require('axios');

// Load environment variables
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

// Validate API key is loaded
if (!JUDGE0_API_KEY) {
    console.error('❌ ERROR: JUDGE0_API_KEY is not set in .env file!');
    console.error('Please add JUDGE0_API_KEY=your_key to .env file');
}

console.log(`✅ Using Judge0 API Key: ${JUDGE0_API_KEY ? JUDGE0_API_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
console.log(`✅ Using Judge0 API Host: ${JUDGE0_API_HOST}`);

const getLanguageById=(lang)=>{
    const language={
        "c++":54,
        "java":62,
        "javascript":63
    }
    const id = language[lang.toLowerCase()];
    if (id === undefined) {
        throw new Error(`Unsupported language: ${lang}`);
    }
    return id;
}

const submitBatch = async (submissions) => {
    try {
        // Validate submissions array
        if (!Array.isArray(submissions) || submissions.length === 0) {
            throw new Error('At least one submission is required');
        }

        // Prepare submissions data with proper encoding
        const submissionsData = submissions.map(sub => {
            // Validate required fields
            if (sub.source_code === undefined || sub.source_code === '') {
                throw new Error('Source code is required for all submissions');
            }
            if (sub.language_id === undefined) {
                throw new Error('Language ID is required for all submissions');
            }

            // Create submission object with base64 encoded fields
            const submission = {
                source_code: Buffer.from(String(sub.source_code)).toString('base64'),
                language_id: sub.language_id
            };

            // Add optional fields if they exist
            if (sub.stdin !== undefined) {
                submission.stdin = Buffer.from(String(sub.stdin)).toString('base64');
            } else {
                submission.stdin = ''; // Ensure empty string if not provided
            }

            if (sub.expected_output !== undefined) {
                submission.expected_output = Buffer.from(String(sub.expected_output)).toString('base64');
            }

            return submission;
        });

        const options = {
            method: 'POST',
            url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
            params: {
                base64_encoded: 'true',
                wait: 'false',
                fields: '*' // Request all fields in the response
            },
            headers: {
                'content-type': 'application/json',
                'x-rapidapi-key': '5285c13c53msh38ffbb6749a1f38p106b81jsn50a327a7bbd3',
		        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
            },
            timeout: 30000,
            data: { submissions: submissionsData }
        };

        console.log('Sending to Judge0:', JSON.stringify(options.data, null, 2));
        const startTime = Date.now();
        const response = await axios.request(options);
        const responseTime = Date.now() - startTime;
        console.log(`Judge0 submit response received in ${responseTime}ms`);
        
        if (!response || !response.data) {
            throw new Error('No response data from Judge0 API');
        }

        const data = response.data;
        if (Array.isArray(data)) {
            return data;
        }
        if (Array.isArray(data.submissions)) {
            return data.submissions;
        }
        throw new Error('Unexpected Judge0 batch response format');
    } catch (error) {
        console.error('Error in submitBatch:');
        console.error('Using API Key:', JUDGE0_API_KEY ? JUDGE0_API_KEY.substring(0, 20) + '...' : 'NOT SET');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            throw new Error(`Judge0 API error: ${error.response.data.message || error.response.statusText}`);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
            throw new Error('No response received from Judge0 API');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error:', error.message);
            throw new Error(`Failed to process submission: ${error.message}`);
        }
    }
};

const waiting = async (timer) => {
    return new Promise(resolve => setTimeout(resolve, timer));
}

const submitToken = async (resultToken, onProgress = null) => {
    const options = {
        method: 'GET',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: resultToken.join(","),
            base64_encoded: 'true', // Enable base64 decoding
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': '5285c13c53msh38ffbb6749a1f38p106b81jsn50a327a7bbd3',
		    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        },
        timeout: 30000
    };

    const fetchData = async () => {
        try {
            const response = await axios.request(options);
            if (!response || !response.data) {
                throw new Error('No response data from Judge0 API');
            }

            // Decode base64 responses if they exist
            if (response.data.submissions) {
                response.data.submissions = response.data.submissions.map(sub => ({
                    ...sub,
                    stdout: sub.stdout ? Buffer.from(sub.stdout, 'base64').toString() : null,
                    stderr: sub.stderr ? Buffer.from(sub.stderr, 'base64').toString() : null,
                    compile_output: sub.compile_output ? Buffer.from(sub.compile_output, 'base64').toString() : null,
                    message: sub.message ? Buffer.from(sub.message, 'base64').toString() : null
                }));
            }

            return response.data;
        } catch (error) {
            console.error('Error in fetchData:', error);
            throw new Error(`Failed to fetch submission results: ${error.message}`);
        }
    };

    try {
        let attempts = 0;
        const maxAttempts = 60; // 60 attempts
        let waitTime = 500; // Start with 500ms, increase gradually
        const pollStartTime = Date.now();

        while (attempts < maxAttempts) {
            const result = await fetchData();

            if (!result.submissions || !Array.isArray(result.submissions)) {
                throw new Error('Invalid response format from Judge0');
            }

            const completedCount = result.submissions.filter(s => s.status_id > 2).length;
            if (typeof onProgress === 'function') {
                try {
                    onProgress({
                        submissions: result.submissions,
                        completedCount,
                        totalCount: result.submissions.length,
                        attempt: attempts + 1
                    });
                } catch (cbErr) {
                    console.error('Error in onProgress callback:', cbErr);
                }
            }

            const allCompleted = result.submissions.every(submission => submission.status_id > 2);

            if (allCompleted) {
                const totalTime = Date.now() - pollStartTime;
                console.log(`✅ All submissions completed in ${totalTime}ms (${attempts} polls)`);
                return result.submissions;
            }

            // Adaptive wait: increase wait time after each attempt
            if (attempts > 10) waitTime = 1000; // 1 second after 10 attempts
            if (attempts > 20) waitTime = 1500; // 1.5 seconds after 20 attempts
            
            console.log(`Poll ${attempts + 1}: Still waiting... (${completedCount}/${result.submissions.length} completed)`);
            await waiting(waitTime);
            attempts++;
        }

        throw new Error('Timeout waiting for submission results (exceeded 60 seconds)');
    } catch (error) {
        console.error('Error in submitToken:', error);
        throw error;
    }
};

module.exports = { getLanguageById, submitBatch, submitToken };