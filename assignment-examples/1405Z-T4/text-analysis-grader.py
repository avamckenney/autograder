import analysis
import gradingtools
problemName = "text-analysis"


penalties = 0
feedback = "Text Analysis:\n"

print("testfile1.txt")
analysis.load("testfile1.txt")
if (analysis.countall() != 51):
    penalties += 1
    
if (analysis.countunique() != 5):
    penalties +=1
    print('analysis.countunique() should be 5')
if (analysis.commonword(["apple","peach","pear"]) != "apple"):
    penalties +=1
    print('analysis.commonword(["apple","peach","pear"]) should be apple')
if (analysis.commonword(["coconut","peach","banana"]) != "peach"):
    penalties +=1
    print('analysis.commonword(["coconut","peach","banana"]) should be peach')
if (analysis.commonword(["pear","banana"]) != "pear"):
    penalties +=1
    print('analysis.commonword(["pear","banana"]) should be pear')
if (analysis.commonword(['apple','peach','pear','coconut','banana']) != "apple"):
    penalties +=1    
    print("analysis.commonword(['apple','peach','pear','coconut','banana']) should be apple")
if (analysis.commonword(['plum','orange']) != None):
    penalties +=1
    print("analysis.commonword(['plum','orange']) should be None")
if (analysis.commonpair("apple") != "coconut" and analysis.commonpair("apple") != "peach"):
    penalties +=1
    print('analysis.commonpair("apple") should be coconut or peach')
if (analysis.commonpair("pear") != "apple"):
    penalties +=1
    print('analysis.commonpair("pear") should be apple')
if (analysis.commonpair("banana") != "peach"):
    penalties +=1
    print('analysis.commonpair("banana") should be peac')
if (analysis.commonpair("orange") != None):
    penalties +=1
    print('analysis.commonpair("orange") should be None')

print("testfile2.txt")
analysis.load("testfile2.txt")
if (analysis.countall() != 84):
    penalties +=1
    print('analysis.countall() should be 84')
if (analysis.countunique() != 5):
    penalties +=1
    print('analysis.countunique() should be 15')
if (analysis.commonword(["apple","peach","pear"]) != "apple"):
    penalties +=1
    print('analysis.commonword(["apple","peach","pear"]) should be apple')
if ( analysis.commonword(["coconut","peach","banana"]) != "coconut"):
    penalties +=1
    print('analysis.commonword(["coconut","peach","banana"]) should be coconut')
if (analysis.commonword(["pear","banana"]) != "pear"):
    penalties +=1
    print('analysis.commonword(["pear","banana"]) should be pear')
if (analysis.commonword(['apple','peach','pear','coconut','banana']) != "coconut"):
    penalties +=1
    print("analysis.commonword(['apple','peach','pear','coconut','banana']) should be coconut")
if (analysis.commonword(['plum','orange']) != None):
    penalties +=1
    print("analysis.commonword(['plum','orange']) should be None")
if (analysis.commonpair("apple") != "coconut" and analysis.commonpair("apple") != "peach"):
    penalties +=1
    print('analysis.commonpair("apple") should be coconut or peach')
if (analysis.commonpair("pear") != "apple"):
    penalties +=1
    print('analysis.commonpair("pear") should be apple')
if (analysis.commonpair("banana") != "apple"):
    penalties +=1
    print('analysis.commonpair("banana") should be apple')
if (analysis.commonpair("orange") != None):
    penalties +=1
    print('analysis.commonpair("orange") should be None')

print("testfile3.txt")
analysis.load("testfile3.txt")
if (analysis.countall() != 86):
    penalties +=1
    print('analysis.countall() should be 86')
if (analysis.countunique() != 5):
    penalties +=1
    print('analysis.countunique() should be 5')
    
grade = 10 - penalties
if grade < 0:
    grade = 0
feedback = "Number of penalties: " + str(penalties) + "\nGrade: " + str(grade)
output = {"maxgrade": 10, "grade": grade, "expected": "", "output":"", "error":"", "feedback": feedback}

