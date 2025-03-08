extends CharacterBody2D

@onready var parent = get_parent()

var color := Color.ORANGE_RED
var canvas
var dir := Vector2(0,-1)
var speed := 200
var ifrac := 2
var timeout := 9999.0
var time := 0.0
var size_mult := 1.0

func _ready():
	$Polygon2D.color = color.darkened(0.3)

func _physics_process(delta):
	time += delta
	$Polygon2D.rotation_degrees += delta * 60
	if time > timeout:
		queue_free()
	velocity = dir * speed
	move_and_slide()
	if randi() % ifrac == 0:
		canvas.paint(position+Vector2(randi()%5-2, randi()%5-2),size_mult*(5+randi()%10), color.darkened(randf()*0.1))
	
	if randi() % 30 == 1:
		var drip = preload("res://Prefabs/drip.tscn").instantiate()
		drip.canvas = canvas
		drip.position = position
		drip.color = color.darkened(randf()*0.1)
		get_parent().add_child(drip)
	
	if (
		position.x < parent.get_node("TopLeft").position.x + 20 or
		position.y < parent.get_node("TopLeft").position.y + 20 or 
		position.x > parent.get_node("TopRight").position.x - 20
	):
		queue_free()
	

func _on_area_2d_body_entered(body):
	
	if body.is_in_group("Static"):
		for i in range(10):
			canvas.paint(position+3*Vector2(randi()%21-10, randi()%21-10), 20+randi()%10, color.darkened(randf()*0.1))
		queue_free()
	
	if body.is_in_group("Ink"):
		body.delete()
		for i in range(10):
			canvas.paint(position+3*Vector2(randi()%21-10, randi()%21-10), 20+randi()%10, color.darkened(randf()*0.1))
		queue_free()
