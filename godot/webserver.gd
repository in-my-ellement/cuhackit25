extends Node

var websocket_url = "ws://198.21.177.59:2025"

var socket := WebSocketPeer.new()

var id_to_player := {}
var id_to_scores := {}

signal client_connected(data)

func _ready():
	print("those who scrum together")		
	randomize()
	print(socket.connect_to_url(websocket_url))

func register_player(id: String, player):
	if not id in id_to_scores:
		id_to_scores[id] = 0
		id_to_player[id] = player

func parse_data(data: Dictionary):
	if data.id in id_to_player and is_instance_valid(id_to_player[data.id]):
		id_to_player[data.id].update_data(data)
	else:
		client_connected.emit(data)

func _process(delta):
	socket.poll()
	var state = socket.get_ready_state()
	if state == WebSocketPeer.STATE_OPEN:
		if randi() % 100 == 1:
			socket.send(PackedByteArray([1,1,1,1,1,1,1,1,1]))
		while socket.get_available_packet_count():
			var str = ""
			for ascii_val in socket.get_packet():
				str += char(ascii_val)
			var json = JSON.new()
			var error = json.parse(str)
			if error == OK:
				var data_received = json.data
				if typeof(data_received) == TYPE_DICTIONARY:
					parse_data(data_received)
				else:
					print("Unexpected data")
			else:
				print("JSON Parse Error: ", json.get_error_message(), " in ", str, " at line ", json.get_error_line())
	elif state == WebSocketPeer.STATE_CLOSING:
		# Keep polling to achieve proper close.
		pass
	elif state == WebSocketPeer.STATE_CLOSED:
		var code = socket.get_close_code()
		var reason = socket.get_close_reason()
		print("WebSocket closed with code: %d, reason %s. Clean: %s" % [code, reason, code != -1])
		set_process(false) # Stop processing.
