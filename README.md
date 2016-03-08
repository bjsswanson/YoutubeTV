Node based solution for playing iPlayer, Youtube and uploaded videos remotely through a TV via a connected RaspberryPi.

iPlayer videos, Youtube videos, playlists and channels can be entered into the left hand box and the system will add them to the list of currently playing videos on the right.

Google API key required in the config.js file.

iPlayer and uploaded videos are downloaded to a local location specified in config.js file. The remaining usable location is visible on the page.

Days of the week and times are defined in the config.js files to determine when to play videos.

Front end is built using Bootstrap.
Backend is Node.js

node_modules include:
express - web application framework
express-handlebars - handlebars view engine for express
googleapis - connecting to Youtube Data API to retrieve video information
qs - parsing user provided Youtube Urls
socket.io - to pass added/removed/playing video information to all connected clients in real time
diskspace - used to determine the amount of remaining available space
multer - file upload handling

Requires omxplayer and get_iplayer (both can be obtained via apt-get)
