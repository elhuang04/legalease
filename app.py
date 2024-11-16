from flask import Flask, render_template, request, jsonify
import openai
import pdfkit
import os

app = Flask(__name__)

# OpenAI API Key (make sure it's securely stored in environment or config)
openai.api_key = 'YOUR_OPENAI_API_KEY'

# Route to render the main page
@app.route('/')
def index():
    return render_template('index.html')  # Ensure your HTML file is named correctly

@app.route('/upload', methods=['POST'])
def upload_pdf():
    file = request.files['file']
    file_path = os.path.join('uploads', file.filename)  # Store file in 'uploads' directory
    file.save(file_path)

    # Convert the saved PDF to HTML
    html_file = pdfkit.from_file(file_path, False)  # False returns HTML as a string
    
    # Return the HTML as response
    return jsonify(html=html_file)

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('input')
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=user_input,
            max_tokens=100
        )
        return jsonify(response=response.choices[0].text.strip())
    except Exception as e:
        return jsonify(error=str(e)), 500

if __name__ == '__main__':
    app.run(debug=True)
