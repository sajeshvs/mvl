from docx.shared import RGBColor

c = RGBColor(245, 245, 245)
print("RGBColor attributes:")
print(dir(c))
print(f"\nHas _r: {hasattr(c, '_r')}")
print(f"Has rgb: {hasattr(c, 'rgb')}")

# Try to access attributes
try:
    print(f"c._r = {c._r}")
except:
    print("No _r attribute")

# Check what it actually is
print(f"\nType: {type(c)}")
print(f"Value: {c}")
print(f"String: {str(c)}")
print(f"Repr: {repr(c)}")
