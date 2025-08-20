import gradingtools
import sys

problemName = sys.argv[1]

result = gradingtools.runProcess(["python3", "helloworld.py"], 25   )
grade = gradingtools.evalEqualOutput(result, "Hello World!", 5)
gradingtools.saveFeedback(problemName + "-feedback.txt", grade)



           