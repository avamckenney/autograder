import subprocess
import json
'''
Returns dictionary with format 
{
    result: success| timeout | exception,
    stdout: <stdout output>,
    stderr: <stderr output>
}
'''
def runProcess(cmdList, timeoutArgument=10):
    result = None
    try:
        result = subprocess.run(
            cmdList,
            capture_output=True,
            text=True,
            check=True,
            timeout=timeoutArgument
        )
        
        return {"result": "success", "stdout": result.stdout.strip(), "stderr": result.stderr.strip()}
    except subprocess.TimeoutExpired as e:
        return {"result": "timeout", "stdout": e.stdout.strip() if e.stdout else "", "stderr": e.stderr.strip() if e.stderr else ""}
    except subprocess.CalledProcessError as e:
        if result != None:
            return {"result": "exception", "stdout": result.stdout.strip(), "stderr": result.stderr}
        return {"result": "exception", "stdout": "", "stderr": e.stderr.strip() if e.stderr else ""}
        
#all or nothing comparison of stdout and expected output
def evalEqualOutput(result, expected, totalGrade):
    output = {"maxgrade": totalGrade, "expected": expected, "output": result["stdout"], "error": result["stderr"], "grade": 0, "feedback": ""}

    if result.get("result") == "exception":
        output["feedback"] = "Did not run successfully."
    elif result.get("result") == "timeout":
        output["feedback"] = "Timed out while running."
    elif result.get("result") == "success" and result.get("stdout") == expected:
        output["grade"] = totalGrade
        output["feedback"] = "Successfully completed"
    elif result.get("result") == "success" and result.get("stdout") != expected:
        output["feedback"] = "Incorrect output."
    else:
        output["feedback"] = "Unexpected problem with autograder."
    
    return output

    
def evalEqualValues(result, expected, totalGrade):
    output = {"maxgrade": totalGrade, "expected": expected, "output": result, "grade": 0, "feedback": ""}
    if result == expected:
        output["grade"] = totalGrade
        output["feedback"] = "Successfully completed"
    else:
        output["feedback"] = "Incorrect output (result=" + str(result) +", expected=" + str(expected)+")."
    
    return output
    
def evalEqualDoubles(result, expected, precision, totalGrade):
    output = {"maxgrade": totalGrade, "expected": float(expected), "output": result, "grade": 0, "feedback": ""}

    diff = abs(result - expected)
    if diff < precision:
        output["grade"] = totalGrade
        output["feedback"] = "Successfully completed"
    else:
        output["feedback"] = "Incorrect output (result=" + str(result) +", expected=" + str(expected)+")."
    
    return output



def saveFeedback(filename, grade):
    with open(filename, "w") as f:
        f.write(json.dumps(grade))
