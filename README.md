# Redirect Reporter

## About
Redirect reporter is a SEO tool that enables redirection testing for large data
set and it tries to test them as fast as possible.

### Perquisites
  1-  NodeJS:
      You will need NodeJs. Currently using version `v8.12.0`.

  2- Same folder structure as the zip file
      essentially you need a root folder, with a 2 subfolders
      (resources, results, credentials). 'index.js' must be in the root folder.

### How to run?

#### mac

  1- Navigate to where the folder is located.

  2- Add all your urls to the resources folder and save it as an .csv file

  3- run the following command

  ```
    node index.js input.csv result.txt
  ```

  N.B: For the input and output files you can name them anything you like.

#### windows

  1- Navigate to where the folder is located.

  2- Add all your urls to the resources folder and save it as an .txt file
     (.csv files will work. However, if your URL has comma it will not give you
       accurate results)

  3- Run the below command


  ```
    node index.js input.csv result.txt
  ```

N.B: In windows, due to the encoding issues, you will need to make sure that the
     text file is stored as utf-8 encoding.

     There is a specific script for windows. So make sure you choose the right
     script to run. There is no significant changes. It only complies to the
     file system module in NodeJs.

#### About the results     

    The Script generates results that looks as follows.

    Original Url  Status-Code Final-redirect-url Status Code.

    It is a tab separated results. As some urls do have commas, hence a csv is
    messy looking.

    N.B: Import the result.txt (any result file), to Excel or any similar
         software for clear organized looking output.

#### Credentials

    - If you have some private domains where you require credentials. You will
    need to add these credentials in the credentials folder. (linux, mac)

    - For windows you will need to physically change the variables  
          username
          password
      in the script itself.

###  Limitations        

  1- Currently the script sends a 100 request at a given moment.

  2- Currently the script is using https only and will not work on http.  


### Solutions

    1- If your server can handle more than that without timing out constantly
       and closing the socket, feel free to increase the value of the 'bulk'
       variable in the script.


    2- Implement a function that sends the requests with http if the urls are
       using http.


    N.B: There is a quicker fix for the http problem. You can go on the script
         and change the following

    ```
      //original - line 2
      const https = require('https');

      //change it to
      const https = require('http');
    ```
    Make sure you only change the require https to http and not the
    variable name, if you chose to go for the quick fix.

# Extra Modifications
## On the next version:
  I will be adding option tags where you only have one script
  and you can simply add `-get` to use the GET Method.

  Also I will be adding the option to specify if it is an http or https.
  `-http` and default will be https.
