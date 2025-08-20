

freqs = {}
count = 0
unique = 0
followCounts = {}
def load(str):
    global freqs, count, unique, followCounts
    freqs = {}
    followCounts = {}
    unique = 0
    words = open(str, "r").read().split(" ")
    count = len(words)
    last = None
    for word in words:
        if word not in freqs:
            unique += 1
            freqs[word] = 0
            followCounts[word] = {}
        freqs[word] += 1
        if last != None:
            if word not in followCounts[last]:
                followCounts[last][word] = 0
            followCounts[last][word] += 1
        last = word
    print("followCounts",followCounts)
        
        
def commonword(l):
    if len(l) == 0:
        return None
    common = None
    commonCount = -1
    for word in l:
        if word in freqs and freqs[word] > commonCount:
                commonCount = freqs[word]
                common = word
    return common
    
def commonpair(str):
    if str not in followCounts:
        return None
    maxCount = -1
    maxWord = None
    for word in followCounts[str]:
        if followCounts[str][word] > maxCount:
            maxCount = followCounts[str][word]
            maxWord = word
    return maxWord
    
def countall():
    return count
    
def countunique():
    return unique