import sys
import gradingtools

problemName = sys.argv[1]

expectedOutput = open("problem2-expectedoutput.txt", "r").read().strip()
compile = gradingtools.runProcess(["javac", "Problem2.java"], 100)
result = gradingtools.runProcess(["java", "Problem2"], 100)
grade = gradingtools.evalEqualOutput(result, expectedOutput, 10)
gradingtools.saveFeedback(problemName + "-feedback.txt", grade)