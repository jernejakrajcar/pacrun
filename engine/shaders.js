const vertex = `#version 300 es

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 3) in vec2 aTexCoord;

uniform float uAmbient;
uniform float uDiffuse;

uniform mat4 uModelViewProjection;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uLightAttenuation;

out vec2 vTexCoord;
out vec3 vLight;

void main() {
    vec4 vertexPosition = (uModelViewProjection * aPosition);
    vec4 lightPosition = (uModelViewProjection * vec4(uLightPosition, 1));
    float d = distance(vertexPosition, lightPosition);
    float attenuation = 1.0 / dot(uLightAttenuation, vec3(1, d, d * d));

    vec4 N = normalize((uModelViewProjection * vec4(aNormal, 0)));
    vec4 L = normalize(lightPosition - vertexPosition);

    float lambert  = max(0.0, dot(L,N));

    float ambient = uAmbient;

    float diffuse = uDiffuse * lambert;

    vTexCoord = aTexCoord;
    vLight = attenuation * (diffuse + ambient) * uLightColor;
    gl_Position = uModelViewProjection * aPosition;
}
`;

const fragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseColorTexture;
uniform vec4 uBaseColorFactor;

in vec2 vTexCoord;
in vec3 vLight;

out vec4 oColor;

void main() {
    vec4 baseColor = texture(uBaseColorTexture, vTexCoord) * vec4(vLight, 1);
    oColor = uBaseColorFactor * baseColor;
}
`;

export const shaders = {
    simple: { vertex, fragment }
};
