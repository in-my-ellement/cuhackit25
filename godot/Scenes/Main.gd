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
var damping1 = 0.05
var damping2 = 0.03
var damping3 = 0.07
var damping4 = 0.02  # New component

# Base height variation parameters
var variation_amplitude = 0.8
var variation_scale = 0.05

# Turbulence parameters
var turbulence_strength = 0.1
var turbulence_scale = 20.0
var noise = FastNoiseLite.new()

func _ready():
	return
	create_enemies()
	

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

func create_enemies():
	
	var topleft : Vector2 = $TopLeft.position
	var vlen : float = $TopRight.position.x - $TopLeft.position.x
	
	var opps = 10
	for i in range(opps):
		var enemy := preload("res://Prefabs/enemy.tscn").instantiate()
		enemy.position = topleft + Vector2(i*vlen/(opps-1), 0)
		enemy.target = $CenterBottom
		enemy.canvas = $Canvas
		add_child(enemy)

var time := 0.0
func _process(delta):
	time += delta
	var poly = []
	poly.append($TopRight.position)
	poly.append($TopLeft.position)
	#poly.append($TopLeft.position + Vector2(0,20))
	#poly.append($TopRight.position + Vector2(0,20))
	var dist = $TopRight.position.x - $TopLeft.position.x
	var sampling = 250
	for i in range(sampling):
		var h = height(i * 950 / sampling, time)
		poly.append(Vector2( $TopLeft.position.x + i * dist / (sampling - 1), $TopLeft.position.y + 160 + h))
	$Ink.polygon = poly
