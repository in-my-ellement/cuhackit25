extends CharacterBody2D

var target
var canvas

func _ready():
	pass

func _physics_process(delta):
	if not is_instance_valid(target):
		return
	velocity = (target.position - position).normalized() * 100
	move_and_slide()
	if randi() % 5 == 1:
		canvas.paint(position+Vector2(randi()%5-2, randi()%5-2), 15+randi()%15, Color(0,0,0,1))
	
	if (position - target.position).length_squared() < 10:
		queue_free()
	
