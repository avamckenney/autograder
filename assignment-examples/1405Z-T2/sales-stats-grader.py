import sys
import gradingtools


problemName = "sales-stats"
expectedOutput = open("sales-stats-tester-output.txt", "r")
inputs = open("sales-stats-tester-input.txt", "r")
import salesanalyzer

inputFiles = ["salesinfo0.txt", "salesinfo1.txt", "salesinfo2.txt", "salesinfo3.txt", "salesinfo4.txt", "salesinfo5.txt"]
inputNames = ["Adrian", "Pascal", "Dave"]
totalGrade = 0
maxGrade = 0
feedback = "P1 Number of Sales Statistics:\n"


partMax = 0
partGrade = 0

#test get number of purchases
allPassed = True
for inputFile in inputFiles:
    try:
        output = salesanalyzer.get_number_purchases(inputFile)
        result = gradingtools.evalEqualDoubles(output, 
        float(expectedOutput.readline().strip()), 0.006, 1)
        feedback += "get_number_purchases({}): ".format(inputFile)
        if result["grade"] == result["maxgrade"]:
            feedback += "success\n"
        else:
            feedback += "incorrect\n"
            allPassed = False
            
    except Exception as e:
        print("Error: " + str(e))
        raise
partGrade = 0
partMax = 2
if allPassed:
    partGrade = partMax
feedback += "Summary: {}/{}\n\n".format(partGrade, partMax)
totalGrade += partGrade
maxGrade += partMax


feedback += "P1 Total Purchases Statistics:\n"
#test get total purchases
allPassed = True
for inputFile in inputFiles:
    try:
        output = salesanalyzer.get_total_purchases(inputFile)
        result = gradingtools.evalEqualDoubles(output, float(expectedOutput.readline().strip()), 0.006, 1)
        feedback += "get_number_purchases({}): ".format(inputFile)
        if result["grade"] == result["maxgrade"]:
            feedback += "success\n"
        else:
            feedback += "incorrect\n"
            allPassed = False
    except Exception as e:
        print("Error: " + str(e))
        raise
partGrade = 0
partMax = 2
if allPassed:
    partGrade = partMax
feedback += "Summary: {}/{}\n\n".format(partGrade, partMax)
totalGrade += partGrade
maxGrade += partMax


#test get_average_purchases
feedback += "P1 Average Purchases Statistics:\n"
allPassed = True
for inputFile in inputFiles:
    try:
        output = salesanalyzer.get_average_purchases(inputFile)
        result = gradingtools.evalEqualDoubles(output, float(expectedOutput.readline().strip()), 0.006, 1)
        feedback += "get_number_purchases({}): ".format(inputFile)
        if result["grade"] == result["maxgrade"]:
            feedback += "success\n"
        else:
            feedback += "incorrect\n"
            allPassed = False
    except Exception as e:
        print("Error: " + str(e))
        raise
partGrade = 0
partMax = 2
if allPassed:
    partGrade = partMax
feedback += "Summary: {}/{}\n\n".format(partGrade, partMax)
totalGrade += partGrade
maxGrade += partMax


#test get_number_customer_purchases 
feedback += "P2 Number of Sales for Customer Statistics:\n"
allPassed = True
for inputFile in inputFiles:
    for inputName in inputNames:
        try:
            output = salesanalyzer.get_number_customer_purchases(inputFile, inputName)
            result = gradingtools.evalEqualDoubles(output, float(expectedOutput.readline().strip()), 0.006, 1)
            feedback += "get_number_customer_purchases({}, {}): ".format(inputFile, inputName)
            if result["grade"] == result["maxgrade"]:
                feedback += "success\n"
            else:
                feedback += "incorrect\n"
                allPassed = False
        except Exception as e:
            print("Error: " + str(e))
            raise
partGrade = 0
partMax = 2
if allPassed:
    partGrade = partMax
feedback += "Summary: {}/{}\n\n".format(partGrade, partMax)
totalGrade += partGrade
maxGrade += partMax


#test get_total_customer_purchases
feedback += "P2 Total Sales for Customer Statistics:\n"
allPassed = True
for inputFile in inputFiles:
    for inputName in inputNames:
        try:
            output = salesanalyzer.get_total_customer_purchases(inputFile, inputName)
            result = gradingtools.evalEqualDoubles(output, float(expectedOutput.readline().strip()), 0.006, 1)
            feedback += "get_total_customer_purchases({}, {}): ".format(inputFile, inputName)
            if result["grade"] == result["maxgrade"]:
                feedback += "success\n"
            else:
                feedback += "incorrect\n"
                allPassed = False
        except Exception as e:
            print("Error: " + str(e))
            raise
partGrade = 0
partMax = 2
if allPassed:
    partGrade = partMax
feedback += "Summary: {}/{}\n\n".format(partGrade, partMax)
totalGrade += partGrade
maxGrade += partMax


#test get_average_customer_purchases
feedback += "P2 Average Sales for Customer Statistics:\n"
allPassed = True
for inputFile in inputFiles:
    for inputName in inputNames:
        try:
            output = salesanalyzer.get_average_customer_purchases(inputFile, inputName)
            result = gradingtools.evalEqualDoubles(output, float(expectedOutput.readline().strip()), 0.006, 1)
            feedback += "get_average_customer_purchases({}, {}): ".format(inputFile, inputName)
            if result["grade"] == result["maxgrade"]:
                feedback += "success\n"
            else:
                feedback += "incorrect\n"
                allPassed = False
        except Exception as e:
            print("Error: " + str(e))
            raise
partGrade = 0
partMax = 2
if allPassed:
    partGrade = partMax
feedback += "Summary: {}/{}\n\n".format(partGrade, partMax)
totalGrade += partGrade
maxGrade += partMax

#test get_most_popular_product
feedback += "P3 Most Popular Product:\n"
allPassed = True
for inputFile in inputFiles:
    try:
        output = salesanalyzer.get_most_popular_product(inputFile)
        result = gradingtools.evalEqualValues(output, expectedOutput.readline().strip(), 1)
        feedback += "get_most_popular_product({}): ".format(inputFile)
        if result["grade"] == result["maxgrade"]:
            feedback += "success\n"
        else:
            feedback += "incorrect\n"
            allPassed = False
    except Exception as e:
        print("Error: " + str(e))
        raise
partGrade = 0
partMax = 3
if allPassed:
    partGrade = partMax
feedback += "Summary: {}/{}\n\n".format(partGrade, partMax)
totalGrade += partGrade
maxGrade += partMax

feedback += "Sales Stats Total Grade: {}/{}\n\n\n".format(totalGrade, maxGrade)

output = {"maxgrade": maxGrade, "grade": totalGrade, "expected": "", "output":"", "error":"", "feedback": feedback}

print(feedback)
gradingtools.saveFeedback(problemName + "-feedback.txt", output)