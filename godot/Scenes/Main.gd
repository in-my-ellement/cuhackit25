extends Node2D

var amplitude1 = 0.5 * 40
var amplitude2 = 0.3 * 30
var amplitude3 = 0.2 * 30
var amplitude4 = 0.15  * 30# New component

var wave_number1 = 2.0 * 0.01
var wave_number2 = 5.0 * 0.01
var wave_number3 = 8.0 * 0.01
var wave_number4 = 12.0  * 0.01 # New component - higher frequency

var angular_freq1 = 1.0
var angular_freq2 = 2.0
var angular_freq3 = 5.0
var angular_freq4 = 1.5   # New component - slower frequency

var phase1 = 0.0
var phase2 = PI/4.0
var phase3 = -PI/6.0
var phase4 = PI/3.0  # New component

# Optional damping factors
var damping1 = 0
var damping2 = 0
var damping3 = 0
var damping4 = 0  # New component

# Base height variation parameters
var variation_amplitude = 0.8
var variation_scale = 0.05

# Turbulence parameters
var turbulence_strength = 0.1
var turbulence_scale = 20.0
var noise = FastNoiseLite.new()

var time := 0.0
var ink_height := 160.0
var ink_grow_mult := 1.0

@onready var topleft : Vector2 = $TopLeft.position
@onready var vlen : float = $TopRight.position.x - $TopLeft.position.x

func _ready():
	#return
	$StaticBody2D.add_to_group("Static")
	Websocket.gesture_recieved.connect(gesture_recieved)


func base_height_variation(x: float) -> float:
	# Create a non-uniform base height profile
	return variation_amplitude * sin(variation_scale * x) + 0.5 * variation_amplitude * sin(variation_scale * x * 0.3) +0.2 * variation_amplitude * sin(variation_scale * x * 0.7)

# Calculate turbulence/noise at a position and time
func get_turbulence(x: float, t: float) -> float:
	# Use noise to create natural turbulence
	return turbulence_strength * noise.get_noise_2d(x * turbulence_scale, t * turbulence_scale)

# Calculate the height at a given position and time
func height(x: float, t: float) -> float:
	# Base wave equation with four sinusoidal components
	var wave1 = amplitude1 * exp(-damping1 * t) * sin(wave_number1 * x - angular_freq1 * t + phase1)
	var wave2 = amplitude2 * exp(-damping2 * t) * sin(wave_number2 * x - angular_freq2 * t + phase2)
	var wave3 = amplitude3 * exp(-damping3 * t) * sin(wave_number3 * x - angular_freq3 * t + phase3)
	var wave4 = amplitude4 * exp(-damping4 * t) * sin(wave_number4 * x - angular_freq4 * t + phase4)

	# Add base height variation
	var base_variation = base_height_variation(x)

	# Add turbulence
	var turbulence = get_turbulence(x, t)
	
	# Combine all components with base variation
	return wave1 + wave2 + wave3 + wave4 + base_variation + turbulence

func _process(delta):
	
	if ink_height < 140:
		ink_height = 140
	if ink_height > 890:
		get_tree().reload_current_scene()
	
	time += delta
	ink_height += delta * 8 * ink_grow_mult
	
	var poly = []
	
	poly.append($TopRight.position)
	poly.append($TopLeft.position)
	
	#poly.append($BottomLeft.position)
	#poly.append($TopLeft.position + Vector2(0,20))
	#poly.append($TopRight.position + Vector2(0,20))
	var dist = $TopRight.position.x - $TopLeft.position.x
	var sampling = 250
	for i in range(sampling):
		var h = height(i * 950 / sampling, time)
		var vec = Vector2(-500-h, 0).rotated(PI-PI*float(i)/sampling)
		#poly.append($CenterBottom.position + vec)
		poly.append(Vector2( $TopLeft.position.x + i * dist / (sampling - 1), $TopLeft.position.y + ink_height + h))
	$Ink.polygon = poly
	
	#poly.append($BottomRight.position)
	#poly.append($TopRight.position)
	#poly.append($TopLeft.position)
	
	if Input.is_action_just_pressed("lmb"):
		#slash($CenterBottom.get_local_mouse_position().angle())
		emit_proj($CenterBottom.get_local_mouse_position().angle())
	
	if Input.is_action_just_pressed("rmb"):
		bomb($CenterBottom.get_local_mouse_position().angle())
	
	if randi() % 300 == 1:
		var enemy := preload("res://Prefabs/enemy.tscn").instantiate()
		enemy.died.connect(_enemy_died)
		enemy.position = topleft + Vector2((randi()%100)*vlen/(100-1), 0)
		enemy.target = $CenterBottom
		enemy.canvas = $Canvas
		add_child(enemy)

