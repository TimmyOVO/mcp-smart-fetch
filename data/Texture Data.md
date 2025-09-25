### **Texture Data (glTF 2.0 Specification)**

This section defines the structure and semantics for handling texture data in glTF 2.0, which is decomposed into three distinct but interrelated object types: **Textures**, **Images**, and **Samplers**. This separation allows for modular reuse and efficient resource management.

---

#### **3.8.1. Overview**

glTF 2.0 separates texture access into three distinct object types:

- **Textures**: Reference an image and a sampler to define how the image is applied.
- **Images**: Contain the actual pixel data, either via URI, Data URI, or buffer view.
- **Samplers**: Define filtering and wrapping behavior for sampling the image.

This modular design enables efficient sharing of images and samplers across multiple textures and materials.

---

#### **3.8.2. Textures**

Textures are stored in the `textures` array of the glTF asset. Each texture object defines:

- **`source`**: Index of the image to be used (required).
- **`sampler`**: Index of the sampler to use for filtering and wrapping (optional).

**Example:**
```json
{
  "textures": [
    {
      "sampler": 0,
      "source": 2
    }
  ]
}
```

- **Static 2D Only**: glTF 2.0 supports only static 2D textures (no cube maps, 3D textures, or arrays).
- **Undefined Source**: If `texture.source` is undefined, the image **SHOULD** be provided by an extension or application-specific mechanism; otherwise, the texture is considered undefined (clients may render a placeholder, e.g., magenta).
- **Undefined Sampler**: If `texture.sampler` is undefined, a default sampler **MUST** be used:
  - **Wrapping**: Repeat in both S and T directions.
  - **Filtering**: Auto-filtering (implementation-defined, typically linear).

---

#### **3.8.3. Images**

Images are stored in the `images` array. Each image defines the source of pixel data using one of three methods:

1. **`uri`**: A URI (or IRI) to an external image file (e.g., `.png`, `.jpg`).
2. **`data:` URI**: Embedded base64-encoded image data (e.g., `data:image/png;base64,...`).
3. **`bufferView`**: Reference to a buffer view containing raw image data (requires `mimeType`).

**Example:**
```json
{
  "images": [
    {
      "uri": "duckCM.png"
    },
    {
      "bufferView": 14,
      "mimeType": "image/jpeg"
    }
  ]
}
```

**Requirements:**
- **`mimeType`**: Must be defined **only** if `bufferView` is used.
- **Valid MIME Types**: `image/png`, `image/jpeg`.
- **Media Type Detection**: Client implementations **SHOULD** use the following byte signatures to auto-detect format if `mimeType` is missing:
  - **PNG**: `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`
  - **JPEG**: `0xFF 0xD8 0xFF`
- **Colorspace Handling**: All embedded color information (ICC profiles, gamma, etc.) **MUST** be ignored. The effective transfer function is determined by the material using the texture (typically sRGB for base color, linear for others).
- **WebGL Note**: To ignore embedded color profiles, set `UNPACK_COLORSPACE_CONVERSION_WEBGL` to `NONE`.

**Texture Coordinate Origin**:  
The origin `(0.0, 0.0)` corresponds to the **upper-left corner** of the image.  
`(1.0, 1.0)` corresponds to the **lower-right corner**.

---

#### **3.8.4. Samplers**

Samplers define how texture data is sampled and are stored in the `samplers` array. Each sampler specifies:

- **`magFilter`**: Magnification filter (when texture is enlarged).
- **`minFilter`**: Minification filter (when texture is reduced).
- **`wrapS`**: Wrapping mode for S (U) coordinate.
- **`wrapT`**: Wrapping mode for T (V) coordinate.

**Integer Enum Values (WebGL-compatible):**

| Mode | Value | Description |
|------|-------|-------------|
| **NEAREST** | `9728` | Nearest neighbor sampling |
| **LINEAR** | `9729` | Linear interpolation |
| **NEAREST_MIPMAP_NEAREST** | `9984` | Nearest mipmap, nearest texel |
| **LINEAR_MIPMAP_NEAREST** | `9985` | Nearest mipmap, linear texel |
| **NEAREST_MIPMAP_LINEAR** | `9986` | Linear mipmap, nearest texel |
| **LINEAR_MIPMAP_LINEAR** | `9987` | Trilinear filtering (linear mipmap + linear texel) |
| **CLAMP_TO_EDGE** | `33071` | Clamp to edge texel |
| **MIRRORED_REPEAT** | `33648` | Mirror and repeat |
| **REPEAT** | `10497` | Repeat (tile) |

