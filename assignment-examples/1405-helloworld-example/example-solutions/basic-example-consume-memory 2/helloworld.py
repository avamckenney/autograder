print("Hello World!")
memory_consumer_list = []
for _ in range(10**9):  # Create 10 million large strings
    memory_consumer_list.append("A" * 100) # Each string is 100 characters long