var colidx = 0
var cols := [
	Color.ORANGE_RED,
	Color.PALE_VIOLET_RED,
	Color.YELLOW,
	Color.ORANGE
]
func gesture_recieved(data):
	var pattern = data["gesture"]["pattern"]
	var col = cols[colidx]
	colidx += 1
	colidx = colidx % cols.size()
	if data["gesture"]["score"] < 0.69:
		emit_proj(
			deg_to_rad(-data["heading"]) - PI/2, col
		)
	if pattern == "slash":
		shield(
			deg_to_rad(-data["heading"]) - PI/2, col
		)
	if pattern == "circle":
		bomb(
			deg_to_rad(-data["heading"]) - PI/2, col
		)
	if pattern == "pigtail":
		slash(
			deg_to_rad(-data["heading"]) - PI/2, col
		)

func _enemy_died():
	if ink_grow_mult > 1:
		return
	$InkGrowTimer.wait_time += 1.5
	$InkGrowTimer.start()
	ink_grow_mult = -1

func emit_proj(angle := PI/2, col := Color.ORANGE_RED):
	var paint := preload("res://Prefabs/paint.tscn").instantiate()
	paint.canvas = $Canvas
	paint.color = col
	paint.position = $CenterBottom.position
	paint.dir = Vector2(1,0).rotated(angle)
	add_child(paint)

func bomb(angle := PI/2, col := Color.ORANGE_RED):
	var paint := preload("res://Prefabs/star.tscn").instantiate()
	paint.canvas = $Canvas
	paint.position = $CenterBottom.position
	paint.dir = Vector2(1,0).rotated(angle)
	add_child(paint)

func shield(angle := PI/2, col := Color.ORANGE_RED):
	var init_dist = 250+randi()%50
	for i in range(30):
		var vec = Vector2(init_dist+randi()%10,0).rotated(angle - PI/12 + i*2*PI/(12*30))
		var d := int((32-i) * 0.5)
		var apos = $CenterBottom.position + vec
		var color = col.lightened(0.2+0.4*i/30)
		$Canvas.paint(apos, int((7+randi()%d)), color)
		
		if randi() % 40 == 1:
			var drip = preload("res://Prefabs/drip.tscn").instantiate()
			drip.canvas = $Canvas
			drip.position = apos
			drip.color = color
			add_child(drip)
			
		await get_tree().create_timer(0.01).timeout
	var shield = preload("res://Prefabs/shield.tscn").instantiate()
	shield.position = $CenterBottom.position + Vector2(init_dist+randi()%10,0).rotated(angle - PI/12 + 15*2*PI/(12*30))
	shield.rotation = angle + PI/2
	add_child(shield)

func slash(angle := PI/2, col := Color.ORANGE_RED):
	var paint := preload("res://Prefabs/paint.tscn").instantiate()
	paint.canvas = $Canvas
	paint.position = $CenterBottom.position
	paint.dir = Vector2(1,0).rotated(angle)
	paint.speed = 600
	paint.timeout = 0.33
	paint.size_mult = 2
	paint.ifrac = 1
	paint.visible = false
	add_child(paint)

func _on_ink_grow_timer_timeout():
	ink_grow_mult = 1
