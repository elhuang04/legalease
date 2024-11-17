import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
const API_KEY = 'AIzaSyCfZMKtSWtaAFLRRz34eM2hyo3sGBpuwcw';

const uploadCard = document.getElementById('upload-card');
const pdfContainer = document.getElementById('pdf-container');
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
let highlightedText = "";

// PDF Upload and Rendering
document.getElementById('file-upload').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = function () {
      const pdfData = new Uint8Array(reader.result);
      loadPdf(pdfData);
    };
    reader.readAsArrayBuffer(file);
  }
});

function loadPdf(pdfData) {
  pdfjsLib.getDocument(pdfData).promise.then(pdf => {
    const totalPages = pdf.numPages;
    pdfContainer.innerHTML = ''; // Clear container before adding new content
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      pdf.getPage(pageNumber).then(page => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.0 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        page.render({ canvasContext: ctx, viewport: viewport }).promise.then(() => {
          pdfContainer.appendChild(canvas);
        });
      });
    }
  });
}

// Handle right-click to capture selected text
pdfContainer.addEventListener('mouseup', function () {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    highlightedText = selectedText;
  }
});

// Context Menu for inserting highlighted text into chatbot
pdfContainer.addEventListener('contextmenu', function (event) {
  event.preventDefault();
  if (highlightedText) {
    insertTextToChatbot(highlightedText);
  }
});

// Show loading spinner
function showLoadingSpinner() {
  const loadingSpinner = document.createElement('div');
  loadingSpinner.classList.add('loading-spinner');
  loadingSpinner.textContent = 'Retrieving response from AI...';
  chatbox.appendChild(loadingSpinner);
  return loadingSpinner;
}

// Chatbot Logic
async function handleUserInput(text) {
  const userMessage = document.createElement('div');
  userMessage.classList.add('message', 'user-message');
  userMessage.textContent = `User: ${text}`;
  chatbox.appendChild(userMessage);

  const loadingSpinner = showLoadingSpinner();

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `I want legal advice on ${text}.`;
    const result = await model.generateContent(prompt);

    loadingSpinner.remove(); // Remove loading spinner once response is received

    console.log(result.response.text());

    const botMessage = document.createElement('div');
    botMessage.classList.add('message', 'bot-message');
    botMessage.textContent = `Chatbot: ${result.response.text()}`;
    chatbox.appendChild(botMessage);
  } catch (error) {
    loadingSpinner.remove(); // Remove loading spinner in case of error

    const errorMessage = document.createElement('div');
    errorMessage.classList.add('message', 'bot-message');
    errorMessage.textContent = `Chatbot: I'm sorry, something went wrong.`;
    chatbox.appendChild(errorMessage);
  }
}

function insertTextToChatbot(text) {
  handleUserInput(text);
}

// Onclick function for send button
window.handleSend = function() {
  const text = userInput.value.trim();
  if (text) {
    insertTextToChatbot(text);
    userInput.value = ''; // Clear input box
  }
};

// Event listener for Enter key
userInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    handleSend();
  }
});

// Add event listeners to category buttons
document.querySelectorAll('.category-button').forEach(button => {
  button.addEventListener('click', () => {
    const adviceText = `I want legal advice on ${button.textContent.trim()}`;
    userInput.value = adviceText;
    handleSend();
  });
});
