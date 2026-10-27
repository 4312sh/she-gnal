import bpy, math, sys
args = sys.argv[sys.argv.index('--')+1:]
glb, out, frame_mode = args[0], args[1], args[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
obj = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
me = obj.data
print('verts', len(me.vertices), 'attrs', [a.name for a in me.color_attributes])
# smooth shading (no normals in file)
me.shade_smooth() if hasattr(me,'shade_smooth') else None
# material from vertex color
mat = bpy.data.materials.new('eio'); mat.use_nodes = True
nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']
vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = me.color_attributes[0].name
nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Metallic'].default_value = 0.2
bsdf.inputs['Roughness'].default_value = 0.12
bsdf.inputs['Coat Weight'].default_value = 0.6
bsdf.inputs['Coat Roughness'].default_value = 0.05
me.materials.clear(); me.materials.append(mat)
# pivot at feet: parent to empty at bottom
bb = [obj.matrix_world @ __import__('mathutils').Vector(c) for c in obj.bound_box]
zmin = min(v.z for v in bb); zmax = max(v.z for v in bb)
print('z', zmin, zmax, 'x', min(v.x for v in bb), max(v.x for v in bb), 'y', min(v.y for v in bb), max(v.y for v in bb))
piv = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(piv)
piv.location = (0, 0, zmin)
bpy.context.view_layer.update(); obj.parent = piv; obj.matrix_parent_inverse = piv.matrix_world.inverted()
sc = bpy.context.scene
sc.render.fps = 24; sc.frame_start = 1; sc.frame_end = 96
N = 96
for f in range(1, N+1):
    t = (f-1)/N*2*math.pi
    piv.rotation_euler = (0, math.radians(1.2)*math.sin(t), math.radians(8)*math.sin(t))
    piv.keyframe_insert('rotation_euler', frame=f)
for fc in (piv.animation_data.action.fcurves if hasattr(piv.animation_data.action,'fcurves') else []):
    for k in fc.keyframe_points: k.interpolation = 'LINEAR'
# camera: front (-Y), framing head to hips
cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'
camo = bpy.data.objects.new('cam', cam); sc.collection.objects.link(camo)
# visible window: z from zmax+0.06 down to ~ -0.12 (hips) -> height
top = zmax + 0.07; bot = zmax - 1.2
cam.ortho_scale = (top - bot)  # vertical size since portrait
camo.location = (0, -6, (top+bot)/2); camo.rotation_euler = (math.radians(90), 0, 0)
sc.camera = camo
sc.render.resolution_x = 557*2//2; sc.render.resolution_y = 918
cam.sensor_fit = 'VERTICAL'
# world: soft sky-blue
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.55, 0.85, 0.95, 1); bg.inputs[1].default_value = 0.9
def area(name, loc, rot, energy, size, color=(1,1,1)):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = size; l.color = color
    o = bpy.data.objects.new(name, l); o.location = loc; o.rotation_euler = [math.radians(a) for a in rot]; sc.collection.objects.link(o)
area('key', (-2.5, -3, 1.5), (60, 0, -40), 600, 3)
area('fill', (3, -2.5, 0.5), (75, 0, 50), 250, 4, (0.85, 0.92, 1))
area('rim', (0, 3, 2), (-60, 0, 180), 400, 2, (0.8, 0.95, 1))
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = int(args[3]) if len(args)>3 else 32
sc.cycles.use_denoising = True
sc.render.film_transparent = True; sc.render.use_persistent_data = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
sc.render.filepath = out
if frame_mode == 'still':
    sc.frame_set(25); bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
