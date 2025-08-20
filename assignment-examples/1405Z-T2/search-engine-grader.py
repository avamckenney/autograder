import sys
import gradingtools

problemName = "search-engine"

expectedOutput = open("sales-stats-tester-output.txt", "r")
inputs = open("sales-stats-tester-input.txt", "r")
import searchengine

totalGrade = 0
maxGrade = 0


words = ["apple", "pear", "banana", "peach"]
countResults = {"apple":"N-4.txt", "pear":"N-4.txt", "banana":"N-0.txt", "peach":"N-4.txt"}
ratioResults = {"apple":"N-1.txt", "pear":"N-3.txt", "banana":"N-0.txt", "peach":"N-1.txt"}

feedback = "Get Max Count Tests:\n"
try:
    allPassed = True
    for word in words:
        output = searchengine.get_max_count_page(word)
        result = gradingtools.evalEqualValues(output, countResults[word], 1)
        feedback += word + ": "
        if result["grade"] == result["maxgrade"]:
            feedback += "success\n"
        else:
            feedback += "incorrect\n"
            allPassed = False
            
    if allPassed:
        feedback += "Max Count Grade: 5/5 \n\n"
        totalGrade += 5
    else:
        feedback += "Max Count Grade: 0/5 \n\n"
    maxGrade += 5
except Exception as e:
    print("Error: " + str(e))
    raise
    
feedback += "Get Max Ratio Tests:\n"
try:
    allPassed = True
    for word in words:
        output = searchengine.get_max_ratio_page(word)
        result = gradingtools.evalEqualValues(output, ratioResults[word], 1)
        feedback += word + ": "
        if result["grade"] == result["maxgrade"]:
            feedback += "success\n"
        else:
            feedback += "incorrect\n"
            allPassed = False
    if allPassed:
        feedback += "Max Ratio Grade: 5/5 \n\n"
        totalGrade += 5
    else:
        feedback += "Max Ratio Grade: 0/5 \n\n"
    maxGrade += 5
except Exception as e:
    print("Error: " + str(e))
    raise
    
feedback += "Search Engine Total Grade: {}/{}".format(totalGrade, maxGrade)

output = {"maxgrade": maxGrade, "grade": totalGrade, "expected": "", "output":"", "error":"", "feedback": feedback}

print(feedback)
gradingtools.saveFeedback(problemName + "-feedback.txt", output)