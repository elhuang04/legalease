import os

string = "testingstring/jfosjf/fs.pdf"
file_name = os.path.basename(string)
directory_length = len(string) - len(file_name)

print(string[:directory_length])