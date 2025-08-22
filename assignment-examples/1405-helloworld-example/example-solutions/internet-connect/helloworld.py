import urllib.request

try:
    link = "http://www.google.ca"
    f = urllib.request.urlopen(link)
    myfile = f.read()

    print("Hello World!")
except:
    print("OOPS!")