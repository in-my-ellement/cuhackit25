extends Sprite2D

var image: Image
var imtexture: ImageTexture

func _ready():
	# Create a blank white image (adjust size as needed)
	image = Image.create(1776, 872, false, Image.FORMAT_RGBA8)
	image.fill(Color(1, 1, 1, 1))  # Fill with white
	
	# Create a texture from the image
	imtexture = ImageTexture.create_from_image(image)
	texture = imtexture

func paint(pos: Vector2, radius: int, color: Color):
	pos -= position
	
	var x = int(pos.x)
	var y = int(pos.y)
	
	# Loop over pixels within the circle radius
	for dx in range(-radius, radius):
		for dy in range(-radius, radius):
			var tx = x + dx
			var ty = y + dy
			if tx < 0 or ty < 0 or tx > 1776 or ty > 872:
				continue
			if Vector2(dx, dy).length() <= radius:  # Check if inside the circle
				image.set_pixel(tx, ty, color)  # Overwrite pixel color
	
	texture.update(image)  # Apply changes to the texture

func _input(event):
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		paint(event.position - global_position, 10, Color(1, 0, 0, 1)) 
