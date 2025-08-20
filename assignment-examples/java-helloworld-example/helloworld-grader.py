import gradingtools
import sys

problemName = sys.argv[1]

compile = gradingtools.runProcess(["javac", "HelloWorld.java"], 100 ) 
result = gradingtools.runProcess(["java", "HelloWorld"], 25 )
grade = gradingtools.evalEqualOutput(result, "Hello World!", 5)
gradingtools.saveFeedback(problemName + "-feedback.txt", grade)



           