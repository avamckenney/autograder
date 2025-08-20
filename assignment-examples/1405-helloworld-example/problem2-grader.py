import sys
import gradingtools

problemName = sys.argv[1]

expectedOutput = open("problem2-expectedoutput.txt", "r").read().strip()
result = gradingtools.runProcess(["python3", "problem2.py"])
grade = gradingtools.evalEqualOutput(result, expectedOutput, 10)
gradingtools.saveFeedback(problemName + "-feedback.txt", grade)