# Import Django application from WSGI
from dokuly.wsgi import application
from django.conf import settings

import cherrypy
import os
import sys

if __name__ == "__main__":
    # Disable the built-in http-server
    cherrypy.server.unsubscribe()

    # Instantiate a new server object
    server = cherrypy._cpserver.Server()

    # Configure the server object
    #Uncomment under for running on local PC
    
    server.socket_host = str(sys.argv[1])
    server.socket_port = int(sys.argv[2])
    # local server address
    # server.socket_host = "0.0.0.0"
    # server.socket_port = 8000

    # Server address
    # server.socket_port = 8888
    server.thread_pool = 30


    config = {
        'tools.staticdir.on' : True,
        # "tools.staticdir.debug" : True,
        # "log.screen" :  True,
        'tools.staticdir.dir': settings.STATIC_ROOT,
        'tools.expires.on': True,
        'tools.expires.secs': 86400
    }
    
    cherrypy.tree.mount(None, settings.STATIC_URL, {'/': config})

    # Mount application
    cherrypy.tree.graft(application, "/")

    # For SSL Support
    # server.ssl_module = 'pyopenssl'
    # server.ssl_certificate = 'ssl/certificate.crt'
    # server.ssl_private_key = 'ssl/private.key'
    # server.ssl_certificate_chain = 'ssl/bundle.crt'

    # Subscribe to this server
    server.subscribe()
    
    # Start the server engine
    cherrypy.engine.start()
    cherrypy.engine.block()