Node based solution for playing Youtube Videos remotely through a TV via a connected RaspberryPi.
 
Requires a Google API key in a file called api.key - This is used to talk to Google's Youtube Data API to retrieve video and playlist details

Videos and Playlists can be entered into the left hand box and the system will add them to the list of currently playing videos on the right.

Front end is built using Bootstrap.
Backend is pure Node.js

node_modules include:
express
googleapis - connecting to Youtube Data API to retrieve video information
qs - parsing user provided Youtube Urls
socket.io - to pass added/removed/playing video information to all connected clients in real time

Todo:

Persist current playing through restarts
Have clients refresh playing list after server restart (in case of lost items persisting client side)