print(feedback)
gradingtools.saveFeedback(problemName + "-feedback.txt", output)
    
    
'''
if ( != ""):
    penalties +=1
if ( != ""):
    penalties +=1
if ( != ""):
    penalties +=1
if ( != ""):
    penalties +=1
if ( != ""):
    penalties +=1
if ( != ""):
    penalties +=1
if ( != ""):
    penalties +=1
if ( != ""):
    penalties +=1
if ( != ""):
    penalties +=1
if ( != ""):
    penalties +=1


print('Getting common word out of ['apple','peach','pear'] - should be peach")
print(analysis.commonword(["apple","peach","pear"]))
print('Getting common word out of ['coconut','peach','banana'] - should be peach")
print(analysis.commonword(["coconut","peach","banana"]))
print('Getting common word out of ['pear','banana'] - should be pear")
print(analysis.commonword(["pear","banana"]))
print('Getting common word out of ['apple','peach','pear','coconut','banana'] - should be peach")
print(analysis.commonword(['apple','peach','pear','coconut','banana']))
print('Getting common word out of ['plum','orange'] - should be None")
print(analysis.commonword(['plum','orange']))
print('Getting common pair for 'apple' - should be peach")
print(analysis.commonpair("apple"))
print('Getting common pair for 'pear' - should be coconut or pear")
print(analysis.commonpair("pear"))
print('Getting common pair for 'banana' - should be peach")
print(analysis.commonpair("banana"))
print('Getting common pair for 'orange' - should be None")
print(analysis.commonpair("orange"))
print()
print()

print('Analysis for testfile4.txt")
analysis.load("testfile4.txt")
print('Getting total word count - should be 71")
print(analysis.countall())
print('Getting unique word count - should be 5")
print(analysis.countunique())
print('Getting common word out of ['apple','peach','pear'] - should be peach")
print(analysis.commonword(["apple","peach","pear"]))
print('Getting common word out of ['coconut','peach','banana'] - should be peach")
print(analysis.commonword(["coconut","peach","banana"]))
print('Getting common word out of ['pear','banana'] - should be pear")
print(analysis.commonword(["pear","banana"]))
print('Getting common word out of ['apple','peach','pear','coconut','banana'] - should be peach")
print(analysis.commonword(['apple','peach','pear','coconut','banana']))
print('Getting common word out of ['plum','orange'] - should be None")
print(analysis.commonword(['plum','orange']))
print('Getting common pair for 'apple' - should be peach")
print(analysis.commonpair("apple"))
print('Getting common pair for 'pear' - should be peach")
print(analysis.commonpair("pear"))
print('Getting common pair for 'banana' - should be pear")
print(analysis.commonpair("banana"))
print('Getting common pair for 'orange' - should be None")
print(analysis.commonpair("orange"))
print()
print()

print('Analysis for testfile5.txt")
analysis.load("testfile5.txt")
print('Getting total word count - should be 99")
print(analysis.countall())
print('Getting unique word count - should be 5")
print(analysis.countunique())
print('Getting common word out of ['apple','peach','pear'] - should be apple")
print(analysis.commonword(["apple","peach","pear"]))
print('Getting common word out of ['coconut','peach','banana'] - should be banana")
print(analysis.commonword(["coconut","peach","banana"]))
print('Getting common word out of ['pear','banana'] - should be banana")
print(analysis.commonword(["pear","banana"]))
print('Getting common word out of ['apple','peach','pear','coconut','banana'] - should be apple")
print(analysis.commonword(['apple','peach','pear','coconut','banana']))
print('Getting common word out of ['plum','orange'] - should be None")
print(analysis.commonword(['plum','orange']))
print('Getting common pair for 'apple' - should be banana")
print(analysis.commonpair("apple"))
print('Getting common pair for 'pear' - should be coconut, peach, or apple")
print(analysis.commonpair("pear"))
print('Getting common pair for 'banana' - should be apple")
print(analysis.commonpair("banana"))
print('Getting common pair for 'orange' - should be None")
print(analysis.commonpair("orange"))
'''