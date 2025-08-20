

import os
def consume_disk_space(filename="large_file.bin", size_mb=100):
    """
    Creates a file and writes null bytes to it to consume disk space.

    Args:
        filename (str): The name of the file to create.
        size_mb (int): The target size of the file in megabytes.
    """
    try:
        # Calculate the size in bytes
        size_bytes = size_mb * 1024 * 1024

        # Open the file in binary write mode
        with open(filename, 'wb') as f:
            # Write null bytes to the file
            f.write(b'\0' * size_bytes)
        #print(f"Successfully created '{filename}' with size {size_mb} MB.")
    except IOError as e:
        print(f"Error creating file: {e}")

# Example usage: Consume 500 MB of disk space
consume_disk_space(size_mb=500)
print("Hello World!")