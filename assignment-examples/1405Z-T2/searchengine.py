
maxpage = None
maxpageratio = None
maxcount = -1
maxratio = -1
import random
def get_max_count_page(searchword):    
    return get_max_page(searchword, "count")

def get_max_ratio_page(searchword):
    return get_max_page(searchword, "ratio")


def get_max_page(searchword, mode):
    maxpage = None
    maxpageratio = None
    maxcount = -1
    maxratio = -1
    
    pagelist = open("pages.txt", "r")

    for page in pagelist:
        page = page.strip()
        pagein = open(page, "r")
        count = 0
        countall = 0
        countmatch = 0

        for word in pagein:
            word = word.strip()
            if word == searchword:
                countmatch += 1
                count += 1
            countall += 1
        pagein.close()

        if count > maxcount:
            maxcount = count
            maxpage = page
        ratio = 0
        if countall > 0:
            ratio = countmatch / countall
        if ratio > maxratio:
            maxratio = ratio
            maxpageratio = page
        
    pagelist.close()
    if mode == "count":
        return maxpage
    elif mode == "ratio":
        return maxpageratio
    else:
        return "???"
    

'''
searchword = input("Enter a word to search for: ")

pagelist = open("pages.txt", "r")

for page in pagelist:
    page = page.strip()
    pagein = open(page, "r")
    count = 0
    countall = 0
    countmatch = 0

    for word in pagein:
        word = word.strip()
        if word == searchword:
            countmatch += 1
            count += 1
        countall += 1
    pagein.close()

    if count > maxcount:
        maxcount = count
        maxpage = page
    ratio = 0
    if countall > 0:
        ratio = countmatch / countall
    if ratio > maxratio:
        maxratio = ratio
        maxpageratio = page
    
pagelist.close()

print("Max Page (Count): " + maxpage)
print("Max Count: " + str(maxcount))
print("Max Page (Ratio): " + maxpageratio)
print("Max Ratio: " + str(maxratio))
'''
    
