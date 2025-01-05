// Function to reset the button state
function resetButton(event) {
    event.target.disabled = false;
    event.target.textContent = 'Upload';
    event.target.classList.remove('loading');
}

// Function to handle file upload
async function upload(event) {
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput?.files[0]; // Added optional chaining for safety

    const jobDescription = document.querySelector('#job-description').value; // Assuming you have a job description input field

    if (!file) {
        return alert('Please select a file.');
    }

    if (!jobDescription) {
        return alert('Please enter a job description.');
    }

    // Update button state
    event.target.disabled = true;
    event.target.textContent = 'Uploading...';
    event.target.classList.add('loading');

    const formData = new FormData();
    formData.append('resumeFile', file);
    formData.append('jobDescription', jobDescription);

    let analysisResult = {};
    try {
        // Send the file and job description to the backend server for processing
        const response = await fetch("http://localhost:3100/upload", {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Backend request failed with status: ${response.status}`);
        }

        analysisResult = await response.json();

    } catch (err) {
        console.error(err);
        resetButton(event);
        return alert('Something went wrong while processing the resume.');
    }

    // Render the parsed resume information and analysis results
    renderAnalysisResults(analysisResult);
    resetButton(event);
}

// Function to render analysis results on the page
function renderAnalysisResults(data) {
    const resultContainer = document.querySelector("#result-container");
    resultContainer.style.display = "block";
    resultContainer.innerHTML = ""; // Clear previous content

    if (!data.parsedResume) {
        return (resultContainer.innerHTML = '<p>No resume data available to display.</p>');
    }

    const { parsedResume, matchingScore, suggestions } = data;

    // Render parsed resume data
    const resumeInfo = `
        <h3>Resume Details</h3>
        <p><strong>Name:</strong> ${parsedResume.name || 'N/A'}</p>
        <p><strong>Email:</strong> ${parsedResume.email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${parsedResume.phone || 'N/A'}</p>
        <p><strong>LinkedIn:</strong> ${parsedResume.linkedin || 'N/A'}</p>
        <h4>Skills:</h4>
        <ul>
            ${parsedResume.skills.map(skill => `<li>${skill}</li>`).join('')}
        </ul>
    `;
    resultContainer.insertAdjacentHTML("beforeend", resumeInfo);

    // Render matching score and suggestions
    resultContainer.insertAdjacentHTML("beforeend", `
        <h4>Matching Score: ${matchingScore}</h4>
        <h4>Suggestions:</h4>
        <p>${suggestions}</p>
    `);
}
