document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = 'message';

    if (newPass.length < 4) {
        messageDiv.textContent = 'New password must be at least 8 characters.';
        messageDiv.classList.add('error');
        return;
    }
    if (newPass !== confirm) {
        messageDiv.textContent = 'New passwords do not match.';
        messageDiv.classList.add('error');
        return;
    }
    if (current === newPass) {
        messageDiv.textContent = 'New password must be different from current password.';
        messageDiv.classList.add('error');
        return;
    }

    changePassword(current, newPass, messageDiv);
});

async function changePassword(current, newPass, messageDiv){
    try {
        const response = await fetch(window.location.href, {
            method: 'POST', 
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                currentPassword: current,
                newPassword: newPass
            })
        });
        
        if (!response.ok) {
            const responseText = await response.text();
            messageDiv.textContent = `Error: ${responseText} (status: ${response.status}).`;
            messageDiv.classList.add('error');
            return;
        }

        if(response.status === 200) {
            const responseText = await response.text();
            messageDiv.textContent = responseText || 'Password changed successfully.';
            messageDiv.classList.add('success');
            document.getElementById('changePasswordForm').reset();
            setTimeout(() => {
                window.location.href = 'grader/login.html'; // Redirect to login page after success
            }, 2000); // Redirect after 2 seconds   
        }
    } catch (error) {
        messageDiv.textContent = `Error: ${error.message}).`;
        messageDiv.classList.add('error');
    }
}
    