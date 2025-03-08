extends CharacterBody2D

@onready var parent = get_parent()

var canvas
var dir := Vector2(0,-1)
var speed := 500

func _ready():
	$Node2D.modulate = Color.ORANGE_RED

func _physics_process(delta):
	velocity = dir * speed
	speed -= delta * 320
	$Polygon2D.rotation_degrees += delta * 60
	$Node2D.rotation_degrees += delta * 60
	speed = max(speed, 0)
	
	if speed < 1:
		explode()
	
	move_and_slide()
	
	if (
		position.x < parent.get_node("TopLeft").position.x + 20 or
		position.y < parent.get_node("TopLeft").position.y + 20 or 
		position.x > parent.get_node("TopRight").position.x - 20
	):
		queue_free()

var is_exploding := false
func explode():
	visible = false
	set_physics_process(false)
	is_exploding = true
	$Area2D/CollisionShape2D.shape.radius = 90
	for i in range(25):
		canvas.paint(position+3*Vector2(randi()%51-25, randi()%51-25), 25+randi()%25, Color.ORANGE_RED.darkened(0.1+randf()*0.2))
		await get_tree().create_timer(0.01).timeout
	queue_free()


func _on_area_2d_body_entered(body):
	if not is_exploding:
		if body.is_in_group("Ink"):
			body.delete()
			explode()
		return
	
	if body.is_in_group("Ink"):
		body.delete()
