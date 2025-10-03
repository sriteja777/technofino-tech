document.addEventListener('DOMContentLoaded', () => {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const askBtn = document.getElementById('askBtn');
    const threadUrlInput = document.getElementById('threadUrl');
    const apiKeyInput = document.getElementById('apiKey');
    const questionInput = document.getElementById('questionInput');
    const statusArea = document.getElementById('statusArea');
    const summaryResult = document.getElementById('summaryResult');
    const qnaResult = document.getElementById('qnaResult');

    summarizeBtn.addEventListener('click', async () => {
        const threadUrl = threadUrlInput.value;
        const apiKey = apiKeyInput.value;

        if (!threadUrl || !apiKey) {
            displayStatus('Please provide both Thread URL and API Key.', true);
            return;
        }

        displayStatus('Summarizing... please wait.', false);
        summaryResult.textContent = ''; // Clear previous summary
        qnaResult.textContent = ''; // Clear previous Q&A

        try {
            // This will be replaced by a call to our Flask backend
            console.log('Summarize button clicked');
            console.log('Thread URL:', threadUrl);
            console.log('API Key:', apiKey);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            summaryResult.textContent = 'This is a placeholder summary.\nBackend functionality to be implemented.';
            displayStatus('Summary generated!', false, true);

        } catch (error) {
            console.error('Error during summarization:', error);
            displayStatus(`Error: ${error.message}`, true);
            summaryResult.textContent = 'Failed to generate summary.';
        }
    });

    askBtn.addEventListener('click', async () => {
        const question = questionInput.value;
        const apiKey = apiKeyInput.value; // API key might be needed for Q&A too

        if (!question) {
            displayStatus('Please enter a question.', true);
            return;
        }
        if (!apiKey) {
            displayStatus('API Key is required for Q&A.', true);
            return;
        }
        if (!summaryResult.textContent || summaryResult.textContent === 'Summary will appear here...' || summaryResult.textContent === 'Failed to generate summary.') {
            displayStatus('Please summarize the thread first before asking questions.', true);
            return;
        }


        displayStatus('Thinking...', false);
        qnaResult.textContent = ''; // Clear previous answer

        try {
            // This will be replaced by a call to our Flask backend
            console.log('Ask button clicked');
            console.log('Question:', question);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            qnaResult.textContent = 'This is a placeholder answer for your question.\nBackend functionality to be implemented.';
            displayStatus('Answer received!', false, true);

        } catch (error) {
            console.error('Error during Q&A:', error);
            displayStatus(`Error: ${error.message}`, true);
            qnaResult.textContent = 'Failed to get an answer.';
        }
    });

    function displayStatus(message, isError = false, isSuccess = false) {
        statusArea.textContent = message;
        statusArea.className = 'status-message'; // Reset classes
        if (isError) {
            statusArea.classList.add('error');
        } else if (isSuccess) {
            statusArea.classList.add('success');
        } else {
            statusArea.classList.add('info'); // Default styling for neutral messages
        }
    }
});
