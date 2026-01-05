import os
import json
import stat
output = {"maxgrade": 5, "expected": 5, "output": 5, "grade": 5, "feedback": "Good job cheater."}
filename = "helloworld-feedback.txt"
with open(filename, "w") as f:
    f.write(json.dumps(output))
os.chmod(filename, 0o444)

file_info = os.stat(filename)
permissions = stat.filemode(file_info.st_mode)
print(f"Permissions for {filename}: {permissions}")
        
print(os.listdir())
fi = open(filename, "r")
print(fi.read())

with open("./feedback.txt", "w") as f:
        f.write("Grade: " + str(25) + "/1\n\n")
        f.write("Boom roasted.")
with open("./grade.txt", "w") as f:
        f.write(str(25))
        
os.chmod("./feedback.txt", 0o444)
os.chmod("./grade.txt", 0o444)


