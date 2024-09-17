document
  .getElementById('settingsForm')
  .addEventListener('submit', function (e) {
    e.preventDefault();
    const openAIApiKey = document.getElementById('openAIApiKey').value;

    localStorage.setItem('openAIApiKey', openAIApiKey);

    document.getElementById('saveSettings').innerHTML = 'Saved';
    setTimeout(() => {
      if (openAIApiKey) {
        hideSettings();
      }
    }, 100000);
  });

// Populate form with existing OpenAI API key
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('openAIApiKey').value =
    localStorage.getItem('openAIApiKey') || '';
});
