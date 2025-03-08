extends CharacterBody2D

func _ready():
	await get_tree().create_timer(0.7).timeout
	$Area2D.monitoring = false


func _on_area_2d_body_entered(body):
	if body.is_in_group("Ink"):
		body.delete()
