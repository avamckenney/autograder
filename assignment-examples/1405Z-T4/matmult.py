
import random
import math

def mult_scalar(mat, scale):
	result = []
	for row in range(len(mat)):
		result.append([])
		for col in range(len(mat[row])):
			result[row].append(mat[row][col] * scale)
	return result

def mult_matrix(a, b):
	if(len(a) == 0 or len(b) == 0):
		raise Exception("Matrix length of 0")
	if len(a[0]) != len(b):
		raise Exception("Matrix dimensions are not compatible")
		
	result = []
	for row in range(len(a)):
		new_row = []
		for col in range(len(b[0])):
			dot_prod = 0
			for i in range(len(a[0])):
				dot_prod += a[row][i] * b[i][col]
			new_row.append(dot_prod)
		result.append(new_row)
	return result
	
def euclidean_dist(a,b):
	if len(a) != 1 or len(b) != 1:
		raise Exception("Euclidean dist must be calculated on two vectors")
	if len(a[0]) != len(b[0]):
		raise Exception("Vector dimensions are not compatible")
	
	total = 0
	for i in range(len(a[0])):
		total += (a[0][i] - b[0][i]) * (a[0][i] - b[0][i])
	return math.sqrt(total)
	
def web_solution(X, Y):
	result = [[sum(a*b for a,b in zip(X_row,Y_col)) for Y_col in zip(*Y)] for X_row in X]
	return result

def generate_mat(rows, cols):
	result = []
	for row in range(rows):
		new_row = []
		for col in range(cols):
			new_row.append(random.randint(0,10))
		result.append(new_row)
	return result
	
def generate_tests():
	fileout = open("matmult-tester.py", "w")
	size = 10
	fileout.write("import matmult\n")
	
	fileout.write("\n\n\n")
	
	fileout.write("def check_equality(a, b):\n")
	fileout.write("  if len(a) != len(b):\n")
	fileout.write("    return False\n")
		
	fileout.write("  for row in range(len(a)):\n")
	fileout.write("    if len(a[row]) != len(b[row]):\n")
	fileout.write("      return False\n")
	fileout.write("    for col in range(len(a[row])):\n")
	fileout.write("      if a[row][col] != b[row][col]:\n")
	fileout.write("        return False\n")
	fileout.write("  return True\n")
	
	fileout.write("\n\n\n")
	
	for repeat in range(size):
		rows_a = random.randint(1,10)
		cols_a = random.randint(1,10)
		a = generate_mat(rows_a, cols_a)
		scalar = random.randint(0,10)
		
		fileout.write("a = " + str(a) + "\n")
		fileout.write("scalar = " + str(scalar) + "\n")
		fileout.write("expected = " + str(mult_scalar(a,scalar)) + "\n")
		fileout.write("result = matmult.mult_scalar(a,scalar)\n")
		fileout.write("if not check_equality(expected,result):\n")
		fileout.write("  raise Exception('Scalar Case #" + str(repeat) + " Failed:\\n a = ' + str(a) + '\\nscalar = ' + str(scalar) + '\\n result = ' + str(result))\n")
		fileout.write("\n\n\n")
		
	fileout.write("print('Scalar multiplication tests completed successfully')\n")
	
	fileout.write("\n\n\n")
	
	for repeat in range(size):
		rows_a = random.randint(1,10)
		cols_a = random.randint(1,10)
		cols_b = random.randint(1,10)
		a = generate_mat(rows_a, cols_a)
		b = generate_mat(cols_a, cols_b)
		
		fileout.write("a = " + str(a) + "\n")
		fileout.write("b = " + str(b) + "\n")
		fileout.write("expected = " + str(mult_matrix(a,b)) + "\n")
		fileout.write("result = matmult.mult_matrix(a,b)\n")
		fileout.write("if not check_equality(expected,result):\n")
		fileout.write("  raise Exception('Matrix Case #" + str(repeat) + " Failed:\\n a = ' + str(a) + '\\nb = ' + str(b) + '\\n result = ' + str(result))\n")
		fileout.write("\n\n\n")
		
	fileout.write("print('Matrix multiplication tests completed successfully')")
	
	
	fileout.write("\n\n\n")
	
	for repeat in range(size):
		cols_a = random.randint(1,10)
		a = generate_mat(1, cols_a)
		b = generate_mat(1, cols_a)
		
		fileout.write("a = " + str(a) + "\n")
		fileout.write("b = " + str(b) + "\n")
		fileout.write("expected = " + str(euclidean_dist(a,b)) + "\n")
		fileout.write("result = matmult.euclidean_dist(a,b)\n")
		fileout.write("if abs(result - expected) > 0.001:\n")
		fileout.write("  raise Exception('Euclidean Case #" + str(repeat) + " Failed:\\n a = ' + str(a) + '\\nb = ' + str(b) + '\\n result = ' + str(result))\n")
		fileout.write("\n\n\n")
	fileout.write("print('Euclidean distance tests completed successfully')")
	
	fileout.close()

'''
equality function

a = [...]
b = [...]
expected = [...]
call student mult(a,b)
check expected and result
'''

	
def check_equality(a, b):
	if len(a) != len(b):
		return False
	
	for row in range(len(a)):
		if len(a[row]) != len(b[row]):
			return False
		for col in range(len(a[row])):
			if a[row][col] != b[row][col]:
				return False
	return True
	
def main():
	a = [[9, 4, 1],[2, 5, 7],[8,3,1],[9,9,9]]
	b = [[5,5,4,2,1],[3,7,8,4,3], [1,1,1,1,1]]

	x = mult_matrix(a,b)
	print(x)
	y = web_solution(a,b)
	print(y)
	#print(mult_scalar(a,5))
	print(check_equality(x,y))

	
	count_success = 0
	for repeat in range(10000):
		rows_a = random.randint(1,10)
		cols_a = random.randint(1,10)
		cols_b = random.randint(1,10)
		
		a = generate_mat(rows_a, cols_a)
		b = generate_mat(cols_a, cols_b)
		
		print(a)
		print(b)
		
		my_result = mult_matrix(a,b)
		true_result = web_solution(a,b)
		if check_equality(my_result, true_result):
			count_success += 1
		else:
			raise Exception("Incorrect result")
	print("Successes: " + str(count_success))
			
generate_tests()