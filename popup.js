document.addEventListener('DOMContentLoaded', function () {
  const tryOnButton = document.getElementById('tryOn');
  const resultDiv = document.getElementById('result');
  const loader = document.getElementById('loader');
  const loadingMessage = document.getElementById('loadingMessage');
  const personImageInput = document.getElementById('personImage');

  let selectedImageUrl = null;

  loadLastResult();

  const uploadNewImage = document.createElement('label');
  uploadNewImage.id = 'uploadNewImage';
  uploadNewImage.textContent = '+';
  uploadNewImage.setAttribute('for', 'personImage');
  document.getElementById('cachedImages').appendChild(uploadNewImage);

  personImageInput.addEventListener('change', function () {
    if (this.files.length > 0) {
      const file = this.files[0];
      const reader = new FileReader();
      reader.onload = function (e) {
        uploadNewImage.innerHTML = `
          <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">
          <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; color: white; text-shadow: 0 0 3px rgba(0,0,0,0.5);">+</span>
        `;
        selectedImageUrl = e.target.result; // Use the uploaded image URL directly
        tryOnButton.disabled = false;
      };
      reader.readAsDataURL(file);
      // Deselect any previously selected cached image
      document
        .querySelectorAll('.cached-image')
        .forEach((img) => img.classList.remove('selected'));
    } else {
      resetUploadButton();
      tryOnButton.disabled = !selectedImageUrl;
    }
  });

  tryOnButton.addEventListener('click', function () {
    if (selectedImageUrl) {
      startVirtualTryOn(selectedImageUrl);
    } else {
      alert('Please select an image or upload a new one.');
    }
  });

  function resetUploadButton() {
    uploadNewImage.innerHTML = '<span style="font-size: 24px;">+</span>';
  }

  function startVirtualTryOn(personImageUrl) {
    loader.style.display = 'block';
    loadingMessage.style.display = 'block';
    resultDiv.textContent = '';
    tryOnButton.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentPageUrl = tabs[0].url; // Get the current page URL
      const openAIApiKey = localStorage.getItem('openAIApiKey');
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          files: ['content.js'],
        },
        () => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: 'getProductImage', openAIApiKey: openAIApiKey },
            function (response) {
              if (response && response.productImageUrl) {
                performVirtualTryOn(
                  personImageUrl,
                  response.productImageUrl,
                  currentPageUrl
                );
              } else {
                showError("Couldn't find product image.");
              }
            }
          );
        }
      );
    });
  }

  function showError(message) {
    loader.style.display = 'none';
    loadingMessage.style.display = 'none';
    resultDiv.innerHTML = message;
    tryOnButton.disabled = false;
  }

  function performVirtualTryOn(personImageBase64, clothImageUrl, currentPageUrl) {
    // Convert base64 image to Blob
    const personImageBlob = dataURLToBlob(personImageBase64);

    // Fetch the cloth image as a Blob
    fetch(clothImageUrl)
        .then(response => response.blob())
        .then(clothImageBlob => {
            const formData = new FormData();
            formData.append('person_image', personImageBlob, 'personImage.jpg');
            formData.append('cloth_image', clothImageBlob, 'clothImage.jpg');
            formData.append('cloth_type', 'upper'); // or other value based on your needs

            return fetch('http://144.126.254.225:8001/catvton', {
                method: 'POST',
                body: formData
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob(); // Assuming the server returns the image as a Blob
        })
        .then(resultBlob => {
            const resultUrl = URL.createObjectURL(resultBlob);
            displayResult(resultUrl);
        })
        .catch(error => {
            showError('Could not perform virtual try-on: ' + error.message);
        });
}

function dataURLToBlob(dataURL) {
    if (!dataURL.startsWith('data:')) {
        throw new Error('Invalid data URL');
    }

    const [header, data] = dataURL.split(',');
    if (!header.startsWith('data:')) {
        throw new Error('Invalid data URL header');
    }

    const mimeString = header.split(':')[1].split(';')[0];
    try {
        const byteString = atob(data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    } catch (e) {
        throw new Error('Error decoding base64 string: ' + e.message);
    }
}


  function displayResult(imageUrl) {
    loader.style.display = 'none';
    loadingMessage.style.display = 'none';
    resultDiv.innerHTML = `<img src="${imageUrl}" alt="Try-On Result">`;

    // Save the last result URL to localStorage
    localStorage.setItem('lastResultUrl', imageUrl);
    tryOnButton.disabled = false;
  }

  function loadLastResult() {
    const lastResultUrl = localStorage.getItem('lastResultUrl');
    if (lastResultUrl) {
      displayResult(lastResultUrl);
    }
  }

  const settingsButton = document.getElementById('settingsButton');
  settingsButton.addEventListener('click', toggleSettings);

  checkAndShowSettings();

  function checkAndShowSettings() {
    const openAIApiKey = localStorage.getItem('openAIApiKey');

    if (!openAIApiKey) {
      showSettings();
    }
  }
});
