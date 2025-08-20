import subprocess
import json
import sys


assignmentName = "basic-example-grader"
problems = ["helloworld", "problem2"]


def runGraders():
    for problemName in problems:
        try:
            result = subprocess.run(
                ["python3", problemName + "-grader.py", problemName],
                capture_output=True,
                text=True,
                check=True,
            )

            print(result.stdout)
            
        except subprocess.CalledProcessError as e:
            print(e.stderr)

def mergeFeedback():
    feedback = {"maxgrade": 0, "totalgrade": 0, "feedback": ""}

    for problemName in problems:
        try:
            problemResult = json.loads(open(problemName + "-feedback.txt", "r").read().strip())
            feedback["maxgrade"] += problemResult["maxgrade"]
            feedback["totalgrade"] += problemResult["grade"]
            feedback["feedback"] += f"{problemName} ({problemResult['grade']}/{problemResult['maxgrade']}):\n{problemResult['feedback']}\n\n"            
        except FileNotFoundError:
            feedback["feedback"] += f"ERROR: Feedback file for {problemName} not found.\n\n"
            

    with open("./feedback.txt", "w") as f:
            f.write("Grade: " + str(feedback["totalgrade"]) + "/" + str(feedback["maxgrade"]) + "\n\n")
            f.write(feedback["feedback"])
    with open("./grade.txt", "w") as f:
            f.write(str(feedback["totalgrade"]))
    

runGraders()
mergeFeedback()