from flask import Flask, request

app = Flask(__name__)

# Route to handle the file upload
@app.route('/upload', methods=['POST'])
def upload_file():
    # Get the file from the form submission
    file = request.files['file']

    if file:
        # Define the path where you want to save the file
        file_path = f'uploads/{file.filename}'
        file.save(file_path)
        return f'File uploaded successfully: {file.filename}', 200
    else:
        return 'No file selected', 400

if __name__ == '__main__':
    app.run(debug=True)
