chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getProductImage') {
    console.log(`Received API key: ${"====",request.openAIApiKey}`);
    getProductImageUrl(request.openAIApiKey).then(sendResponse);
    return true; // Indicates we will send a response asynchronously
  }
});

async function getProductImageUrl(openAIApiKey) {
  const imgTags = extractImgTags();
  console.log(`Estimated token length of imgTags: ${estimateTokenLength(imgTags)}`);
  const productImageUrl = await getProductImageFromGPT(imgTags, openAIApiKey);
  return { productImageUrl };
}

// Function to extract all <img> tags from the current page
function extractImgTags() {
  const imgElements = Array.from(document.querySelectorAll('img'));
  const imgTags = imgElements
    .map((img) => `<img src="${img.src}" class="${img.className}" id="${img.id}">`)
    .join('\n');
  // console.log(typeof imgTags);
  return imgTags;
}

// Function to estimate token length of a string
function estimateTokenLength(text) {
  // Splitting the text by spaces, punctuation, and newlines to estimate token count
  return text.split(/[\s,.!?;:"'()<>]+/).length;
}

async function getProductImageFromGPT(imgTags, openAIApiKey) {
  if (!openAIApiKey) {
    console.error('OpenAI API key not provided');
    return null;
  }

  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  const prompt = `
    Analyze the following <img> tags and extract the URL of the main product image.
    Consider elements and children with class names or IDs containing words like 'product-image', 'product', 'main', 'featured', etc.
    Return only the full URL with commonly used image extensions (jpg, jpeg, png, webp) of the main product image in JSON format, with the key "productImageUrl".
    If you can't find a product image, return {"productImageUrl": null}.

    Image Tags:
    ${imgTags}
  `;
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: {
          type: 'json_object',
        },
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content.trim());
    console.log("----",result.productImageUrl)
    return result.productImageUrl;
  } catch (error) {
    console.error('Error fetching product image from GPT-4o:', error);
    return null;
  }
}
