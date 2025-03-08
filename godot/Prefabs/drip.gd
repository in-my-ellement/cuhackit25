extends CharacterBody2D

var timeout := 2.5
var color := Color(0,0,0,1)
var canvas

func _physics_process(delta):
	velocity = Vector2(0,1) * 20
	move_and_slide()
	if randi() % 5 == 1:
		canvas.paint(position+Vector2(randi()%3-1, randi()%3-1), (3+randi()%5), color)
	timeout -= delta
	if timeout < 0:
		queue_free()
	
