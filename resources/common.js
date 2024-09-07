function generateUniqueId() {
    return 'xxxx-xxxx-4xxx-yxxx-xxxx-xxxx-xxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

function toggleFormElements() {
    const formElements = document.getElementById('formElements');
    const button = document.getElementById('response_form');
    if (formElements.style.display === 'none') {
        formElements.style.display = 'block';
        button.style.display = 'none';
    } else {
        document.getElementById('select_members').value = "Team";
        document.getElementById('textarea').value = "";
        formElements.style.display = 'none';
        button.style.display = 'block';
    }
};

function submitResponseForm(responseCommand) {
    const dropdownValue = document.getElementById('select_members').value;
    const textareaValue = document.getElementById('textarea').value;
    let history_idValue = null;
    if(document.getElementById('history_id')) {
        history_idValue = document.getElementById('history_id').value;
    }
    vscode.postMessage({
        command: responseCommand,
        member: dropdownValue,
        text: textareaValue,
        history_id: history_idValue
    });
    toggleFormElements();
};

function createFormElements(history_id, target, responseCommand) {
    // Ensure the target element exists
    const container = document.getElementById(target);
    if (!container) {
        console.error('Target container not found');
        return;
    }

    // Create the toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'response_form';
    toggleButton.textContent = 'Respond Here';
    toggleButton.onclick = function() {
        toggleFormElements();
    };
    container.appendChild(toggleButton);

    // Create the container div for the form elements
    const formDiv = document.createElement('div');
    formDiv.id = 'formElements';

    if(history_id) {
        // Create the hidden input
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'history_id';
        hiddenInput.value = history_id;
        formDiv.appendChild(hiddenInput);
    }
    // Create the select element
    const select = document.createElement('select');
    select.id = 'select_members';

    // Create the first option
    const option = document.createElement('option');
    option.value = 'Team';
    option.textContent = 'Team';
    select.appendChild(option);

    formDiv.appendChild(select);

    // Create line breaks
    formDiv.appendChild(document.createElement('br'));
    formDiv.appendChild(document.createElement('br'));

    // Create the textarea
    const textarea = document.createElement('textarea');
    textarea.id = 'textarea';
    textarea.rows = 6;
    textarea.cols = 60;
    textarea.placeholder = 'Enter your text here...';
    formDiv.appendChild(textarea);

    // Create line breaks
    formDiv.appendChild(document.createElement('br'));
    formDiv.appendChild(document.createElement('br'));

    // Create the Submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.onclick = function() {
        submitResponseForm(responseCommand);
    };
    formDiv.appendChild(submitButton);

    // Create the Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = function() {
        toggleFormElements();
    };
    formDiv.appendChild(cancelButton);

    // Append the formDiv to the target container element
    container.appendChild(formDiv);
};

function setClickListener(obj, activator) {
    obj.removeEventListener('click', activator);
    obj.addEventListener('click', activator);
};