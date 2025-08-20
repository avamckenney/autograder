
async function checkFeedback(){
    //make request to server to check for feedback
    const url = window.location.href + '/feedback';

    try {
        const response = await fetch(url, { headers: {"Accept": "text/plain",},});
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        if(response.status === 204) {
            const feedbackElement = document.getElementById('execution-feedback');
            if (feedbackElement) {
                feedbackElement.innerHTML = "Execution is still pending. Please wait for the evaluation to complete.";
            }

            //update last checked time
            const lastCheckedElement = document.getElementById('execution-status');
            if (lastCheckedElement) {
                lastCheckedElement.style.color = "grey"; // Change color to indicate pending status
                lastCheckedElement.innerHTML = `<strong>Status:</strong> pending (last checked at ${new Date().toString()})`;
            }

            //if not available yet, set a timeout to check again in 5 seconds
            setTimeout(() => {
                checkFeedback();
            }, 5000);
            
            return; // No content, exit the function
        }else{
            const result = await response.json();

            const lastCheckedElement = document.getElementById('execution-status');
            if (lastCheckedElement) {
                if(result.status === 'completed'){
                    lastCheckedElement.style.color = "green"; // Change color to indicate pending status
                    lastCheckedElement.innerHTML = `<strong>Status:</strong> completed (last checked at ${new Date().toString()})`;
                }else if(result.status === 'failed'){
                    lastCheckedElement.style.color = "red"; // Change color to indicate pending status
                    lastCheckedElement.innerHTML = `<strong>Status:</strong> failed (last checked at ${new Date().toString()})`;
                }
            }

            const feedbackElement = document.getElementById('execution-feedback');
            if (feedbackElement) {
                feedbackElement.innerHTML = result.feedback;
            }

            const executionTimeElement = document.getElementById('execution-time');
            if (executionTimeElement) {
                executionTimeElement.innerHTML = `<strong>Time to Grade:</strong> ${result.executionTime} seconds`;
            }
            const finishedAtElement = document.getElementById('finished-at');
            if (finishedAtElement) {
                finishedAtElement.innerHTML = `<strong>Finished At:</strong> ${new Date(result.finishedAt).toString()}`;
            }

            const gradeElement = document.getElementById('grade');
            if (gradeElement) {
                gradeElement.innerHTML = `<strong>Grade:</strong> ${result.gradeText}`;
            }
        }
    } catch (error) {
        console.error(error.message);
    }
}

checkFeedback();