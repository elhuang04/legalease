import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
const API_KEY = 'AIzaSyCfZMKtSWtaAFLRRz34eM2hyo3sGBpuwcw';

const editBtn = document.getElementById('edit-btn');
const uploadCard = document.getElementById('upload-card');
const pdfContainer = document.getElementById('pdf-container');
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let highlightedText = "";
let isSelecting = false;
let startX, startY, endX, endY;
let currentPageNumber = 1; // Track the current page number
let canvases = []; // Store canvases for multi-page PDF rendering

// PDF Upload and Rendering
document.getElementById('file-upload').addEventListener('change', function (event) {
  editBtn.style.display = 'inline-block';
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
    canvases = [];
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      pdf.getPage(pageNumber).then(page => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.0 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.dataset.pageNumber = pageNumber; // Associate canvas with page number
        canvases[pageNumber - 1] = canvas;

        page.render({ canvasContext: ctx, viewport: viewport }).promise.then(() => {
          pdfContainer.appendChild(canvas);
        });
      });
    }
  });
}

// Update current page based on click location
pdfContainer.addEventListener('click', function (event) {
  const targetCanvas = event.target.closest('canvas');
  if (targetCanvas) {
    currentPageNumber = parseInt(targetCanvas.dataset.pageNumber, 10);
  }
});

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

    const prompt = text;
    const result = await model.generateContent(prompt);

    loadingSpinner.remove();

    const botMessage = document.createElement('div');
    botMessage.classList.add('message', 'bot-message');
    botMessage.textContent = `Chatbot: ${result.response.text()}`;
    chatbox.appendChild(botMessage);
  } catch (error) {
    loadingSpinner.remove();

    const errorMessage = document.createElement('div');
    errorMessage.classList.add('message', 'bot-message');
    errorMessage.textContent = `Chatbot: I'm sorry, something went wrong.`;
    chatbox.appendChild(errorMessage);
  }
}

function insertTextToChatbot(text) {
  handleUserInput(text);
}

// Show loading spinner
function showLoadingSpinner() {
  const loadingSpinner = document.createElement('div');
  loadingSpinner.classList.add('loading-spinner');
  loadingSpinner.textContent = 'Retrieving response from AI...';
  chatbox.appendChild(loadingSpinner);
  return loadingSpinner;
}

// Onclick function for send button
window.handleSend = function () {
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

// Handle screenshot selection
editBtn.addEventListener('click', () => {
  isSelecting = true;
  pdfContainer.style.cursor = 'crosshair';
});

pdfContainer.addEventListener('mousedown', (event) => {
  if (!isSelecting) return;

  const targetCanvas = event.target.closest('canvas');
  if (!targetCanvas) return;

  startX = event.offsetX;
  startY = event.offsetY;

  const selectionBox = document.createElement('div');
  selectionBox.classList.add('selection-box');
  pdfContainer.appendChild(selectionBox);

  const onMouseMove = (event) => {
    endX = event.offsetX;
    endY = event.offsetY;

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    selectionBox.style.transform = `translate(${left}px, ${top}px)`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
  };

  const onMouseUp = () => {
    isSelecting = false;
    pdfContainer.style.cursor = 'default';
    pdfContainer.removeEventListener('mousemove', onMouseMove);
    pdfContainer.removeEventListener('mouseup', onMouseUp);

    captureScreenshot(targetCanvas, startX, startY, endX, endY);
    selectionBox.remove(); // Remove the visual selection box
  };

  pdfContainer.addEventListener('mousemove', onMouseMove);
  pdfContainer.addEventListener('mouseup', onMouseUp);
});

function captureScreenshot(canvas, startX, startY, endX, endY) {
  const ctx = canvas.getContext('2d');
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  const screenshotCanvas = document.createElement('canvas');
  screenshotCanvas.width = width;
  screenshotCanvas.height = height;
  const screenshotCtx = screenshotCanvas.getContext('2d');
  screenshotCtx.drawImage(canvas, Math.min(startX, endX), Math.min(startY, endY), width, height, 0, 0, width, height);

  const imageDataURL = screenshotCanvas.toDataURL('image/png');

  ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
  ctx.fillRect(Math.min(startX, endX), Math.min(startY, endY), width, height);
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(Math.min(startX, endX), Math.min(startY, endY), width, height);

  insertImageToChatbot(imageDataURL, currentPageNumber);
}

async function insertImageToChatbot(imageDataUR, pageNumber) {
  const userMessage = document.createElement('div');
  userMessage.classList.add('message', 'user-message');
  userMessage.textContent = 'User: (document section selected)';
  chatbox.appendChild(userMessage);

  const loadingSpinner = showLoadingSpinner();

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const myfile = await genAI.uploadFile(new File([imageDataURL], "screenshot.png", { type: "image/png" }));
    console.log(`myfile=${myfile}`);

    const model = new genAI.GenerativeModel("gemini-1.5-flash");
    const result = await model.generateContent([
      myfile,
      "\n\n",
      "Can you tell me about the information in this screenshot?"
    ]);

    loadingSpinner.remove();

    const botMessage = document.createElement('div');
    botMessage.classList.add('message', 'bot-message');
    botMessage.textContent = `Chatbot: ${result.text}`;
    chatbox.appendChild(botMessage);
  } catch (error) {
    loadingSpinner.remove();

    const errorMessage = document.createElement('div');
    errorMessage.classList.add('message', 'bot-message');
    errorMessage.textContent = `Chatbot: I'm sorry, something went wrong.`;
    chatbox.appendChild(errorMessage);
  }
}

// Add event listeners to category buttons
document.querySelectorAll('.category-button').forEach(button => {
  button.addEventListener('click', () => {
    const adviceText = `I want legal advice on ${button.textContent.trim()}`;
    userInput.value = adviceText;
    handleSend();
  });
});