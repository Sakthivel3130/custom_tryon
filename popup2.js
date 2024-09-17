document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submitButton');
    const personFileInput = document.getElementById('personFileInput');
    const clothFileInput = document.getElementById('clothFileInput');
    const personImage = document.getElementById('personImage');
    const clothImage = document.getElementById('clothImage');
    const responseImage = document.getElementById('responseImage');

    // Function to display image
    function displayImage(file, imgElement) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgElement.src = e.target.result;
            imgElement.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    // Handle file input change event
    function handleFileInputChange(inputElement, imgElement) {
        const file = inputElement.files[0];
        if (file) {
            displayImage(file, imgElement);
        }
    }

    // Handle drag and drop events
    function handleDrop(event, imgElement, inputElement) {
        event.preventDefault();
        event.stopPropagation();
        
        const file = event.dataTransfer.files[0];
        if (file) {
            displayImage(file, imgElement);
            inputElement.files = event.dataTransfer.files; // Update input element files
        }
    }

    // Add event listeners for file inputs
    personFileInput.addEventListener('change', function() {
        handleFileInputChange(this, personImage);
    });

    clothFileInput.addEventListener('change', function() {
        handleFileInputChange(this, clothImage);
    });

    // Add event listeners for drag and drop areas
    function setupDragAndDrop(target, imgElement, inputElement) {
        target.addEventListener('dragover', function(event) {
            event.preventDefault();
            event.stopPropagation();
            target.style.backgroundColor = '#e0e0e0'; // Highlight the container
        });

        target.addEventListener('dragleave', function(event) {
            event.preventDefault();
            event.stopPropagation();
            target.style.backgroundColor = '#fff'; // Revert background color
        });

        target.addEventListener('drop', function(event) {
            handleDrop(event, imgElement, inputElement);
            target.style.backgroundColor = '#fff'; // Revert background color
        });
    }

    // Setup drag-and-drop for person and cloth areas
    setupDragAndDrop(document.querySelector('.image-container:nth-child(1)'), personImage, personFileInput);
    setupDragAndDrop(document.querySelector('.image-container:nth-child(2)'), clothImage, clothFileInput);

    // Handle the submit button click
    submitButton.addEventListener('click', async function() {
        const personFile = personFileInput.files[0];
        const clothFile = clothFileInput.files[0];
        const clothType = document.getElementById('textInput').value;

        if (!personFile || !clothFile || !clothType) {
            alert('Please select both files and enter the cloth type.');
            return;
        }
        console.log(personFile,clothFile,clothType)
        const formData = new FormData();
        formData.append('person_image', personFile);
        formData.append('cloth_image', clothFile);
        formData.append('cloth_type', clothType);

        try {
            const response = await fetch('http://144.126.254.225:8000/catvton', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to process the images.');
            }

            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);

            responseImage.src = imageUrl;
            responseImage.style.display = 'block';

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing the images.');
        }
    });

    // Add close button functionality with delay
    const closeButton = document.createElement('div');
    closeButton.innerHTML = '&#10005;'; // Unicode for close icon
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '24px';
    closeButton.style.color = '#333';
    closeButton.style.backgroundColor = '#fff';
    closeButton.style.borderRadius = '50%';
    closeButton.style.padding = '5px';
    closeButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
    closeButton.title = 'Close';

    document.body.appendChild(closeButton);

    closeButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'closePopup' });
    });

    // Set a timer to close the popup after 10 seconds
    setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'closePopup' });
    }, 100000000); // 10000 milliseconds = 10 seconds
});
