extends Node2D

func _ready():
	print(Webserver.listen(4242))
	Webserver.client_connected.connect(connected)
	Webserver.client_disconnected.connect(disconnected)
	Webserver.message_received.connect(message_recieved)

func connected(client):
	print("client connected: ", client)

func disconnected(client):
	print("client disconnected: ", client)

func message_recieved(client, message):
	print("message recieved from: ", client, " message: ", message)
