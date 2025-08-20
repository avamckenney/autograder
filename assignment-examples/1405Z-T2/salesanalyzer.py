import random

def get_number_purchases(filename, customer = "*"):
    filein = open(filename, "r")
    name = filein.readline().strip()
    count = 0
    while name != "":
        desktops = int(filein.readline().strip())
        laptops = int(filein.readline().strip())
        tablets = int(filein.readline().strip())
        toasters = int(filein.readline().strip())
        cost = float(filein.readline().strip())
    
        if customer == "*" or customer == name:
            count += 1
            
        name = filein.readline().strip()
    return count
    
def get_number_customer_purchases(filename, customer):
    return get_number_purchases(filename, customer)
    
def get_total_purchases(filename, customer = "*"):
    filein = open(filename, "r")
    name = filein.readline().strip()
    total = 0
    while name != "":
        desktops = int(filein.readline().strip())
        laptops = int(filein.readline().strip())
        tablets = int(filein.readline().strip())
        toasters = int(filein.readline().strip())
        cost = float(filein.readline().strip())
                
        if customer == "*" or customer == name:
            total += cost
            
        name = filein.readline().strip()
    return total
    
def get_total_customer_purchases(filename, customer):
    return get_total_purchases(filename, customer)
    
def get_average_purchases(filename, customer = "*"):
    num = float(get_number_purchases(filename, customer))
    if num == 0:
        return 0
    return get_total_purchases(filename, customer) / num
    
def get_average_customer_purchases(filename, customer):
    return get_average_purchases(filename, customer)
    
def get_most_popular_product(filename):
    filein = open(filename, "r")
    name = filein.readline().strip()
    numLaptops = 0
    numDesktops = 0
    numToasters = 0
    numTablets = 0
    while name != "":
        desktops = int(filein.readline().strip())
        numDesktops += desktops
        laptops = int(filein.readline().strip())
        numLaptops += laptops
        tablets = int(filein.readline().strip())
        numTablets += tablets
        toasters = int(filein.readline().strip())
        numToasters += toasters
        cost = float(filein.readline().strip())
        name = filein.readline().strip()
    
    if numLaptops > numDesktops and numLaptops > numToasters and numLaptops > numTablets:
        return "Laptop"
    elif numDesktops > numToasters and numDesktops > numTablets:
        return "Desktop"
    elif numTablets > numToasters:
        return "Tablet"
    else:
        return "Toaster"