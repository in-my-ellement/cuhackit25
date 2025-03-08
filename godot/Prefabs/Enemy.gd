extends CharacterBody2D

var target
var canvas

signal died

func _ready():
	add_to_group("Ink")

func _physics_process(delta):
	if not is_instance_valid(target):
		return
	velocity = (target.position - position).normalized() * 100 * (1+get_parent().time/80)
	move_and_slide()
	if randi() % 5 == 1:
		canvas.paint(position+Vector2(randi()%3-1, randi()%3-1), 7+randi()%15, Color(0,0,0,1))
	if randi() % 40 == 1:
		var drip = preload("res://Prefabs/drip.tscn").instantiate()
		drip.canvas = canvas
		drip.position = position
		get_parent().add_child(drip)
	
	if (position - target.position).length_squared() < 10:
		get_parent().get_node("InkGrowTimer").wait_time += 1.25
		get_parent().get_node("InkGrowTimer").start()
		get_parent().ink_grow_mult = 2.5
		queue_free()

func delete():
	died.emit()
	queue_free()