##### **3.8.4.1. Overview**

- **Filtering**: Client implementations **SHOULD** follow specified modes. If undefined, defaults are implementation-defined.
- **Wrapping**: Client implementations **MUST** follow specified wrapping modes.

##### **3.8.4.2. Filtering**

- **Magnification (`magFilter`)**:
  - `NEAREST`: Use nearest texel.
  - `LINEAR`: Linear interpolation between 4 neighboring texels (bilinear).

- **Minification (`minFilter`)**:
  - `NEAREST`, `LINEAR`: As above, applied to base image.
  - `MIPMAP_*`: Use precomputed smaller versions of the image (mipmaps).
    - `NEAREST_MIPMAP_NEAREST`: Pick nearest mipmap level, then nearest texel.
    - `LINEAR_MIPMAP_LINEAR`: Pick two nearest mipmap levels, linearly interpolate between them (trilinear).

**Fallback for Non-Mipmap Platforms**:  
If runtime mipmap generation is unsupported, implementers **SHOULD** fall back as follows:

| Original Mode | Fallback |
|---------------|----------|
| `NEAREST_MIPMAP_NEAREST` | `NEAREST` |
| `LINEAR_MIPMAP_NEAREST` | `LINEAR` |
| `NEAREST_MIPMAP_LINEAR` | `NEAREST` |
| `LINEAR_MIPMAP_LINEAR` | `LINEAR` |

##### **3.8.4.3. Wrapping**

Texture coordinates are normalized to `[0.0, 1.0]` (not to be confused with accessor `normalized` flag).

| Mode | Behavior |
|------|----------|
| **REPEAT** | Use fractional part of coordinate. `2.2 → 0.2`, `-0.4 → 0.6` |
| **MIRRORED_REPEAT** | Repeat, but flip direction when integer part is odd. `2.2 → 0.2`, `-0.4 → 0.4` |
| **CLAMP_TO_EDGE** | Clamp to [0.0, 1.0]. Values outside map to nearest edge texel. |

##### **3.8.4.4. Example**

Sampler with linear magnification, trilinear minification, and repeat wrapping:

```json
{
  "samplers": [
    {
      "magFilter": 9729,
      "minFilter": 9987,
      "wrapS": 10497,
      "wrapT": 10497
    }
  ]
}
```

##### **3.8.4.5. Non-Power-of-Two Textures**

Client implementations **SHOULD** resize non-power-of-two (NPOT) textures to power-of-two dimensions **if**:

- The sampler uses `REPEAT` or `MIRRORED_REPEAT` wrapping, **or**
- The minification filter uses any mipmap mode (`*_MIPMAP_*`).

> **Note**: Modern GPUs support NPOT textures natively, but legacy platforms (e.g., some mobile devices) may require resizing for compatibility.

---

### **Summary of Texture Data Structure**

| Object | Purpose | Required Fields | Optional Fields |
|--------|---------|-----------------|-----------------|
| **Image** | Contains pixel data | One of: `uri`, `bufferView` | `mimeType`, `name`, `extensions`, `extras` |
| **Sampler** | Defines sampling behavior | None (defaults apply) | `magFilter`, `minFilter`, `wrapS`, `wrapT`, `name`, `extensions`, `extras` |
| **Texture** | Links image and sampler | `source` | `sampler`, `name`, `extensions`, `extras` |

> **Note**: Textures are referenced by materials via `normalTexture`, `occlusionTexture`, `emissiveTexture`, and `baseColorTexture` properties, each using a `TextureInfo` object (`index`, `texCoord`).

---

### **TextureInfo Reference (for Material Usage)**

Texture references in materials use the `TextureInfo` object:

```json
{
  "index": 0,          // Index of texture in textures array
  "texCoord": 0        // Index of TEXCOORD_n attribute (e.g., TEXCOORD_0)
}
```

- **`index`**: Required — index into `textures` array.
- **`texCoord`**: Optional, default `0` — selects which UV set to use (e.g., `TEXCOORD_0`, `TEXCOORD_1`).

This structure is used by:
- `baseColorTexture`
- `metallicRoughnessTexture`
- `normalTexture`
- `occlusionTexture`
- `emissiveTexture`

> **Note**: The `texCoord` value must correspond to an attribute in the mesh primitive (e.g., `TEXCOORD_0` must exist in `mesh.primitives.attributes`).