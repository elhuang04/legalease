const uploadCard = document.getElementById('upload-card');
const pdfContainer = document.getElementById('pdf-container');
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
let highlightedText = "";

document.getElementById('file-upload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    uploadCard.style.display = 'none';
    const reader = new FileReader();
    reader.onload = function() {
      const pdfData = new Uint8Array(reader.result);
      loadPdf(pdfData);
    };
    reader.readAsArrayBuffer(file);
  }
});

function loadPdf(pdfData) {
  pdfjsLib.getDocument(pdfData).promise.then(pdf => {
    const totalPages = pdf.numPages;
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
pdfContainer.addEventListener('mouseup', function() {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    highlightedText = selectedText;
  }
});

// Context Menu for inserting highlighted text into chatbot
pdfContainer.addEventListener('contextmenu', function(event) {
  event.preventDefault();
  if (highlightedText) {
    insertTextToChatbot(highlightedText);
  }
});

function insertTextToChatbot(text) {
  const userMessage = document.createElement('div');
  userMessage.classList.add('message', 'user-message');
  userMessage.textContent = `User: ${text}`;
  chatbox.appendChild(userMessage);
  
  // Send the text to chatbot (simulated here)
  setTimeout(() => {
    const botMessage = document.createElement('div');
    botMessage.classList.add('message', 'bot-message');
    botMessage.textContent = `Chatbot: Here's the information you selected: "${text}"`;
    chatbox.appendChild(botMessage);
  }, 500);
}

// Handle manual text input
sendBtn.addEventListener('click', function() {
  const text = userInput.value;
  if (text) {
    insertTextToChatbot(text);
    userInput.value = ''; // Clear input box
  }
});
